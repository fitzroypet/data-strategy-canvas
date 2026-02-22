export type SearchParamsInput = Record<string, string | string[] | undefined>;

export type WorkspaceSummary = {
  id: string;
  name: string;
  created_at: string;
};

export function getWorkspaceQueryId(searchParams?: SearchParamsInput) {
  const raw = searchParams?.workspace;

  if (typeof raw === "string" && raw.trim()) {
    return raw;
  }

  if (Array.isArray(raw) && raw[0]?.trim()) {
    return raw[0];
  }

  return undefined;
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
