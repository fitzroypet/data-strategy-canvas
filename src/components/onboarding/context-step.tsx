"use client";

export type OnboardingContextDraft = {
  audience: string;
  outcome: string;
  decisionProblem: string;
  availableData: string;
};

type ContextStepProps = {
  values: OnboardingContextDraft;
  onChange: (field: keyof OnboardingContextDraft, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  isPending: boolean;
};

type PromptField = {
  key: keyof OnboardingContextDraft;
  label: string;
  placeholder: string;
};

const promptFields: PromptField[] = [
  {
    key: "audience",
    label: "Who are you serving?",
    placeholder: "Example: Secondary school students, teachers, and school leadership.",
  },
  {
    key: "outcome",
    label: "What transformation or outcome are you aiming for?",
    placeholder: "Example: Improve retention and program completion rates within 12 months.",
  },
  {
    key: "decisionProblem",
    label: "What decision problem do you need to solve first?",
    placeholder: "Example: Which student support interventions should we prioritize first?",
  },
  {
    key: "availableData",
    label: "What data do you already have today?",
    placeholder: "Example: Attendance records, completion data, LMS activity, survey feedback.",
  },
];

export function ContextStep({
  values,
  onChange,
  onBack,
  onNext,
  isPending,
}: ContextStepProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Step 2 of 3
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
        Add starter context
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Keep it short. We will use this only to draft editable starter content.
      </p>

      <div className="mt-5 grid gap-4">
        {promptFields.map((field) => (
          <label key={field.key} className="flex flex-col gap-2 text-sm text-zinc-700">
            <span className="font-medium text-zinc-800">{field.label}</span>
            <textarea
              value={values[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="min-h-[92px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
              placeholder={field.placeholder}
            />
          </label>
        ))}
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
          onClick={onNext}
          disabled={isPending}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
