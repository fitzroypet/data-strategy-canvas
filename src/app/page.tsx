import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StepHeader } from "@/components/step-header";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/app/actions/workspaces";
import { Step1Form } from "@/components/step1-form";
import { computeStepStatuses, type StepEntryRecord } from "@/lib/step-status";
import {
  getWorkspaceQueryId,
  resolveActiveWorkspace,
  type SearchParamsInput,
  type WorkspaceSummary,
} from "@/lib/workspace-selection";

type HomeProps = {
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspaceRows, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id,name,created_at")
    .order("created_at", { ascending: false });

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  let workspaces = (workspaceRows ?? []) as WorkspaceSummary[];
  let activeWorkspace = resolveActiveWorkspace(
    workspaces,
    getWorkspaceQueryId(resolvedSearchParams)
  );

  if (!activeWorkspace) {
    activeWorkspace = await createWorkspace("My Strategy");
    workspaces = [activeWorkspace, ...workspaces];
  }

  const { data: stepEntries, error: entriesError } = await supabase
    .from("step_entries")
    .select("step_id,field_key,content")
    .eq("workspace_id", activeWorkspace.id);

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  const typedEntries = (stepEntries ?? []) as StepEntryRecord[];
  const stepStatuses = computeStepStatuses(typedEntries);

  const initialValues = typedEntries
    .filter((entry) => entry.step_id === 1)
    .reduce<Record<string, string>>((acc, entry) => {
      acc[entry.field_key] = entry.content ?? "";
      return acc;
    }, {});

  return (
    <AppShell
      workspaceId={activeWorkspace.id}
      workspaceName={activeWorkspace.name}
      workspaces={workspaces}
      stepStatuses={stepStatuses}
      importEnabled={process.env.IMPORT_STRATEGY_ENABLED === "true"}
      aiChatEnabled={process.env.AI_CHAT_PANEL_ENABLED === "true"}
      currentStep={1}
    >
      <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
        <StepHeader
          title="Business Model Mapping"
          description="Understand how your organisation creates, delivers, and captures value."
        />
        <Step1Form workspaceId={activeWorkspace.id} initialValues={initialValues} />
        <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4">
          <p className="text-sm text-zinc-600">
            Your business model is becoming clearer. You can refine this later.
            Move forward when ready.
          </p>
          <Link
            href={{ pathname: "/step/2", query: { workspace: activeWorkspace.id } }}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Continue to Step 2
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
