import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccountProfile } from "@/app/actions/account";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AccountCard } from "@/components/dashboard/account-card";
import { WorkspacesCard } from "@/components/dashboard/workspaces-card";
import type { WorkspaceSummary } from "@/lib/workspace-selection";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getAccountProfile();

  const { data: workspaceRows, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id,name,created_at")
    .order("created_at", { ascending: false });

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  const workspaces = (workspaceRows ?? []) as WorkspaceSummary[];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f3f0_0%,_#f7f7f5_45%,_#ffffff_100%)] text-zinc-900">
      <div className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-auto max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-white">
              P
            </div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Petgrave.io Dashboard
            </div>
          </div>
          <Link
            href={workspaces[0] ? { pathname: "/", query: { workspace: workspaces[0].id } } : "/"}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
          >
            Back to Canvas
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="mb-5">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Manage your account and workspaces, then jump back into your strategy flow.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <AccountCard email={profile.email} initialName={profile.name} />
          <WorkspacesCard initialWorkspaces={workspaces} />
        </div>
      </div>
    </div>
  );
}

