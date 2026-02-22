import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        // In Server Components, Next.js makes cookies read-only.
        // Supabase may still attempt a write during auth refresh; ignore it here.
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name, options) {
        // Same rationale as set(): allow reads everywhere, writes only where permitted.
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {}
      },
    },
  });
}
