"use client";

import { useEffect } from "react";
import { SaveIndicator } from "@/components/save-indicator";
import { useStepAutosave } from "@/hooks/use-step-autosave";
import { useStepFormContext } from "@/components/step-form-context";

type Step4FormProps = {
  workspaceId: string;
  initialValues: Record<string, string>;
};

const stages = [
  "capture",
  "store",
  "prepare",
  "analyse",
  "visualise",
  "act",
  "learn",
];

const stageLabels: Record<string, string> = {
  capture: "Capture",
  store: "Store",
  prepare: "Prepare",
  analyse: "Analyse",
  visualise: "Visualise",
  act: "Act",
  learn: "Learn",
};

const rows = [
  { key: "today", label: "What happens today?" },
  { key: "people", label: "Who is involved?" },
  { key: "tools", label: "Tools used" },
  { key: "pains", label: "Pain points / gaps" },
  { key: "impact", label: "Impact on decisions" },
];

export function Step4Form({ workspaceId, initialValues }: Step4FormProps) {
  const { values, saveState, setFieldValue, handleBlur } = useStepAutosave({
    workspaceId,
    stepId: 4,
    initialValues,
  });
  const { setFormAccessors, setSelectedFieldKey, selectedFieldKey } =
    useStepFormContext();

  useEffect(() => {
    setFormAccessors(
      (fieldKey) => values[fieldKey] ?? "",
      (fieldKey, content) => setFieldValue(fieldKey, content)
    );
  }, [values, setFieldValue, setFormAccessors]);

  return (
    <div>
      <div className="mb-3">
        <SaveIndicator state={saveState} />
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-[180px_repeat(7,minmax(0,1fr))]">
          <div />
          {stages.map((stage) => (
            <div
              key={stage}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400"
            >
              {stageLabels[stage]}
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div
            key={row.key}
            className="grid gap-3 rounded-2xl border border-zinc-200/70 bg-white/70 p-3 lg:grid-cols-[180px_repeat(7,minmax(0,1fr))]"
          >
            <div className="text-sm font-medium text-zinc-800">
              {row.label}
            </div>
            {stages.map((stage) => {
              const fieldKey = `lifecycle_${stage}_${row.key}`;
              return (
                <textarea
                  key={fieldKey}
                  className={`min-h-[84px] rounded-xl border bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400 ${
                    selectedFieldKey === fieldKey
                      ? "border-zinc-400 ring-2 ring-zinc-200"
                      : "border-zinc-200"
                  }`}
                  placeholder="Add notes"
                  value={values[fieldKey] ?? ""}
                  onChange={(event) =>
                    setFieldValue(fieldKey, event.target.value)
                  }
                  onBlur={handleBlur}
                  onFocus={() => setSelectedFieldKey(fieldKey)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
