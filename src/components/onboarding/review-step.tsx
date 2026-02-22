"use client";

import { mapOnboardingInputToPrefill } from "@/lib/onboarding-mapper";
import type { OnboardingContextDraft } from "@/components/onboarding/context-step";

type ReviewStepProps = {
  workspaceName: string;
  industry: string;
  context: OnboardingContextDraft;
  onBack: () => void;
  onApplyStarter: () => void;
  onEnterBlank: () => void;
  isPending: boolean;
  applyDisabled?: boolean;
};

export function ReviewStep({
  workspaceName,
  industry,
  context,
  onBack,
  onApplyStarter,
  onEnterBlank,
  isPending,
  applyDisabled = false,
}: ReviewStepProps) {
  const prefill = mapOnboardingInputToPrefill({
    industry,
    audience: context.audience,
    outcome: context.outcome,
    decisionProblem: context.decisionProblem,
    availableData: context.availableData,
  });

  const step1Entries = prefill.filter((entry) => entry.stepId === 1);
  const step2Entries = prefill.filter((entry) => entry.stepId === 2);

  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Step 3 of 3
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
        Review starter content
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        We will add editable starter text to your canvas. Existing content stays unchanged.
      </p>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-sm text-zinc-700">
        <div>
          <span className="font-medium text-zinc-900">Workspace:</span> {workspaceName || "My Strategy"}
        </div>
        {industry && (
          <div className="mt-1">
            <span className="font-medium text-zinc-900">Context:</span> {industry}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-sm font-semibold text-zinc-900">Step 1 starter</div>
          <p className="mt-1 text-xs text-zinc-600">
            {step1Entries.length} fields will be proposed.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-700">
            {step1Entries.slice(0, 4).map((entry) => (
              <li key={entry.fieldKey}>
                <span className="font-medium">{entry.fieldKey}</span>: {entry.content}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="text-sm font-semibold text-zinc-900">Step 2 starter</div>
          <p className="mt-1 text-xs text-zinc-600">
            {step2Entries.length} KPI prompt cells will be proposed.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-700">
            {step2Entries.slice(0, 4).map((entry) => (
              <li key={entry.fieldKey}>
                <span className="font-medium">{entry.fieldKey}</span>: {entry.content}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onApplyStarter}
          disabled={isPending || applyDisabled}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Apply starter
        </button>
        <button
          type="button"
          onClick={onEnterBlank}
          disabled={isPending}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
        >
          Enter with blank canvas
        </button>
      </div>
    </section>
  );
}
