"use client";

import { useEffect } from "react";
import { SaveIndicator } from "@/components/save-indicator";
import { TextAreaBlock } from "@/components/textarea-block";
import { useStepAutosave } from "@/hooks/use-step-autosave";
import { useStepFormContext } from "@/components/step-form-context";

type Step5FormProps = {
  workspaceId: string;
  initialValues: Record<string, string>;
};

const customerFields = [
  { key: "customer_profile", label: "Customer", helper: "Who is this for?" },
  {
    key: "jobs_to_be_done",
    label: "Jobs to be done",
    helper: "What are they trying to achieve?",
  },
  { key: "pains", label: "Pains", helper: "Where do they struggle?" },
  { key: "gains", label: "Gains", helper: "What outcomes matter most?" },
];

const valueMapFields = [
  {
    key: "proposed_initiative",
    label: "Proposed initiative",
    helper: "What are you considering building?",
  },
  {
    key: "pain_relievers",
    label: "Pain relievers",
    helper: "How does this reduce pain?",
  },
  {
    key: "gain_creators",
    label: "Gain creators",
    helper: "How does this create value?",
  },
  {
    key: "delivery_mechanism",
    label: "Delivery mechanism",
    helper: "How will it be delivered?",
  },
];

export function Step5Form({ workspaceId, initialValues }: Step5FormProps) {
  const { values, saveState, setFieldValue, handleBlur } = useStepAutosave({
    workspaceId,
    stepId: 5,
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Customer Profile
          </div>
          <div className="space-y-4">
            {customerFields.map((field) => (
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
        </div>
        <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Value Map
          </div>
          <div className="space-y-4">
            {valueMapFields.map((field) => (
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
        </div>
      </div>
    </div>
  );
}
