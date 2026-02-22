"use client";

import { useMemo, useState } from "react";
import { AiStepPreviewModal } from "@/components/ai-step-preview-modal";
import { getStepFieldStructure } from "@/lib/step-structure";

type StepAiDraftControlsProps = {
  workspaceId: string;
  stepId: number;
};

export function StepAiDraftControls({
  workspaceId,
  stepId,
}: StepAiDraftControlsProps) {
  const [focusSectionId, setFocusSectionId] = useState("all");

  if (stepId < 1 || stepId > 6) {
    return null;
  }

  const sectionOptions = useMemo(() => {
    const seen = new Set<string>();
    return getStepFieldStructure(stepId).reduce<Array<{ id: string; label: string }>>(
      (acc, field) => {
        if (!seen.has(field.sectionId)) {
          seen.add(field.sectionId);
          acc.push({ id: field.sectionId, label: field.sectionLabel });
        }
        return acc;
      },
      []
    );
  }, [stepId]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <label className="inline-flex h-8 items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-sm">
        <span
          aria-hidden
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current">
            <path d="M8 1.75a.75.75 0 0 1 .75.75v4h4a.75.75 0 0 1 0 1.5h-4v4a.75.75 0 0 1-1.5 0v-4h-4a.75.75 0 0 1 0-1.5h4v-4A.75.75 0 0 1 8 1.75Z" />
          </svg>
        </span>
        <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Focus</span>
        <select
          value={focusSectionId}
          onChange={(event) => setFocusSectionId(event.target.value)}
          className="h-6 rounded-full border border-zinc-200 bg-white px-2 text-xs text-zinc-700 outline-none focus:border-zinc-400"
          aria-label="Focus section"
        >
          <option value="all">This step</option>
          {sectionOptions.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
      </label>
      <AiStepPreviewModal
        workspaceId={workspaceId}
        stepId={stepId}
        focusSectionId={focusSectionId}
        onFocusSectionIdChange={setFocusSectionId}
      />
    </div>
  );
}
