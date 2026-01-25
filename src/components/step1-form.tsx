"use client";

import { TextAreaBlock } from "@/components/textarea-block";
import { SaveIndicator } from "@/components/save-indicator";
import { useStepAutosave } from "@/hooks/use-step-autosave";

type Step1Field = {
  key: string;
  label: string;
  helperText: string;
};

const step1Fields: Step1Field[] = [
  { key: "customer_segments", label: "Customer Segments", helperText: "Who do you actually serve today?" },
  { key: "value_proposition", label: "Value Proposition", helperText: "What makes your offer valuable?" },
  { key: "channels", label: "Channels", helperText: "How do customers find and reach you?" },
  { key: "customer_relationships", label: "Customer Relationships", helperText: "How do you keep customers connected?" },
  { key: "revenue_streams", label: "Revenue Streams", helperText: "Where does the money come from?" },
  { key: "key_resources", label: "Key Resources", helperText: "What assets make delivery possible?" },
  { key: "key_activities", label: "Key Activities", helperText: "What do you do to create value?" },
  { key: "key_partnerships", label: "Key Partnerships", helperText: "Who helps you deliver the offer?" },
  { key: "cost_structure", label: "Cost Structure", helperText: "What are the biggest cost drivers?" },
];

type Step1FormProps = {
  workspaceId: string;
  initialValues: Record<string, string>;
};

export function Step1Form({ workspaceId, initialValues }: Step1FormProps) {
  const { values, saveState, setFieldValue, handleBlur } = useStepAutosave({
    workspaceId,
    stepId: 1,
    initialValues,
  });

  return (
    <div>
      <div className="mb-3">
        <SaveIndicator state={saveState} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
      {step1Fields.map((field) => (
        <TextAreaBlock
          key={field.key}
          label={field.label}
          helperText={field.helperText}
          value={values[field.key] ?? ""}
          onChange={(nextValue) => {
            setFieldValue(field.key, nextValue);
          }}
          onBlur={handleBlur}
        />
      ))}
      </div>
    </div>
  );
}
