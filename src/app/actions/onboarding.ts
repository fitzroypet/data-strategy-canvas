"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  mapOnboardingInputToPrefill,
  ONBOARDING_VERSION,
  type OnboardingContextInput,
  type PrefillEntry,
} from "@/lib/onboarding-mapper";

type WorkspaceOnboardingState = {
  workspaceId: string;
  workspaceName: string;
  onboardingStatus: "pending" | "completed" | "skipped";
  onboardingVersion: string | null;
  intakePrompt: string;
  intakeContext: Record<string, unknown> | null;
  intakeDocumentCount: number;
};

type SaveOnboardingPrefillInput = {
  workspaceId: string;
  context: OnboardingContextInput;
};

type SaveOnboardingPrefillResult = {
  appliedCount: number;
  skippedCount: number;
};

type WorkspaceRow = {
  id: string;
  name: string;
  user_id: string;
  onboarding_status: "pending" | "completed" | "skipped" | null;
  onboarding_version: string | null;
  intake_prompt: string | null;
  intake_context: Record<string, unknown> | null;
};

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  return { supabase, user };
}

async function getOwnedWorkspace(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  workspaceId: string
) {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select(
      "id,name,user_id,onboarding_status,onboarding_version,intake_prompt,intake_context"
    )
    .eq("id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle<WorkspaceRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  return workspace;
}

function normalizeStatus(
  status: WorkspaceRow["onboarding_status"]
): WorkspaceOnboardingState["onboardingStatus"] {
  if (status === "completed" || status === "skipped") {
    return status;
  }
  return "pending";
}

export async function getWorkspaceOnboardingState(
  workspaceId: string
): Promise<WorkspaceOnboardingState> {
  const { supabase, user } = await requireUser();
  const workspace = await getOwnedWorkspace(supabase, user.id, workspaceId);

  const { count, error: countError } = await supabase
    .from("workspace_documents")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("source", "landing_intake");

  if (countError) {
    throw new Error(countError.message);
  }

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    onboardingStatus: normalizeStatus(workspace.onboarding_status),
    onboardingVersion: workspace.onboarding_version,
    intakePrompt: workspace.intake_prompt ?? "",
    intakeContext: workspace.intake_context,
    intakeDocumentCount: count ?? 0,
  };
}

function isMeaningfulContent(value: string | null | undefined) {
  return Boolean((value ?? "").trim());
}

function toCandidateMap(entries: PrefillEntry[]) {
  return entries.reduce<Record<string, PrefillEntry>>((acc, entry) => {
    acc[`${entry.stepId}:${entry.fieldKey}`] = entry;
    return acc;
  }, {});
}

export async function saveOnboardingPrefill(
  input: SaveOnboardingPrefillInput
): Promise<SaveOnboardingPrefillResult> {
  const { supabase, user } = await requireUser();
  await getOwnedWorkspace(supabase, user.id, input.workspaceId);

  const candidates = mapOnboardingInputToPrefill(input.context);
  const candidateMap = toCandidateMap(candidates);
  const candidateKeys = Object.keys(candidateMap);

  if (candidateKeys.length === 0) {
    return { appliedCount: 0, skippedCount: 0 };
  }

  const stepIds = [...new Set(candidates.map((entry) => entry.stepId))];
  const fieldKeys = [...new Set(candidates.map((entry) => entry.fieldKey))];

  const { data: existingRows, error: existingError } = await supabase
    .from("step_entries")
    .select("step_id,field_key,content")
    .eq("workspace_id", input.workspaceId)
    .in("step_id", stepIds)
    .in("field_key", fieldKeys)
    .returns<Array<{ step_id: number; field_key: string; content: string }>>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByKey = new Map(
    (existingRows ?? []).map((row) => [`${row.step_id}:${row.field_key}`, row.content])
  );

  const payload = candidates
    .filter((entry) => {
      const existingContent = existingByKey.get(`${entry.stepId}:${entry.fieldKey}`);
      return !isMeaningfulContent(existingContent);
    })
    .map((entry) => ({
      workspace_id: input.workspaceId,
      step_id: entry.stepId,
      field_key: entry.fieldKey,
      content: entry.content,
    }));

  if (payload.length > 0) {
    const { error: upsertError } = await supabase.from("step_entries").upsert(payload, {
      onConflict: "workspace_id,step_id,field_key",
    });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  const appliedCount = payload.length;
  const skippedCount = candidateKeys.length - appliedCount;

  revalidatePath("/canvas");
  revalidatePath("/step/2");
  revalidatePath("/onboarding");

  return { appliedCount, skippedCount };
}

export async function completeWorkspaceOnboarding(
  workspaceId: string,
  version = ONBOARDING_VERSION
) {
  const { supabase, user } = await requireUser();
  await getOwnedWorkspace(supabase, user.id, workspaceId);

  const { error } = await supabase
    .from("workspaces")
    .update({
      onboarding_status: "completed",
      onboarding_version: version,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_skipped_at: null,
    })
    .eq("id", workspaceId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/canvas");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
}

export async function skipWorkspaceOnboarding(
  workspaceId: string,
  version = ONBOARDING_VERSION
) {
  const { supabase, user } = await requireUser();
  await getOwnedWorkspace(supabase, user.id, workspaceId);

  const { error } = await supabase
    .from("workspaces")
    .update({
      onboarding_status: "skipped",
      onboarding_version: version,
      onboarding_skipped_at: new Date().toISOString(),
    })
    .eq("id", workspaceId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/canvas");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
}
