"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  fileExtension,
  getImportExpirationIso,
  getImportMaxFileBytes,
  IMPORT_BUCKET,
} from "@/lib/import-config";
import type { WorkspaceDocumentSource } from "@/lib/import-types";

type WorkspaceOwnershipRow = {
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
  size_bytes: number;
  status: string;
  source: WorkspaceDocumentSource;
  created_at: string;
  expires_at: string;
};

const LIBRARY_ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "md", "txt"]);
const LIBRARY_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);

const MAX_DRAFT_CONTENT = 20000;

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  return { supabase, user };
}

async function assertWorkspaceOwnership(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  workspaceId: string,
  userId: string
) {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id,user_id")
    .eq("id", workspaceId)
    .maybeSingle<WorkspaceOwnershipRow>();

  if (error || !workspace || workspace.user_id !== userId) {
    throw new Error("Workspace not found or access denied.");
  }
}

function getWorkspaceDocMaxBytes() {
  const raw = Number(process.env.WORKSPACE_DOC_MAX_FILE_MB ?? "");
  if (Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw * 1024 * 1024);
  }
  return getImportMaxFileBytes();
}

function ensureLibraryFileAllowed(file: File) {
  const ext = fileExtension(file.name);
  const type = file.type.toLowerCase();
  if (!LIBRARY_ALLOWED_EXTENSIONS.has(ext) && !LIBRARY_ALLOWED_MIME_TYPES.has(type)) {
    throw new Error("Unsupported file type. Upload DOCX, PDF, MD, or TXT.");
  }

  const maxBytes = getWorkspaceDocMaxBytes();
  if (file.size > maxBytes) {
    throw new Error(`File exceeds max size of ${Math.floor(maxBytes / (1024 * 1024))}MB.`);
  }
}

function sanitizeDraftTitle(title: string | undefined) {
  const cleaned = (title ?? "").trim().replace(/[^\w\s-]/g, "");
  if (!cleaned) {
    return `AI Draft ${new Date().toISOString().slice(0, 10)}`;
  }
  return cleaned.slice(0, 80);
}

function normalizeFilename(baseTitle: string) {
  const slug = baseTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "ai-draft"}.md`;
}

export async function listWorkspaceDocuments(workspaceId: string) {
  const { supabase, user } = await requireUser();
  await assertWorkspaceOwnership(supabase, workspaceId, user.id);

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("workspace_documents")
    .select(
      "id,filename,mime_type,size_bytes,status,source,created_at,expires_at,workspace_id,user_id,storage_path"
    )
    .eq("workspace_id", workspaceId)
    .gt("expires_at", nowIso)
    .neq("status", "expired")
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .returns<WorkspaceDocumentRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    filename: row.filename,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    status: row.status,
    source: row.source,
    created_at: row.created_at,
    expires_at: row.expires_at,
  }));
}

export async function uploadWorkspaceDocumentToLibrary(
  workspaceId: string,
  formData: FormData
) {
  const { supabase, user } = await requireUser();
  await assertWorkspaceOwnership(supabase, workspaceId, user.id);

  const entry = formData.get("file");
  if (!(entry instanceof File)) {
    throw new Error("No file provided.");
  }
  ensureLibraryFileAllowed(entry);

  const sourceRaw = String(formData.get("source") ?? "import");
  const source: WorkspaceDocumentSource =
    sourceRaw === "landing_intake" || sourceRaw === "chat_draft" ? sourceRaw : "import";

  const documentId = randomUUID();
  const extension = fileExtension(entry.name) || "bin";
  const storagePath = `${user.id}/${workspaceId}/${documentId}.${extension}`;
  const contentType = entry.type || "application/octet-stream";

  const { error: uploadError } = await supabase.storage
    .from(IMPORT_BUCKET)
    .upload(storagePath, new Uint8Array(await entry.arrayBuffer()), {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: created, error: insertError } = await supabase
    .from("workspace_documents")
    .insert({
      id: documentId,
      workspace_id: workspaceId,
      user_id: user.id,
      storage_path: storagePath,
      filename: entry.name,
      mime_type: contentType,
      size_bytes: entry.size,
      status: "uploaded",
      source,
      expires_at: getImportExpirationIso(),
    })
    .select("id,filename,mime_type,size_bytes,status,source,created_at,expires_at")
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message ?? "Could not save document metadata.");
  }

  revalidatePath("/canvas");
  revalidatePath("/step/2");
  revalidatePath("/dashboard");

  return created;
}

export async function deleteWorkspaceDocument(workspaceId: string, documentId: string) {
  const { supabase, user } = await requireUser();
  await assertWorkspaceOwnership(supabase, workspaceId, user.id);

  const { data: document, error: docError } = await supabase
    .from("workspace_documents")
    .select("id,workspace_id,user_id,storage_path")
    .eq("id", documentId)
    .maybeSingle<{
      id: string;
      workspace_id: string;
      user_id: string;
      storage_path: string;
    }>();

  if (docError || !document || document.workspace_id !== workspaceId || document.user_id !== user.id) {
    throw new Error("Document not found.");
  }

  const { error: removeError } = await supabase.storage
    .from(IMPORT_BUCKET)
    .remove([document.storage_path]);

  if (removeError) {
    throw new Error(removeError.message);
  }

  const { error: deleteError } = await supabase
    .from("workspace_documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath("/canvas");
  revalidatePath("/step/2");
  revalidatePath("/dashboard");

  return { deleted: true as const };
}

export async function createWorkspaceDraftFromChat(
  workspaceId: string,
  input: { title?: string; content: string }
) {
  const content = (input.content ?? "").trim();
  if (!content) {
    throw new Error("Draft content is empty.");
  }
  if (content.length > MAX_DRAFT_CONTENT) {
    throw new Error(`Draft is too long. Limit to ${MAX_DRAFT_CONTENT} characters.`);
  }

  const title = sanitizeDraftTitle(input.title);
  const filename = normalizeFilename(title);
  const file = new File([`# ${title}\n\n${content}\n`], filename, {
    type: "text/markdown",
  });

  const formData = new FormData();
  formData.set("file", file);
  formData.set("source", "chat_draft");
  return uploadWorkspaceDocumentToLibrary(workspaceId, formData);
}
