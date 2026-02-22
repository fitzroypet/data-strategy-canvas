"use client";

import { useState } from "react";
import type { WorkspaceDocumentSource } from "@/lib/import-types";

type WorkspaceDocumentRowProps = {
  document: {
    id: string;
    filename: string;
    size_bytes: number;
    source: WorkspaceDocumentSource;
    created_at: string;
  };
  deleting: boolean;
  onDelete: (documentId: string) => void;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 KB";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorkspaceDocumentRow({
  document,
  deleting,
  onDelete,
}: WorkspaceDocumentRowProps) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-zinc-800">{document.filename}</div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {formatBytes(document.size_bytes)} • {formatDate(document.created_at)}
          </div>
        </div>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
          {document.source}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {!confirm ? (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="rounded-full border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-700 hover:border-rose-300"
          >
            Remove
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(document.id)}
              className="rounded-full bg-rose-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-rose-500 disabled:opacity-60"
            >
              Confirm remove
            </button>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="rounded-full border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:border-zinc-300"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
