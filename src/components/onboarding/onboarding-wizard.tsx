"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceName } from "@/app/actions/workspaces";
import {
  completeWorkspaceOnboarding,
  saveOnboardingPrefill,
  skipWorkspaceOnboarding,
} from "@/app/actions/onboarding";
import { ONBOARDING_VERSION } from "@/lib/onboarding-mapper";
import {
  addOnboardingCompletionNotice,
  buildPostOnboardingPath,
} from "@/lib/onboarding";
import {
  ContextStep,
  type OnboardingContextDraft,
} from "@/components/onboarding/context-step";
import { ReviewStep } from "@/components/onboarding/review-step";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { WorkspaceStep } from "@/components/onboarding/workspace-step";

type OnboardingWizardProps = {
  workspaceId: string;
  initialWorkspaceName?: string;
  returnTo?: string | null;
  intakePrompt?: string;
  intakeDocumentCount?: number;
};

const wizardSteps = ["Welcome", "Workspace", "Context", "Review"];

const initialContextState: OnboardingContextDraft = {
  audience: "",
  outcome: "",
  decisionProblem: "",
  availableData: "",
};

function inferContextFromIntakePrompt(prompt: string): OnboardingContextDraft {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return initialContextState;
  }

  return {
    audience: "",
    outcome: trimmed,
    decisionProblem: "",
    availableData: "",
  };
}

export function OnboardingWizard({
  workspaceId,
  initialWorkspaceName = "My Strategy",
  returnTo = null,
  intakePrompt = "",
  intakeDocumentCount = 0,
}: OnboardingWizardProps) {
  const [wizardStep, setWizardStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [industry, setIndustry] = useState("");
  const [context, setContext] = useState<OnboardingContextDraft>(() =>
    inferContextFromIntakePrompt(intakePrompt)
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const hasContextInput = useMemo(
    () =>
      Boolean(
        context.audience.trim() ||
          context.outcome.trim() ||
          context.decisionProblem.trim() ||
          context.availableData.trim()
      ),
    [context]
  );

  const runSkip = () => {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await skipWorkspaceOnboarding(workspaceId, ONBOARDING_VERSION);
        router.replace(buildPostOnboardingPath(returnTo, workspaceId));
        router.refresh();
      } catch (skipError) {
        const message =
          skipError instanceof Error
            ? skipError.message
            : "Could not skip onboarding.";
        setError(message);
      }
    });
  };

  const runWorkspaceSetup = () => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        if (workspaceName.trim()) {
          await updateWorkspaceName(workspaceId, workspaceName.trim());
        }
        setWizardStep(2);
      } catch (workspaceError) {
        const message =
          workspaceError instanceof Error
            ? workspaceError.message
            : "Could not save workspace setup.";
        setError(message);
      }
    });
  };

  const runEnterBlank = () => {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        await completeWorkspaceOnboarding(workspaceId, ONBOARDING_VERSION);
        const postOnboardingPath = buildPostOnboardingPath(returnTo, workspaceId);
        router.replace(addOnboardingCompletionNotice(postOnboardingPath));
        router.refresh();
      } catch (completeError) {
        const message =
          completeError instanceof Error
            ? completeError.message
            : "Could not complete onboarding.";
        setError(message);
      }
    });
  };

  const runApplyStarter = () => {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await saveOnboardingPrefill({
          workspaceId,
          context: {
            industry,
            audience: context.audience,
            outcome: context.outcome,
            decisionProblem: context.decisionProblem,
            availableData: context.availableData,
          },
        });

        setFeedback(
          `Starter applied: ${result.appliedCount} fields added, ${result.skippedCount} already had content.`
        );

        await completeWorkspaceOnboarding(workspaceId, ONBOARDING_VERSION);
        const postOnboardingPath = buildPostOnboardingPath(returnTo, workspaceId);
        router.replace(addOnboardingCompletionNotice(postOnboardingPath));
        router.refresh();
      } catch (applyError) {
        const message =
          applyError instanceof Error
            ? applyError.message
            : "Could not apply onboarding starter.";
        setError(message);
      }
    });
  };

  const progressStep = Math.min(wizardStep + 1, wizardSteps.length);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-4 rounded-2xl border border-zinc-200/70 bg-white/80 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Onboarding
        </div>
        <div className="mt-2 text-sm text-zinc-600">
          Step {progressStep} of {wizardSteps.length}: {wizardSteps[wizardStep]}
        </div>
        {intakePrompt.trim().length > 0 && (
          <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Imported from your landing input. You can edit everything before applying.
          </div>
        )}
        {intakeDocumentCount > 0 && (
          <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            {intakeDocumentCount} intake document{intakeDocumentCount === 1 ? "" : "s"} uploaded.
            You can run Import Strategy after setup to extract more detail.
          </div>
        )}
      </div>

      {wizardStep === 0 && (
        <WelcomeStep
          onStart={() => setWizardStep(1)}
          onSkip={runSkip}
          isPending={isPending}
        />
      )}

      {wizardStep === 1 && (
        <WorkspaceStep
          workspaceName={workspaceName}
          industry={industry}
          onWorkspaceNameChange={setWorkspaceName}
          onIndustryChange={setIndustry}
          onBack={() => setWizardStep(0)}
          onNext={runWorkspaceSetup}
          isPending={isPending}
        />
      )}

      {wizardStep === 2 && (
        <ContextStep
          values={context}
          onChange={(field, value) =>
            setContext((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onBack={() => setWizardStep(1)}
          onNext={() => setWizardStep(3)}
          isPending={isPending}
        />
      )}

      {wizardStep === 3 && (
        <ReviewStep
          workspaceName={workspaceName}
          industry={industry}
          context={context}
          onBack={() => setWizardStep(2)}
          onApplyStarter={runApplyStarter}
          onEnterBlank={runEnterBlank}
          isPending={isPending}
          applyDisabled={!hasContextInput}
        />
      )}

      {feedback && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {feedback}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
