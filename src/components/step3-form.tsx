"use client";

import { SaveIndicator } from "@/components/save-indicator";
import { TextAreaBlock } from "@/components/textarea-block";
import { useStepAutosave } from "@/hooks/use-step-autosave";

type Step3FormProps = {
  workspaceId: string;
  initialValues: Record<string, string>;
};

const pillars = [
  { key: "people_culture", label: "People & Culture" },
  { key: "processes", label: "Processes" },
  { key: "technology", label: "Technology" },
  { key: "governance", label: "Governance" },
  { key: "strategy_impact", label: "Strategy & Impact" },
];

const levels = ["1", "2", "3", "4", "5"];

export function Step3Form({ workspaceId, initialValues }: Step3FormProps) {
  const { values, saveState, setFieldValue, handleBlur } = useStepAutosave({
    workspaceId,
    stepId: 3,
    initialValues,
  });

  return (
    <div className="space-y-4">
      <SaveIndicator state={saveState} />

      {pillars.map((pillar) => (
        <div
          key={pillar.key}
          className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-800">
              {pillar.label}
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              Level
              <select
                className="h-8 rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
                value={values[`${pillar.key}_level`] ?? ""}
                onChange={(event) =>
                  setFieldValue(`${pillar.key}_level`, event.target.value)
                }
                onBlur={handleBlur}
              >
                <option value="">Select</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <TextAreaBlock
              label="Evidence"
              helperText="Why did you choose this level?"
              value={values[`${pillar.key}_evidence`] ?? ""}
              onChange={(nextValue) =>
                setFieldValue(`${pillar.key}_evidence`, nextValue)
              }
              onBlur={handleBlur}
            />
            <TextAreaBlock
              label="Constraints"
              helperText="What currently limits progress?"
              value={values[`${pillar.key}_constraints`] ?? ""}
              onChange={(nextValue) =>
                setFieldValue(`${pillar.key}_constraints`, nextValue)
              }
              onBlur={handleBlur}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
