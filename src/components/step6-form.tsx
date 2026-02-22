"use client";

import { useEffect } from "react";
import { SaveIndicator } from "@/components/save-indicator";
import { TextAreaBlock } from "@/components/textarea-block";
import { useStepAutosave } from "@/hooks/use-step-autosave";
import { useStepFormContext } from "@/components/step-form-context";

type Step6FormProps = {
  workspaceId: string;
  initialValues: Record<string, string>;
};

const visionFields = [
  {
    key: "decision_change",
    label: "Decision change we are aiming for",
    helper: "What should change in how decisions are made?",
  },
  {
    key: "capability_shift",
    label: "Capability shift required",
    helper: "What new capability is required?",
  },
  {
    key: "business_value",
    label: "Business value this unlocks",
    helper: "What value becomes possible?",
  },
  {
    key: "scope_boundaries",
    label: "Scope & boundaries",
    helper: "What is intentionally out of scope?",
  },
];

export function Step6Form({ workspaceId, initialValues }: Step6FormProps) {
  const { values, saveState, setFieldValue, handleBlur } = useStepAutosave({
    workspaceId,
    stepId: 6,
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
    <div className="space-y-4">
      <SaveIndicator state={saveState} />
      <div className="grid gap-4 lg:grid-cols-2">
        {visionFields.map((field) => (
          <TextAreaBlock
            key={field.key}
            fieldKey={field.key}
            label={field.label}
            helperText={field.helper}
            highlighted={selectedFieldKey === field.key}
            value={values[field.key] ?? ""}
            onChange={(nextValue) => setFieldValue(field.key, nextValue)}
            onBlur={handleBlur}
            onFocus={() => setSelectedFieldKey(field.key)}
          />
        ))}
      </div>
      <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Data Vision Statement
        </div>
        <textarea
          className={`min-h-[120px] w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400 ${
            selectedFieldKey === "vision_statement"
              ? "border-zinc-400 ring-2 ring-zinc-200"
              : "border-zinc-200"
          }`}
          placeholder="Edit your vision statement..."
          value={values.vision_statement ?? ""}
          onChange={(event) =>
            setFieldValue("vision_statement", event.target.value)
          }
          onBlur={handleBlur}
          onFocus={() => setSelectedFieldKey("vision_statement")}
        />
      </div>
    </div>
  );
}
