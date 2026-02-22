"use client";

type DeleteWorkspaceDialogProps = {
  workspaceName: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteWorkspaceDialog({
  workspaceName,
  isPending = false,
  onCancel,
  onConfirm,
}: DeleteWorkspaceDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-900">Delete Workspace?</h3>
        <p className="mt-2 text-sm text-zinc-600">
          This action cannot be undone. Workspace{" "}
          <span className="font-medium text-zinc-900">{workspaceName}</span> and all
          step entries will be permanently removed.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Delete Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

