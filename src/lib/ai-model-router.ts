type StepModels = {
  plannerModel: string;
  writerModel: string;
};

const defaultByStep: Record<number, StepModels> = {
  1: { plannerModel: "gpt-4.1-mini", writerModel: "gpt-4.1-mini" },
  2: { plannerModel: "gpt-4.1", writerModel: "gpt-4.1-mini" },
  3: { plannerModel: "gpt-4.1", writerModel: "gpt-4.1-mini" },
  4: { plannerModel: "gpt-4.1-mini", writerModel: "gpt-4.1-mini" },
  5: { plannerModel: "gpt-4.1", writerModel: "gpt-4.1-mini" },
  6: { plannerModel: "gpt-4.1", writerModel: "gpt-4.1-mini" },
};

function env(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

export function resolveModelsForStep(stepId: number): StepModels {
  const fallback = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const defaults = defaultByStep[stepId] ?? {
    plannerModel: fallback,
    writerModel: fallback,
  };

  const stepSpecific = env(`AI_MODEL_STEP_${stepId}`);
  if (stepSpecific) {
    return {
      plannerModel: stepSpecific,
      writerModel: stepSpecific,
    };
  }

  return {
    plannerModel: env("AI_MODEL_PLANNER_FALLBACK") ?? defaults.plannerModel,
    writerModel: env("AI_MODEL_WRITER_FALLBACK") ?? defaults.writerModel,
  };
}
