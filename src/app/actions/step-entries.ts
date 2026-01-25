"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type StepEntryInput = {
  fieldKey: string;
  content: string;
};

export async function upsertStepEntries(
  workspaceId: string,
  stepId: number,
  entries: StepEntryInput[]
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  const payload = entries.map((entry) => ({
    workspace_id: workspaceId,
    step_id: stepId,
    field_key: entry.fieldKey,
    content: entry.content,
  }));

  const { error } = await supabase.from("step_entries").upsert(payload, {
    onConflict: "workspace_id,step_id,field_key",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath(`/step/${stepId}`);
}
