import { createServerSupabaseClient } from "@/lib/supabase/server";
import { IMPORT_BUCKET } from "@/lib/import-config";
import { extractTextFromDocument } from "@/lib/import-parsers";
import { steps } from "@/lib/steps";
import type { WorkspaceDocumentSource } from "@/lib/import-types";

type StepEntryRow = {
  step_id: number;
  field_key: string;
  content: string | null;
};

type WorkspaceDocumentRow = {
  id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  status: "uploaded" | "processed" | "expired" | "failed";
  source: WorkspaceDocumentSource;
  expires_at: string;
  created_at: string;
};

export type AiContextStats = {
  docCount: number;
  truncatedDocCount: number;
  totalCharsUsed: number;
};

const DEFAULT_DOC_MAX_CHARS = 20000;
const DEFAULT_DOC_MAX_CHARS_PER_DOC = 4000;

function positiveIntFromEnv(raw: string | undefined, fallback: number) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getDocBudgetChars() {
  return positiveIntFromEnv(process.env.AI_DOC_CONTEXT_MAX_CHARS, DEFAULT_DOC_MAX_CHARS);
}

function getDocBudgetCharsPerDoc() {
  return positiveIntFromEnv(
    process.env.AI_DOC_CONTEXT_MAX_CHARS_PER_DOC,
    DEFAULT_DOC_MAX_CHARS_PER_DOC
  );
}

function trimToLimit(content: string, maxChars: number) {
  if (content.length <= maxChars) {
    return { value: content, truncated: false };
  }
  return {
    value: `${content.slice(0, maxChars).trim()}\n...[truncated]`,
    truncated: true,
  };
}

function buildWorkspaceEntriesContext(entries: StepEntryRow[]) {
  const grouped = new Map<number, Array<{ fieldKey: string; content: string }>>();

  for (const row of entries) {
    const cleaned = (row.content ?? "").trim();
    if (!cleaned) {
      continue;
    }

    const list = grouped.get(row.step_id) ?? [];
    list.push({
      fieldKey: row.field_key,
      content: cleaned,
    });
    grouped.set(row.step_id, list);
  }

  const lines: string[] = [];
  for (const step of steps) {
    lines.push(`Step ${step.id} - ${step.title}`);
    const list = grouped.get(step.id) ?? [];
    if (list.length === 0) {
      lines.push("- (no saved content)");
      continue;
    }
    for (const item of list) {
      lines.push(`- ${item.fieldKey}: ${item.content}`);
    }
  }

  return lines.join("\n");
}

export async function buildWorkspaceAiContext(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  workspaceId: string
) {
  const { data: entries, error: entriesError } = await supabase
    .from("step_entries")
    .select("step_id,field_key,content")
    .eq("workspace_id", workspaceId)
    .order("step_id", { ascending: true })
    .returns<StepEntryRow[]>();

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  const stepEntriesContext = buildWorkspaceEntriesContext(entries ?? []);

  const nowIso = new Date().toISOString();
  const { data: docs, error: docsError } = await supabase
    .from("workspace_documents")
    .select("id,filename,mime_type,storage_path,status,source,expires_at,created_at")
    .eq("workspace_id", workspaceId)
    .gt("expires_at", nowIso)
    .in("status", ["uploaded", "processed"])
    .order("created_at", { ascending: false })
    .returns<WorkspaceDocumentRow[]>();

  if (docsError) {
    throw new Error(docsError.message);
  }

  const budgetTotal = getDocBudgetChars();
  const budgetPerDoc = getDocBudgetCharsPerDoc();
  let remaining = budgetTotal;
  let truncatedDocCount = 0;
  let totalCharsUsed = 0;
  const chunks: string[] = [];

  for (const doc of docs ?? []) {
    if (remaining <= 0) {
      break;
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(IMPORT_BUCKET)
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      truncatedDocCount += 1;
      continue;
    }

    try {
      const file = new File([fileData], doc.filename, { type: doc.mime_type });
      const extracted = (await extractTextFromDocument(file)).trim();
      if (!extracted) {
        continue;
      }

      const perDocLimited = trimToLimit(extracted, budgetPerDoc);
      const finalLimited = trimToLimit(perDocLimited.value, remaining);
      if (perDocLimited.truncated || finalLimited.truncated) {
        truncatedDocCount += 1;
      }

      const used = finalLimited.value.length;
      if (used === 0) {
        continue;
      }

      remaining -= used;
      totalCharsUsed += used;
      chunks.push(
        [
          `Document: ${doc.filename}`,
          `Source: ${doc.source}`,
          finalLimited.value,
        ].join("\n")
      );
    } catch {
      truncatedDocCount += 1;
    }
  }

  const documentContext = chunks.length > 0 ? chunks.join("\n\n---\n\n") : "(no document context)";
  const contextStats: AiContextStats = {
    docCount: (docs ?? []).length,
    truncatedDocCount,
    totalCharsUsed,
  };

  return {
    stepEntriesContext,
    documentContext,
    contextStats,
  };
}
