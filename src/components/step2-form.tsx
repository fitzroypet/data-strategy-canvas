"use client";

import { useEffect, useState } from "react";
import { SaveIndicator } from "@/components/save-indicator";
import { useStepAutosave } from "@/hooks/use-step-autosave";
import {
  createStep2FieldKey,
  createStep2IntentKey,
  step2BusinessAreas,
  step2Fields,
  step2NotSurePrompt,
} from "@/lib/step2-prompts";
import { useStepFormContext } from "@/components/step-form-context";

type Step2FormProps = {
  workspaceId: string;
  initialValues: Record<string, string>;
};

export function Step2Form({ workspaceId, initialValues }: Step2FormProps) {
  const { values, saveState, errorMessage, setFieldValue, handleBlur, retrySave } =
    useStepAutosave({
      workspaceId,
      stepId: 2,
      initialValues,
    });
  const { setFormAccessors, setSelectedFieldKey, selectedFieldKey } =
    useStepFormContext();

  const [showExamplesByArea, setShowExamplesByArea] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormAccessors(
      (fieldKey) => values[fieldKey] ?? "",
      (fieldKey, content) => setFieldValue(fieldKey, content)
    );
  }, [values, setFieldValue, setFormAccessors]);

  const handleQuickStart = (areaKey: string) => {
    for (const field of step2Fields) {
      const fieldKey = createStep2FieldKey(areaKey, field.key);
      if (!values[fieldKey]?.trim()) {
        setFieldValue(fieldKey, field.quickStart);
      }
    }
  };

  const toggleNotSure = (areaKey: string, checked: boolean) => {
    const intentKey = createStep2IntentKey(areaKey);
    setFieldValue(intentKey, checked ? step2NotSurePrompt : "");
  };

  return (
    <div className="space-y-4">
      <div className="mb-1">
        <SaveIndicator
          state={saveState}
          errorMessage={errorMessage}
          onRetry={retrySave}
        />
      </div>

      <section className="rounded-2xl border border-zinc-200/70 bg-zinc-50/70 p-4">
        <h2 className="text-sm font-semibold text-zinc-800">How to fill this step in 10 minutes</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Work one business area at a time. For each row, capture the question, key data,
          a primary KPI, and the decision it should support. Keep it practical; refine later.
        </p>
      </section>

      <div className="hidden grid-cols-[220px_repeat(4,minmax(0,1fr))] gap-3 lg:grid">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Business Area
        </div>
        {step2Fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {field.label}
            </div>
            <div className="inline-flex rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600">
              {field.helper}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {step2BusinessAreas.map((area) => {
          const intentKey = createStep2IntentKey(area.key);
          const showExamples = showExamplesByArea[area.key] ?? false;

          return (
            <section
              key={area.key}
              className="space-y-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-800">{area.label}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                    onClick={() =>
                      setShowExamplesByArea((prev) => ({
                        ...prev,
                        [area.key]: !showExamples,
                      }))
                    }
                  >
                    {showExamples ? "Hide school example" : "Show school example"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                    onClick={() => handleQuickStart(area.key)}
                  >
                    Quick start
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={Boolean(values[intentKey]?.trim())}
                  onChange={(event) => toggleNotSure(area.key, event.target.checked)}
                  onBlur={handleBlur}
                />
                Not sure yet - save this row as pending evidence
              </label>

              {values[intentKey]?.trim() && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {values[intentKey]}
                </p>
              )}

              <div className="grid gap-3 lg:grid-cols-[220px_repeat(4,minmax(0,1fr))]">
                <div className="hidden text-sm font-medium text-zinc-700 lg:block">
                  Use concise statements. Each KPI should support a real decision.
                </div>

                {step2Fields.map((field) => {
                  const fieldKey = createStep2FieldKey(area.key, field.key);
                  return (
                    <div key={fieldKey} className="space-y-2">
                      <div className="lg:hidden">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                          {field.label}
                        </div>
                        <div className="text-xs text-zinc-500">{field.helper}</div>
                      </div>

                      <textarea
                        className={`min-h-[110px] w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-zinc-400 ${
                          selectedFieldKey === fieldKey
                            ? "border-zinc-400 ring-2 ring-zinc-200"
                            : "border-zinc-200"
                        }`}
                        placeholder={field.placeholder}
                        value={values[fieldKey] ?? ""}
                        onChange={(event) => setFieldValue(fieldKey, event.target.value)}
                        onBlur={handleBlur}
                        onFocus={() => setSelectedFieldKey(fieldKey)}
                      />

                      {showExamples && (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2 text-xs text-emerald-800">
                          <div className="font-medium">School example</div>
                          <p className="mt-1">{area.example[field.key]}</p>
                          <button
                            type="button"
                            className="mt-2 rounded-full border border-emerald-200 bg-white px-2 py-1 font-medium text-emerald-700 hover:border-emerald-300"
                            onClick={() => setFieldValue(fieldKey, area.example[field.key])}
                          >
                            Use sample and edit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
