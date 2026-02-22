"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createWorkspace } from "@/app/actions/workspaces";
import { buildWorkspacePath, type WorkspaceSummary } from "@/lib/workspace-selection";

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
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

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const options = useMemo(
    () =>
      workspaces.map((workspace) => {
        const createdLabel = formatDate(workspace.created_at);
        return {
          ...workspace,
          label: createdLabel
            ? `${workspace.name} (${createdLabel})`
            : workspace.name,
        };
      }),
    [workspaces]
  );

  const handleSelect = (workspaceId: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("workspace", workspaceId);
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  const handleCreate = () => {
    startTransition(async () => {
      const created = await createWorkspace("My Strategy");
      router.push(buildWorkspacePath(pathname, created.id));
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-9 max-w-64 rounded-full border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
        value={activeWorkspaceId}
        onChange={(event) => handleSelect(event.target.value)}
        disabled={isPending}
        aria-label="Switch workspace"
      >
        {options.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.label}
          </option>
        ))}
      </select>
      <button
        className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleCreate}
        disabled={isPending}
        type="button"
      >
        New Workspace
      </button>
    </div>
  );
}
