"use client";

import { SaveIndicator } from "@/components/save-indicator";
import { useStepAutosave } from "@/hooks/use-step-autosave";

type Step2FormProps = {
  workspaceId: string;
  initialValues: Record<string, string>;
};

const businessAreas = [
  { key: "customer_segments", label: "Customer Segments" },
  { key: "value_proposition", label: "Value Proposition" },
  { key: "channels", label: "Channels" },
  { key: "customer_relationships", label: "Customer Relationships" },
  { key: "revenue_streams", label: "Revenue Streams" },
  { key: "key_resources", label: "Key Resources" },
  { key: "key_activities", label: "Key Activities" },
  { key: "key_partnerships", label: "Key Partnerships" },
  { key: "cost_structure", label: "Cost Structure" },
];

const fieldLabels = [
  { key: "goal", label: "What are you trying to understand?" },
  { key: "data", label: "Important data" },
  { key: "kpi", label: "Primary KPI" },
  { key: "decision", label: "Decision this informs" },
];

export function Step2Form({ workspaceId, initialValues }: Step2FormProps) {
  const { values, saveState, setFieldValue, handleBlur } = useStepAutosave({
    workspaceId,
    stepId: 2,
    initialValues,
  });

  return (
    <div>
      <div className="mb-3">
        <SaveIndicator state={saveState} />
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-[200px_repeat(4,minmax(0,1fr))]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Business Area
          </div>
          {fieldLabels.map((field) => (
            <div
              key={field.key}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400"
            >
              {field.label}
            </div>
          ))}
        </div>

        {businessAreas.map((area) => (
          <div
            key={area.key}
            className="grid gap-3 rounded-2xl border border-zinc-200/70 bg-white/70 p-3 lg:grid-cols-[200px_repeat(4,minmax(0,1fr))]"
          >
            <div className="text-sm font-medium text-zinc-800">
              {area.label}
            </div>
            {fieldLabels.map((field) => {
              const fieldKey = `kpi_${area.key}_${field.key}`;
              return (
                <textarea
                  key={fieldKey}
                  className="min-h-[84px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400"
                  placeholder="Add notes"
                  value={values[fieldKey] ?? ""}
                  onChange={(event) =>
                    setFieldValue(fieldKey, event.target.value)
                  }
                  onBlur={handleBlur}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
