import { createStep2FieldKey, step2BusinessAreas, type Step2Field } from "@/lib/step2-prompts";

export const ONBOARDING_VERSION = "v1";

export type OnboardingContextInput = {
  industry?: string;
  audience: string;
  outcome: string;
  decisionProblem: string;
  availableData: string;
};

export type PrefillEntry = {
  stepId: 1 | 2;
  fieldKey: string;
  content: string;
};

function clean(value: string | undefined) {
  return (value ?? "").trim();
}

function createStep1Entries(context: OnboardingContextInput): PrefillEntry[] {
  const audience = clean(context.audience);
  const outcome = clean(context.outcome);
  const decisionProblem = clean(context.decisionProblem);
  const availableData = clean(context.availableData);

  const step1Rows: Array<[string, string]> = [
    ["customer_segments", audience || "Primary customer groups to focus this strategy on."],
    ["value_proposition", outcome || "Target business transformation outcome this strategy should enable."],
    ["key_activities", decisionProblem ? `First decision to improve: ${decisionProblem}` : "Key activities that should improve decision quality."],
    ["key_resources", availableData ? `Existing data available today: ${availableData}` : "Current systems, reports, and teams that hold usable data."],
  ];

  return step1Rows
    .map(([fieldKey, content]) => ({ stepId: 1 as const, fieldKey, content: clean(content) }))
    .filter((entry) => entry.content.length > 0);
}

function createAreaStarter(
  areaLabel: string,
  prompt: OnboardingContextInput
): Record<Step2Field["key"], string> {
  const audience = clean(prompt.audience);
  const outcome = clean(prompt.outcome);
  const decisionProblem = clean(prompt.decisionProblem);
  const availableData = clean(prompt.availableData);

  return {
    goal:
      areaLabel === "Customer Segments" && audience
        ? `How is performance changing across ${audience.toLowerCase()} segments?`
        : `What must we understand about ${areaLabel.toLowerCase()} to improve outcomes?`,
    data:
      availableData.length > 0
        ? `Start with available evidence: ${availableData}. Add missing data points as needed.`
        : "List the 3-5 data points already available and the key gap still missing.",
    kpi:
      areaLabel === "Value Proposition" && outcome
        ? `Progress metric tied to outcome: ${outcome}`
        : "Define one KPI reviewed regularly that indicates whether this area is healthy.",
    decision: decisionProblem
      ? `Decision supported: ${decisionProblem}`
      : "State the specific decision this KPI should support next.",
  };
}

function createStep2Entries(context: OnboardingContextInput): PrefillEntry[] {
  const rows: PrefillEntry[] = [];

  for (const area of step2BusinessAreas) {
    const starter = createAreaStarter(area.label, context);
    (Object.keys(starter) as Step2Field["key"][]).forEach((field) => {
      rows.push({
        stepId: 2,
        fieldKey: createStep2FieldKey(area.key, field),
        content: clean(starter[field]),
      });
    });
  }

  return rows.filter((entry) => entry.content.length > 0);
}

export function mapOnboardingInputToPrefill(
  input: OnboardingContextInput
): PrefillEntry[] {
  return [...createStep1Entries(input), ...createStep2Entries(input)];
}
