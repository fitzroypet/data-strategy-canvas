import { ONBOARDING_VERSION } from "@/lib/onboarding-mapper";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isOnboardingEnabled() {
  return process.env.ONBOARDING_V1_ENABLED === "true";
}

export async function shouldRedirectWorkspaceToOnboarding(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
) {
  if (!isOnboardingEnabled()) {
    return false;
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id,user_id,onboarding_status,onboarding_version")
    .eq("id", workspaceId)
    .maybeSingle<{
      id: string;
      user_id: string;
      onboarding_status: string | null;
      onboarding_version: string | null;
    }>();

  if (error || !workspace || workspace.user_id !== userId) {
    return false;
  }

  if (workspace.onboarding_version !== ONBOARDING_VERSION) {
    return true;
  }

  return (workspace.onboarding_status ?? "pending") === "pending";
}

export function sanitizeOnboardingNextPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return null;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }

  if (nextPath.startsWith("/onboarding")) {
    return null;
  }

  return nextPath;
}

export function buildPostOnboardingPath(
  nextPath: string | null | undefined,
  workspaceId: string | null | undefined
) {
  const safeNext = sanitizeOnboardingNextPath(nextPath) ?? "/";

  if (!workspaceId) {
    return safeNext;
  }

  const [beforeHash, hashFragment] = safeNext.split("#", 2);
  const [pathname, queryString] = beforeHash.split("?", 2);
  const params = new URLSearchParams(queryString ?? "");

  if (!params.get("workspace")) {
    params.set("workspace", workspaceId);
  }

  const nextQuery = params.toString();
  const withQuery = nextQuery ? `${pathname}?${nextQuery}` : pathname;

  return hashFragment ? `${withQuery}#${hashFragment}` : withQuery;
}

export function addOnboardingCompletionNotice(path: string) {
  const [beforeHash, hashFragment] = path.split("#", 2);
  const [pathname, queryString] = beforeHash.split("?", 2);
  const params = new URLSearchParams(queryString ?? "");

  let stepNumber = 1;
  const stepMatch = pathname.match(/^\/step\/(\d+)$/);
  if (stepMatch) {
    stepNumber = Number(stepMatch[1]) || 1;
  }

  params.set("onboarding_notice", "completed");
  params.set("onboarding_step", String(stepNumber));

  const nextQuery = params.toString();
  const withQuery = nextQuery ? `${pathname}?${nextQuery}` : pathname;

  return hashFragment ? `${withQuery}#${hashFragment}` : withQuery;
}
