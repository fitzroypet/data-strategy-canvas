import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StepHeader } from "@/components/step-header";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/app/actions/workspaces";
import { Step1Form } from "@/components/step1-form";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspaces, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id,name,created_at")
    .order("created_at", { ascending: true });

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  let activeWorkspace = workspaces?.[0];

  if (!activeWorkspace) {
    activeWorkspace = await createWorkspace("My Strategy");
  }

  const { data: stepEntries, error: entriesError } = await supabase
    .from("step_entries")
    .select("field_key,content")
    .eq("workspace_id", activeWorkspace.id)
    .eq("step_id", 1);

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  const initialValues = (stepEntries ?? []).reduce<Record<string, string>>(
    (acc, entry) => {
      acc[entry.field_key] = entry.content ?? "";
      return acc;
    },
    {}
  );

  return (
    <AppShell
      workspaceId={activeWorkspace.id}
      workspaceName={activeWorkspace.name}
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
          <a
            href="/step/2"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Continue to Step 2
          </a>
        </div>
      </div>
    </AppShell>
  );
}
