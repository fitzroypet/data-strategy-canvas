export type SearchParamsInput = Record<string, string | string[] | undefined>;

export type WorkspaceSummary = {
  id: string;
  name: string;
  created_at: string;
  onboarding_status?: string | null;
};

function getSingleQueryParam(
  searchParams: SearchParamsInput | undefined,
  key: string
) {
  const raw = searchParams?.[key];

  if (typeof raw === "string" && raw.trim()) {
    return raw;
  }

  if (Array.isArray(raw) && raw[0]?.trim()) {
    return raw[0];
  }

  return undefined;
}

export function getWorkspaceQueryId(searchParams?: SearchParamsInput) {
  return getSingleQueryParam(searchParams, "workspace");
}

export function getOnboardingNoticeStep(searchParams?: SearchParamsInput) {
  const notice = getSingleQueryParam(searchParams, "onboarding_notice");
  if (notice !== "completed") {
    return null;
  }

  const stepRaw = getSingleQueryParam(searchParams, "onboarding_step");
  if (!stepRaw) {
    return 1;
  }

  const parsed = Number(stepRaw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function resolveActiveWorkspace(
  workspaces: WorkspaceSummary[],
  requestedWorkspaceId?: string
) {
  if (workspaces.length === 0) {
    return null;
  }

  if (requestedWorkspaceId) {
    const matched = workspaces.find((workspace) => workspace.id === requestedWorkspaceId);
    if (matched) {
      return matched;
    }
  }

  return workspaces[0];
}

export function buildWorkspacePath(pathname: string, workspaceId: string) {
  const params = new URLSearchParams();
  params.set("workspace", workspaceId);
  return `${pathname}?${params.toString()}`;
}
