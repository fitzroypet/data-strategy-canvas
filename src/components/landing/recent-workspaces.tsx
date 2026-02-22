import Link from "next/link";
import type { WorkspaceSummary } from "@/lib/workspace-selection";

type RecentWorkspace = WorkspaceSummary & {
  onboarding_status?: string | null;
};

type RecentWorkspacesProps = {
  workspaces: RecentWorkspace[];
  onboardingEnabled?: boolean;
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

export function RecentWorkspaces({
  workspaces,
  onboardingEnabled = false,
}: RecentWorkspacesProps) {
  if (workspaces.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-5 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Continue Workspace
      </div>
      <div className="space-y-2">
        {workspaces.map((workspace) => {
          const isPending = (workspace.onboarding_status ?? "pending") === "pending";
          const href = isPending && onboardingEnabled
            ? `/onboarding?workspace=${workspace.id}&next=${encodeURIComponent(
                `/canvas?workspace=${workspace.id}`
              )}`
            : `/canvas?workspace=${workspace.id}`;

          return (
            <Link
              key={workspace.id}
              href={href}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:border-zinc-300"
            >
              <span className="font-medium text-zinc-800">{workspace.name}</span>
              <span className="text-xs text-zinc-500">
                {isPending ? "Onboarding pending" : formatDate(workspace.created_at)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
