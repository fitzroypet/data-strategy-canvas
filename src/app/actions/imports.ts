"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getFieldDefinition,
  type StepFieldDefinition,
} from "@/lib/field-catalog";
import {
  getImportExpirationIso,
  getImportMaxFileBytes,
  IMPORT_BUCKET,
  isSupportedImportFile,
  fileExtension,
} from "@/lib/import-config";
import { extractTextFromDocument } from "@/lib/import-parsers";
import { mapDocumentToFieldKeys } from "@/lib/openai-import-mapper";
import type {
  ApplyImportResult,
  ImportPreviewGroup,
  ImportPreviewResult,
} from "@/lib/import-types";

type WorkspaceRow = {
  id: string;
  user_id: string;
};

type WorkspaceDocumentRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  status: string;
};

type ImportRunRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  mapping_json: unknown;
  status: string;
};

type ExistingEntryRow = {
  field_key: string;
  content: string | null;
};

function ensureImportEnabled() {
  if (process.env.IMPORT_STRATEGY_ENABLED !== "true") {
    throw new Error("Import strategy is currently disabled.");
  }
}

async function getAuthenticatedUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthenticated");
  }

  return user.id;
}

async function assertWorkspaceOwnership(workspaceId: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,user_id")
    .eq("id", workspaceId)
    .single<WorkspaceRow>();

  if (error || !data || data.user_id !== userId) {
    throw new Error("Workspace not found or access denied.");
  }
}

function getFileFromFormData(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided.");
  }

  if (!isSupportedImportFile(file)) {
    throw new Error("Unsupported file type. Upload DOCX or PDF.");
  }

  const maxBytes = getImportMaxFileBytes();
  if (file.size > maxBytes) {
    throw new Error(`File exceeds max size of ${Math.floor(maxBytes / (1024 * 1024))}MB.`);
  }

  return file;
}

function groupPreviewItems(items: Array<ImportPreviewGroup["items"][number]>) {
  const grouped = new Map<number, ImportPreviewGroup>();
  for (const item of items) {
    const group = grouped.get(item.stepId) ?? {
      stepId: item.stepId,
      stepTitle: item.stepTitle,
      items: [],
    };
    group.items.push(item);
    grouped.set(item.stepId, group);
  }

  return Array.from(grouped.values()).sort((a, b) => a.stepId - b.stepId);
}

export async function uploadWorkspaceDocument(workspaceId: string, formData: FormData) {
  ensureImportEnabled();

  const userId = await getAuthenticatedUserId();
  await assertWorkspaceOwnership(workspaceId, userId);
  const file = getFileFromFormData(formData);

  const supabase = await createServerSupabaseClient();
  const documentId = randomUUID();
  const extension = fileExtension(file.name) || "bin";
  const storagePath = `${userId}/${workspaceId}/${documentId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(IMPORT_BUCKET)
    .upload(storagePath, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const payload = {
    id: documentId,
    workspace_id: workspaceId,
    user_id: userId,
    storage_path: storagePath,
    filename: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    status: "uploaded",
    expires_at: getImportExpirationIso(),
  };

  const { error: insertError } = await supabase.from("workspace_documents").insert(payload);
  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    documentId,
    filename: file.name,
  };
}

export async function generateImportPreview(
  workspaceId: string,
  documentId: string
): Promise<ImportPreviewResult> {
  ensureImportEnabled();

  const userId = await getAuthenticatedUserId();
  await assertWorkspaceOwnership(workspaceId, userId);
  const supabase = await createServerSupabaseClient();

  const { data: document, error: documentError } = await supabase
    .from("workspace_documents")
    .select("id,workspace_id,user_id,storage_path,filename,mime_type,status")
    .eq("id", documentId)
    .single<WorkspaceDocumentRow>();

  if (documentError || !document || document.workspace_id !== workspaceId || document.user_id !== userId) {
    throw new Error("Source document not found.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(IMPORT_BUCKET)
    .download(document.storage_path);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message ?? "Could not download source document.");
  }

  const file = new File([fileData], document.filename, { type: document.mime_type });
  const extractedText = await extractTextFromDocument(file);

  if (extractedText.trim().length < 120) {
    throw new Error("Could not extract enough text from this file. Please upload a text-based DOCX or PDF.");
  }

  const mappingResult = await mapDocumentToFieldKeys({ extractedText });

  const { data: existingRows, error: existingError } = await supabase
    .from("step_entries")
    .select("field_key,content")
    .eq("workspace_id", workspaceId)
    .in("field_key", Object.keys(mappingResult.mapping));

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByField = new Map<string, string>();
  for (const row of (existingRows ?? []) as ExistingEntryRow[]) {
    existingByField.set(row.field_key, row.content ?? "");
  }

  const previewItems: ImportPreviewGroup["items"] = [];
  for (const [fieldKey, proposedContent] of Object.entries(mappingResult.mapping)) {
    const definition = getFieldDefinition(fieldKey) as StepFieldDefinition | undefined;
    if (!definition) {
      continue;
    }

    const existing = existingByField.get(fieldKey)?.trim() ?? "";
    previewItems.push({
      fieldKey,
      fieldLabel: definition.fieldLabel,
      stepId: definition.stepId,
      stepTitle: definition.stepTitle,
      proposedContent,
      willApply: existing.length === 0,
    });
  }

  const runId = randomUUID();
  const { error: runError } = await supabase.from("import_runs").insert({
    id: runId,
    workspace_id: workspaceId,
    user_id: userId,
    source_document_id: documentId,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    status: "previewed",
    mapping_json: mappingResult.mapping,
  });

  if (runError) {
    throw new Error(runError.message);
  }

  const { error: updateDocumentError } = await supabase
    .from("workspace_documents")
    .update({ status: "processed" })
    .eq("id", documentId);

  if (updateDocumentError) {
    throw new Error(updateDocumentError.message);
  }

  const groups = groupPreviewItems(previewItems);
  const willApply = previewItems.filter((item) => item.willApply).length;
  const willSkip = previewItems.length - willApply;

  return {
    runId,
    warnings: mappingResult.warnings,
    groups,
    totals: {
      mapped: previewItems.length,
      willApply,
      willSkip,
    },
  };
}

export async function applyImportRun(
  workspaceId: string,
  runId: string
): Promise<ApplyImportResult> {
  ensureImportEnabled();

  const userId = await getAuthenticatedUserId();
  await assertWorkspaceOwnership(workspaceId, userId);
  const supabase = await createServerSupabaseClient();

  const { data: run, error: runError } = await supabase
    .from("import_runs")
    .select("id,workspace_id,user_id,mapping_json,status")
    .eq("id", runId)
    .single<ImportRunRow>();

  if (runError || !run || run.workspace_id !== workspaceId || run.user_id !== userId) {
    throw new Error("Import run not found.");
  }

  const mapping = (run.mapping_json ?? {}) as Record<string, string>;
  const mappedKeys = Object.keys(mapping);
  if (mappedKeys.length === 0) {
    throw new Error("Import run has no mapped fields.");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("step_entries")
    .select("field_key,content")
    .eq("workspace_id", workspaceId)
    .in("field_key", mappedKeys);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByField = new Map<string, string>();
  for (const row of (existingRows ?? []) as ExistingEntryRow[]) {
    existingByField.set(row.field_key, row.content ?? "");
  }

  let appliedFieldsCount = 0;
  let skippedFieldsCount = 0;
  const upserts: Array<{ workspace_id: string; step_id: number; field_key: string; content: string }> = [];

  for (const [fieldKey, content] of Object.entries(mapping)) {
    const definition = getFieldDefinition(fieldKey);
    if (!definition) {
      skippedFieldsCount += 1;
      continue;
    }

    const existing = existingByField.get(fieldKey)?.trim() ?? "";
    if (existing.length > 0) {
      skippedFieldsCount += 1;
      continue;
    }

    upserts.push({
      workspace_id: workspaceId,
      step_id: definition.stepId,
      field_key: fieldKey,
      content: content.trim(),
    });
    appliedFieldsCount += 1;
  }

  if (upserts.length > 0) {
    const { error: upsertError } = await supabase.from("step_entries").upsert(upserts, {
      onConflict: "workspace_id,step_id,field_key",
    });
    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  const { error: updateError } = await supabase
    .from("import_runs")
    .update({
      status: "applied",
      applied_fields_count: appliedFieldsCount,
      skipped_fields_count: skippedFieldsCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/");
  revalidatePath("/canvas");
  for (const stepId of [2, 3, 4, 5, 6]) {
    revalidatePath(`/step/${stepId}`);
  }

  return {
    appliedFieldsCount,
    skippedFieldsCount,
  };
}

export async function listImportRuns(workspaceId: string) {
  ensureImportEnabled();
  const userId = await getAuthenticatedUserId();
  await assertWorkspaceOwnership(workspaceId, userId);
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("import_runs")
    .select("id,status,model,applied_fields_count,skipped_fields_count,created_at,updated_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function expireWorkspaceDocuments() {
  const supabase = await createServerSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("workspace_documents")
    .select("id,storage_path")
    .lt("expires_at", nowIso)
    .neq("status", "expired")
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const documents = (rows ?? []) as Array<{ id: string; storage_path: string }>;
  if (documents.length === 0) {
    return { expiredCount: 0 };
  }

  const paths = documents.map((entry) => entry.storage_path);
  const { error: removeError } = await supabase.storage.from(IMPORT_BUCKET).remove(paths);
  if (removeError) {
    throw new Error(removeError.message);
  }

  const ids = documents.map((entry) => entry.id);
  const { error: updateError } = await supabase
    .from("workspace_documents")
    .update({ status: "expired" })
    .in("id", ids);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { expiredCount: ids.length };
}
