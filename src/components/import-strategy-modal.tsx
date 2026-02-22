"use client";

import { useState, useTransition } from "react";
import {
  applyImportRun,
  generateImportPreview,
  listImportRuns,
  uploadWorkspaceDocument,
} from "@/app/actions/imports";
import type { ImportPreviewResult } from "@/lib/import-types";

type ImportStrategyModalProps = {
  workspaceId: string;
};

type ImportStage = "idle" | "uploaded" | "preview" | "applied";

export function ImportStrategyModal({ workspaceId }: ImportStrategyModalProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stage, setStage] = useState<ImportStage>("idle");
  const [documentName, setDocumentName] = useState<string>("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [recentRuns, setRecentRuns] = useState<
    Array<{
      id: string;
      status: string;
      applied_fields_count: number;
      skipped_fields_count: number;
      created_at: string;
    }>
  >([]);
  const [isPending, startTransition] = useTransition();

  const resetState = () => {
    setError(null);
    setSuccess(null);
    setStage("idle");
    setDocumentName("");
    setDocumentId(null);
    setPreview(null);
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    startTransition(async () => {
      try {
        const runs = await listImportRuns(workspaceId);
        setRecentRuns(
          runs.map((run) => ({
            id: run.id as string,
            status: run.status as string,
            applied_fields_count: Number(run.applied_fields_count ?? 0),
            skipped_fields_count: Number(run.skipped_fields_count ?? 0),
            created_at: run.created_at as string,
          }))
        );
      } catch {
        setRecentRuns([]);
      }
    });
  };

  const handleUploadSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const uploaded = await uploadWorkspaceDocument(workspaceId, formData);
        setDocumentId(uploaded.documentId);
        setDocumentName(uploaded.filename);
        setStage("uploaded");
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : "Upload failed.";
        setError(message);
      }
    });
  };

  const handlePreview = () => {
    if (!documentId) {
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await generateImportPreview(workspaceId, documentId);
        setPreview(result);
        setStage("preview");
      } catch (previewError) {
        const message =
          previewError instanceof Error ? previewError.message : "Could not generate preview.";
        setError(message);
      }
    });
  };

  const handleApply = () => {
    if (!preview?.runId) {
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await applyImportRun(workspaceId, preview.runId);
        setSuccess(
          `Import applied. ${result.appliedFieldsCount} fields filled, ${result.skippedFieldsCount} skipped.`
        );
        setStage("applied");
      } catch (applyError) {
        const message =
          applyError instanceof Error ? applyError.message : "Could not apply import.";
        setError(message);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="h-9 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:border-zinc-300"
        onClick={handleOpen}
      >
        Import Strategy
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Import Strategy Document</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Upload a DOCX/PDF, preview mapped fields, then apply only to empty fields.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-300"
                onClick={() => {
                  setOpen(false);
                  resetState();
                }}
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <form action={handleUploadSubmit} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="max-w-[280px] text-sm text-zinc-700 file:mr-3 file:rounded-full file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1 file:text-sm"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  Upload
                </button>
                {documentName && (
                  <span className="text-sm text-zinc-600">Uploaded: {documentName}</span>
                )}
              </div>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!documentId || isPending}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
              >
                Generate Preview
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!preview?.runId || isPending}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                Apply to Empty Fields
              </button>
              <span className="text-xs text-zinc-500">Current stage: {stage}</span>
            </div>

            {preview && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-sm text-zinc-700">
                  {preview.totals.mapped} mapped, {preview.totals.willApply} will apply,{" "}
                  {preview.totals.willSkip} will skip.
                </div>

                {preview.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    {preview.warnings.map((warning) => (
                      <div key={warning}>{warning}</div>
                    ))}
                  </div>
                )}

                <div className="max-h-[380px] space-y-3 overflow-auto pr-1">
                  {preview.groups.map((group) => (
                    <div key={group.stepId} className="rounded-xl border border-zinc-200 p-3">
                      <div className="mb-2 text-sm font-semibold text-zinc-800">
                        Step {group.stepId}: {group.stepTitle}
                      </div>
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div key={item.fieldKey} className="rounded-lg border border-zinc-200/80 bg-white p-2">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <div className="text-xs font-medium text-zinc-700">{item.fieldLabel}</div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  item.willApply
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-zinc-100 text-zinc-600"
                                }`}
                              >
                                {item.willApply ? "Will Apply" : "Will Skip"}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-600">{item.proposedContent}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentRuns.length > 0 && (
              <div className="mt-4 border-t border-zinc-200 pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Recent Imports
                </div>
                <div className="space-y-1 text-xs text-zinc-600">
                  {recentRuns.map((run) => (
                    <div key={run.id}>
                      {new Date(run.created_at).toLocaleString()} - {run.status} - applied{" "}
                      {run.applied_fields_count}, skipped {run.skipped_fields_count}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

