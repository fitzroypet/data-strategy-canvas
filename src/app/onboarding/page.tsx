import { redirect } from "next/navigation";
import { getWorkspaceOnboardingState } from "@/app/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import {
  buildPostOnboardingPath,
  isOnboardingEnabled,
  sanitizeOnboardingNextPath,
} from "@/lib/onboarding";
import { ONBOARDING_VERSION } from "@/lib/onboarding-mapper";

type OnboardingPageProps = {
  searchParams?:
    | Promise<{ restart?: string; next?: string; workspace?: string; onboarding_error?: string }>
    | { restart?: string; next?: string; workspace?: string; onboarding_error?: string };
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  if (!isOnboardingEnabled()) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const restart = resolvedSearchParams?.restart === "1";
  const workspaceId = resolvedSearchParams?.workspace;
  const requestedNext = sanitizeOnboardingNextPath(resolvedSearchParams?.next ?? null);

  if (!workspaceId) {
    redirect("/?onboarding_error=workspace_required");
  }

  const effectiveNext = requestedNext ?? `/canvas?workspace=${workspaceId}`;

  let state: Awaited<ReturnType<typeof getWorkspaceOnboardingState>>;
  try {
    state = await getWorkspaceOnboardingState(workspaceId);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthenticated") {
      redirect("/login");
    }
    redirect("/?onboarding_error=workspace_access_denied");
  }

  const handledForVersion =
    state.onboardingVersion === ONBOARDING_VERSION &&
    (state.onboardingStatus === "completed" || state.onboardingStatus === "skipped");

  if (handledForVersion && !restart) {
    redirect(buildPostOnboardingPath(effectiveNext, state.workspaceId));
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f3f0_0%,_#f7f7f5_45%,_#ffffff_100%)] text-zinc-900">
      <div className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-auto max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-white">
              P
            </div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Guided Setup
            </div>
          </div>
        </div>
      </div>

      <OnboardingWizard
        workspaceId={state.workspaceId}
        initialWorkspaceName={state.workspaceName || "My Strategy"}
        returnTo={effectiveNext}
        intakePrompt={state.intakePrompt}
        intakeDocumentCount={state.intakeDocumentCount}
      />
    </div>
  );
}
