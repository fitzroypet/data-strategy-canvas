import type { StepStatus } from "@/lib/steps";

export type StepStatusMap = Record<number, StepStatus>;

export type StepEntryRecord = {
  step_id: number;
  field_key: string;
  content: string | null;
};

const statusRules: Record<
  number,
  {
    clearThreshold: number;
  }
> = {
  1: { clearThreshold: 7 },
  2: { clearThreshold: 12 },
  3: { clearThreshold: 8 },
  4: { clearThreshold: 10 },
  5: { clearThreshold: 6 },
  6: { clearThreshold: 4 },
};

function hasMeaningfulContent(content: string | null) {
  return Boolean(content && content.trim().length > 0);
}

export function computeStepStatuses(stepEntries: StepEntryRecord[]): StepStatusMap {
  const byStep = new Map<number, number>();

  for (const entry of stepEntries) {
    if (!hasMeaningfulContent(entry.content)) {
      continue;
    }

    const current = byStep.get(entry.step_id) ?? 0;
    byStep.set(entry.step_id, current + 1);
  }

  const result: StepStatusMap = {
    1: "draft",
    2: "draft",
    3: "draft",
    4: "draft",
    5: "draft",
    6: "draft",
  };

  for (const stepId of [1, 2, 3, 4, 5, 6]) {
    const filled = byStep.get(stepId) ?? 0;

    if (filled === 0) {
      result[stepId] = "draft";
      continue;
    }

    const threshold = statusRules[stepId].clearThreshold;
    result[stepId] = filled >= threshold ? "clear" : "in_progress";
  }

  return result;
}
