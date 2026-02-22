import type { StepFieldStructure } from "@/lib/step-structure";

const stepPurpose: Record<number, string> = {
  1: "Clarify business model logic and strategic coherence.",
  2: "Validate KPI alignment and decision relevance.",
  3: "Enforce maturity realism and practical constraints.",
  4: "Detect lifecycle breaks and operational bottlenecks.",
  5: "Stress-test customer/value proposition logic rigorously.",
  6: "Craft concise, credible decision-oriented vision.",
};

const sectionOverrides: Record<string, string> = {
  "3:pillar_people_culture":
    "Be realistic about capability and behavior adoption. Avoid aspirational claims without evidence.",
  "3:pillar_processes":
    "Focus on repeatability, process ownership, and measurable operational discipline.",
  "5:customer_profile":
    "Ground statements in concrete customer evidence, not generic personas.",
  "5:value_map":
    "Demonstrate clear chain from pains/gains to initiatives and delivery mechanisms.",
  "6:vision_statement":
    "Prioritize clarity, brevity, and concrete decision change outcomes.",
};

export function getStepSystemPrompt(stepId: number) {
  return [
    "You are a precision data strategy drafting assistant.",
    stepPurpose[stepId] ?? "Draft precise strategy content for this step.",
    "Do not fabricate facts. Use assumption markers when evidence is weak.",
    "Produce pragmatic, implementation-ready language.",
  ].join(" ");
}

export function getSectionPrompt(stepId: number, sectionId: string) {
  return (
    sectionOverrides[`${stepId}:${sectionId}`] ??
    "Use concise, evidence-oriented drafting with clear decision implications."
  );
}

export function getFormatContract(field: StepFieldStructure) {
  if (field.formatHint === "score") {
    return "Return a single maturity level value from 1 to 5.";
  }
  if (field.formatHint === "short_paragraph") {
    return `Return one concise paragraph. Max ${field.maxChars} chars.`;
  }
  return `Return 1-4 short actionable bullets prefixed with '- '. Max ${field.maxChars} chars.`;
}
