"use client";

type WorkspaceStepProps = {
  workspaceName: string;
  industry: string;
  onWorkspaceNameChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  isPending: boolean;
};

const industryOptions = [
  "Education / School",
  "Professional Services",
  "Healthcare",
  "Retail / Ecommerce",
  "Non-profit",
  "Other",
];

export function WorkspaceStep({
  workspaceName,
  industry,
  onWorkspaceNameChange,
  onIndustryChange,
  onBack,
  onNext,
  isPending,
}: WorkspaceStepProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
        Step 1 of 3
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900">
        Set up your workspace
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Give this strategy workspace a name and pick a context to tailor your starter.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="flex flex-col gap-2 text-sm text-zinc-700">
          <span className="font-medium text-zinc-800">Workspace name</span>
          <input
            value={workspaceName}
            onChange={(event) => onWorkspaceNameChange(event.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
            placeholder="My Strategy"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-zinc-700">
          <span className="font-medium text-zinc-800">Industry / use case (optional)</span>
          <select
            value={industry}
            onChange={(event) => onIndustryChange(event.target.value)}
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
          >
            <option value="">Select one</option>
            {industryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
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
