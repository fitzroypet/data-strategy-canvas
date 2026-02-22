import { STEP_FIELD_DEFINITIONS } from "@/lib/field-catalog";

export type StepApplyMode = "fill_empty_only" | "overwrite";
export type StepFieldFormatHint = "bullets" | "short_paragraph" | "score";

export type StepFieldStructure = {
  stepId: number;
  fieldKey: string;
  fieldLabel: string;
  sectionId: string;
  sectionLabel: string;
  order: number;
  formatHint: StepFieldFormatHint;
  maxChars: number;
};

const step2AreaMap: Record<string, string> = {
  customer_segments: "Customer Segments",
  value_proposition: "Value Proposition",
  channels: "Channels",
  customer_relationships: "Customer Relationships",
  revenue_streams: "Revenue Streams",
  key_resources: "Key Resources",
  key_activities: "Key Activities",
  key_partnerships: "Key Partnerships",
  cost_structure: "Cost Structure",
};

const step3PillarMap: Record<string, string> = {
  people_culture: "People & Culture",
  processes: "Processes",
  technology: "Technology",
  governance: "Governance",
  strategy_impact: "Strategy & Impact",
};

const step4StageMap: Record<string, string> = {
  capture: "Capture",
  store: "Store",
  prepare: "Prepare",
  analyse: "Analyse",
  visualise: "Visualise",
  act: "Act",
  learn: "Learn",
};

function deriveSection(stepId: number, fieldKey: string) {
  if (stepId === 1) {
    return { sectionId: "business_model", sectionLabel: "Business Model Blocks" };
  }

  if (stepId === 2) {
    const tokens = fieldKey.split("_");
    if (tokens.length >= 4 && tokens[0] === "kpi") {
      const areaKey = tokens.slice(1, -1).join("_");
      return {
        sectionId: `area_${areaKey}`,
        sectionLabel: step2AreaMap[areaKey] ?? areaKey,
      };
    }
  }

  if (stepId === 3) {
    const pillarKey = fieldKey.replace(/_(level|evidence|constraints)$/, "");
    return {
      sectionId: `pillar_${pillarKey}`,
      sectionLabel: step3PillarMap[pillarKey] ?? pillarKey,
    };
  }

  if (stepId === 4) {
    const tokens = fieldKey.split("_");
    const stage = tokens[1];
    return {
      sectionId: `stage_${stage}`,
      sectionLabel: step4StageMap[stage] ?? stage,
    };
  }

  if (stepId === 5) {
    const customerSet = new Set([
      "customer_profile",
      "jobs_to_be_done",
      "pains",
      "gains",
    ]);
    return customerSet.has(fieldKey)
      ? { sectionId: "customer_profile", sectionLabel: "Customer Profile" }
      : { sectionId: "value_map", sectionLabel: "Value Map" };
  }

  if (stepId === 6) {
    return fieldKey === "vision_statement"
      ? { sectionId: "vision_statement", sectionLabel: "Vision Statement" }
      : { sectionId: "vision_components", sectionLabel: "Vision Components" };
  }

  return { sectionId: `step_${stepId}`, sectionLabel: `Step ${stepId}` };
}

function deriveFormatHint(stepId: number, fieldKey: string): StepFieldFormatHint {
  if (stepId === 3 && fieldKey.endsWith("_level")) {
    return "score";
  }
  if (fieldKey === "vision_statement") {
    return "short_paragraph";
  }
  return "bullets";
}

function deriveMaxChars(stepId: number, fieldKey: string) {
  if (stepId === 3 && fieldKey.endsWith("_level")) {
    return 8;
  }
  if (fieldKey === "vision_statement") {
    return 1200;
  }
  return 900;
}

export function getStepFieldStructure(stepId: number): StepFieldStructure[] {
  return STEP_FIELD_DEFINITIONS.filter((entry) => entry.stepId === stepId)
    .map((entry, index) => {
      const section = deriveSection(stepId, entry.fieldKey);
      return {
        stepId,
        fieldKey: entry.fieldKey,
        fieldLabel: entry.fieldLabel,
        sectionId: section.sectionId,
        sectionLabel: section.sectionLabel,
        order: index,
        formatHint: deriveFormatHint(stepId, entry.fieldKey),
        maxChars: deriveMaxChars(stepId, entry.fieldKey),
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getStepFieldKeys(stepId: number) {
  return getStepFieldStructure(stepId).map((entry) => entry.fieldKey);
}
