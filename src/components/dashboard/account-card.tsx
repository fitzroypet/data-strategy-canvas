"use client";

import { useState, useTransition } from "react";
import { signOut, upsertAccountDisplayName } from "@/app/actions/account";

type AccountCardProps = {
  email: string;
  initialName: string;
};

export function AccountCard({ email, initialName }: AccountCardProps) {
  const [name, setName] = useState(initialName);
  const [lastSavedName, setLastSavedName] = useState(initialName);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setFeedback(null);
    setError(null);

    startTransition(async () => {
      try {
        await upsertAccountDisplayName(name);
        setLastSavedName(name.trim());
        setName(name.trim());
        setFeedback("Display name updated.");
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : "Could not update display name.";
        setError(message);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Account</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Manage your profile and session for this workspace account.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Email
          </div>
          <div className="mt-1 text-sm text-zinc-700">{email}</div>
        </div>

        <label className="flex flex-col gap-2 text-sm text-zinc-700">
          <span className="font-medium text-zinc-800">Display name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
            placeholder="Your name"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || name.trim() === lastSavedName.trim()}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Save profile
          </button>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300"
            >
              Sign out
            </button>
          </form>
        </div>

        {feedback && <p className="text-sm text-emerald-700">{feedback}</p>}
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </div>
    </section>
  );
}

