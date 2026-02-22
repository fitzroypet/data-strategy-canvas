"use client";

type WelcomeStepProps = {
  onStart: () => void;
  onSkip: () => void;
  isPending: boolean;
};

export function WelcomeStep({ onStart, onSkip, isPending }: WelcomeStepProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Welcome
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        Build your strategy with guided momentum
      </h2>
      <p className="mt-3 text-sm text-zinc-600">
        This quick setup takes about 2-3 minutes. We will prepare a starter canvas
        for Step 1 and Step 2 so you can begin with practical draft content.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-zinc-700">
        <li>1. Name your workspace.</li>
        <li>2. Share a few context notes.</li>
        <li>3. Review and apply starter content.</li>
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={isPending}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Start setup
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isPending}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
        >
          Skip for now
        </button>
      </div>
    </section>
  );
}
