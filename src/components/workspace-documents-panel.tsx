"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  deleteWorkspaceDocument,
  listWorkspaceDocuments,
  uploadWorkspaceDocumentToLibrary,
} from "@/app/actions/workspace-documents";
import { WorkspaceDocumentRow } from "@/components/workspace-document-row";
import type { WorkspaceDocumentSource } from "@/lib/import-types";

type WorkspaceDocumentItem = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  source: WorkspaceDocumentSource;
  created_at: string;
  expires_at: string;
};

type WorkspaceDocumentsPanelProps = {
  workspaceId: string;
};

export function WorkspaceDocumentsPanel({ workspaceId }: WorkspaceDocumentsPanelProps) {
  const [documents, setDocuments] = useState<WorkspaceDocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadKey, setUploadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasDocuments = documents.length > 0;

  const loadDocuments = () => {
    setError(null);
    startTransition(async () => {
      try {
        const rows = await listWorkspaceDocuments(workspaceId);
        setDocuments(rows as WorkspaceDocumentItem[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load documents.");
      }
    });
  };

  useEffect(() => {
    setDocuments([]);
    setError(null);
    setFeedback(null);
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleUpload = (formData: FormData) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        await uploadWorkspaceDocumentToLibrary(workspaceId, formData);
        setFeedback("Document uploaded.");
        setUploadKey((prev) => prev + 1);
        const rows = await listWorkspaceDocuments(workspaceId);
        setDocuments(rows as WorkspaceDocumentItem[]);
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : "Could not upload document.";
        setError(message);
      }
    });
  };

  const handleDelete = (documentId: string) => {
    setError(null);
    setFeedback(null);
    setDeletingId(documentId);
    startTransition(async () => {
      try {
        await deleteWorkspaceDocument(workspaceId, documentId);
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        setFeedback("Document removed.");
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Could not delete document.";
        setError(message);
      } finally {
        setDeletingId(null);
      }
    });
  };

  const uploadAccept = useMemo(
    () =>
      ".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/x-markdown",
    []
  );

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm">
      <div className="mb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Workspace Documents
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          Used as context for AI responses in this workspace.
        </p>
      </div>

      <form action={handleUpload} className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2">
        <div className="flex flex-col gap-2">
          <input
            key={uploadKey}
            name="file"
            type="file"
            accept={uploadAccept}
            className="text-xs text-zinc-700 file:mr-2 file:rounded-full file:border file:border-zinc-200 file:bg-white file:px-2 file:py-1"
          />
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
          >
            Add document
          </button>
        </div>
      </form>

      {feedback && <p className="mb-2 text-xs text-emerald-700">{feedback}</p>}
      {error && <p className="mb-2 text-xs text-rose-700">{error}</p>}

      {hasDocuments ? (
        <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
          {documents.map((document) => (
            <WorkspaceDocumentRow
              key={document.id}
              document={document}
              deleting={deletingId === document.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          No documents yet. Add DOCX, PDF, MD, or TXT files to enrich AI context.
        </p>
      )}
    </div>
  );
}
