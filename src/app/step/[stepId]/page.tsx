import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StepHeader } from "@/components/step-header";
import { Step2Form } from "@/components/step2-form";
import { Step3Form } from "@/components/step3-form";
import { Step4Form } from "@/components/step4-form";
import { Step5Form } from "@/components/step5-form";
import { Step6Form } from "@/components/step6-form";
import { createWorkspace } from "@/app/actions/workspaces";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { steps } from "@/lib/steps";

type StepPageProps = {
  params: { stepId: string };
};

export default async function StepPage({ params }: StepPageProps) {
  const stepId = Number(params.stepId);

  if (!Number.isFinite(stepId)) {
    notFound();
  }

  if (stepId === 1) {
    redirect("/");
  }

  const stepMeta = steps.find((step) => step.id === stepId);

  if (!stepMeta || stepId < 2 || stepId > 6) {
    notFound();
  }

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
    .eq("step_id", stepId);

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
      currentStep={stepId}
    >
      <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
        <StepHeader title={stepMeta.title} description={stepMeta.description} />
        {stepId === 2 && (
          <Step2Form
            workspaceId={activeWorkspace.id}
            initialValues={initialValues}
          />
        )}
        {stepId === 3 && (
          <Step3Form
            workspaceId={activeWorkspace.id}
            initialValues={initialValues}
          />
        )}
        {stepId === 4 && (
          <Step4Form
            workspaceId={activeWorkspace.id}
            initialValues={initialValues}
          />
        )}
        {stepId === 5 && (
          <Step5Form
            workspaceId={activeWorkspace.id}
            initialValues={initialValues}
          />
        )}
        {stepId === 6 && (
          <Step6Form
            workspaceId={activeWorkspace.id}
            initialValues={initialValues}
          />
        )}
      </div>
    </AppShell>
  );
}
