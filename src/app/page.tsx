import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StartPanel } from "@/components/landing/start-panel";
import { RecentWorkspaces } from "@/components/landing/recent-workspaces";

type HomePageProps = {
  searchParams?:
    | Promise<{ resume?: string; onboarding_error?: string }>
    | { resume?: string; onboarding_error?: string };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolved = await searchParams;

  if (process.env.LANDING_V1_ENABLED !== "true") {
    return <LandingDisabledFallback />;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recentWorkspaces: Array<{
    id: string;
    name: string;
    created_at: string;
    onboarding_status: string | null;
  }> = [];

  if (user) {
    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id,name,created_at,onboarding_status")
      .order("created_at", { ascending: false })
      .limit(6);
    recentWorkspaces = (workspaces ?? []) as typeof recentWorkspaces;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,_#f3eee5_0%,_#f7f5f0_35%,_#ffffff_100%)] text-zinc-900">
      <div className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-auto max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-white">
              P
            </div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Data Strategy Canvas
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
                >
                  Dashboard
                </Link>
                <Link
                  href={recentWorkspaces[0] ? `/canvas?workspace=${recentWorkspaces[0].id}` : "/canvas"}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
                >
                  Open Canvas
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.5fr_1fr]">
        <StartPanel
          isAuthenticated={Boolean(user)}
          resumeMode={resolved?.resume === "1"}
        />

        <div className="space-y-4">
          {resolved?.onboarding_error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              We could not open onboarding for that workspace. Please start again.
            </div>
          )}
          <RecentWorkspaces
            workspaces={recentWorkspaces}
            onboardingEnabled={process.env.ONBOARDING_V1_ENABLED === "true"}
          />
          <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-5 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900">How this works</div>
            <ol className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>1. Describe your strategy goal in plain language.</li>
              <li>2. Upload existing strategy documents if you have them.</li>
              <li>3. Start guided onboarding and get a ready-to-edit canvas.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function LandingDisabledFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Landing is disabled</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Open your existing canvas directly while landing mode is off.
        </p>
        <Link
          href="/canvas"
          className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Go to Canvas
        </Link>
      </div>
    </div>
  );
}
