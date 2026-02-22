"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createWorkspace,
  deleteWorkspace,
  updateWorkspaceName,
} from "@/app/actions/workspaces";
import { DeleteWorkspaceDialog } from "@/components/dashboard/delete-workspace-dialog";
import type { WorkspaceSummary } from "@/lib/workspace-selection";

type WorkspacesCardProps = {
  initialWorkspaces: WorkspaceSummary[];
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function WorkspacesCard({ initialWorkspaces }: WorkspacesCardProps) {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [draftNames, setDraftNames] = useState<Record<string, string>>(
    () =>
      initialWorkspaces.reduce<Record<string, string>>((acc, workspace) => {
        acc[workspace.id] = workspace.name;
        return acc;
      }, {})
  );
  const [newWorkspaceName, setNewWorkspaceName] = useState("My Strategy");
  const [pendingDelete, setPendingDelete] = useState<WorkspaceSummary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const workspaceById = useMemo(
    () =>
      workspaces.reduce<Record<string, WorkspaceSummary>>((acc, workspace) => {
        acc[workspace.id] = workspace;
        return acc;
      }, {}),
    [workspaces]
  );

  const handleCreate = () => {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const created = await createWorkspace(newWorkspaceName.trim() || "My Strategy");
        const createdWorkspace = created as WorkspaceSummary;
        setWorkspaces((prev) => [createdWorkspace, ...prev]);
        setDraftNames((prev) => ({ ...prev, [createdWorkspace.id]: createdWorkspace.name }));
        setFeedback(`Workspace "${createdWorkspace.name}" created.`);
        router.refresh();
      } catch (createError) {
        const message =
          createError instanceof Error ? createError.message : "Could not create workspace.";
        setError(message);
      }
    });
  };

  const handleRename = (workspaceId: string) => {
    const workspace = workspaceById[workspaceId];
    const nextName = (draftNames[workspaceId] ?? "").trim();

    if (!workspace || !nextName || nextName === workspace.name) {
      return;
    }

    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await updateWorkspaceName(workspaceId, nextName);
        setWorkspaces((prev) =>
          prev.map((entry) =>
            entry.id === workspaceId ? { ...entry, name: nextName } : entry
          )
        );
        setFeedback(`Workspace renamed to "${nextName}".`);
        router.refresh();
      } catch (renameError) {
        const message =
          renameError instanceof Error ? renameError.message : "Could not rename workspace.";
        setError(message);
      }
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) {
      return;
    }

    const workspaceId = pendingDelete.id;
    const workspaceName = pendingDelete.name;

    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await deleteWorkspace(workspaceId);
        setWorkspaces((prev) => prev.filter((workspace) => workspace.id !== workspaceId));
        setPendingDelete(null);
        setFeedback(`Workspace "${workspaceName}" deleted.`);
        router.refresh();
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Could not delete workspace.";
        setError(message);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Workspaces</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Create, rename, delete, or open your strategy workspaces.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
        <input
          value={newWorkspaceName}
          onChange={(event) => setNewWorkspaceName(event.target.value)}
          className="h-10 min-w-[220px] flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
          placeholder="Workspace name"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Create Workspace
        </button>
      </div>

      <div className="space-y-3">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="rounded-xl border border-zinc-200 bg-white p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-zinc-500">
                Created {formatDate(workspace.created_at)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={{ pathname: "/canvas", query: { workspace: workspace.id } }}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(workspace)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:border-rose-300"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={draftNames[workspace.id] ?? workspace.name}
                onChange={(event) =>
                  setDraftNames((prev) => ({
                    ...prev,
                    [workspace.id]: event.target.value,
                  }))
                }
                className="h-9 min-w-[220px] flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={() => handleRename(workspace.id)}
                disabled={isPending}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
              >
                Save Name
              </button>
            </div>
          </div>
        ))}

        {workspaces.length === 0 && (
          <p className="text-sm text-zinc-500">No workspaces yet. Create your first one above.</p>
        )}
      </div>

      {feedback && <p className="mt-3 text-sm text-emerald-700">{feedback}</p>}
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      {pendingDelete && (
        <DeleteWorkspaceDialog
          workspaceName={pendingDelete.name}
          isPending={isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}
