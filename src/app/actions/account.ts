"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountProfile = {
  email: string;
  name: string;
};

export async function getAccountProfile(): Promise<AccountProfile> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("email,name")
    .eq("id", user.id)
    .maybeSingle<{ email: string; name: string | null }>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!existingProfile) {
    const fallbackEmail = user.email ?? "";
    const { error: insertError } = await supabase.from("user_profiles").insert({
      id: user.id,
      email: fallbackEmail,
      name: null,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return {
      email: fallbackEmail,
      name: "",
    };
  }

  return {
    email: existingProfile.email,
    name: existingProfile.name ?? "",
  };
}

export async function upsertAccountDisplayName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Display name cannot be empty.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      name: trimmed,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  redirect("/login");
}

