export type SectionPlan = {
  sectionId: string;
  intent: string;
  evidenceUsed: string;
  assumptions: string;
  riskFlags: string[];
  toneGuidance: string;
};

function parseJSONObject(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    throw new Error("Planner did not return valid JSON.");
  }
}

function toText(value: unknown, fallback: string) {
  const next = String(value ?? "").trim();
  return next || fallback;
}

export function normalizePlannerResponse(
  rawResponseText: string,
  allowedSectionIds: string[]
) {
  const parsed = parseJSONObject(rawResponseText);
  const obj =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const plansRaw = Array.isArray(obj.sectionPlans) ? obj.sectionPlans : [];
  const warnings: string[] = [];
  const bySection = new Map<string, SectionPlan>();

  for (const item of plansRaw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const sectionId = toText(row.sectionId, "");
    if (!sectionId || !allowedSectionIds.includes(sectionId)) {
      warnings.push(`Ignored unknown planner section: ${sectionId || "(empty)"}`);
      continue;
    }
    bySection.set(sectionId, {
      sectionId,
      intent: toText(row.intent, "Draft this section with practical clarity."),
      evidenceUsed: toText(row.evidenceUsed, "Use available workspace evidence and document excerpts."),
      assumptions: toText(row.assumptions, "Assumption: confirm details with stakeholders."),
      toneGuidance: toText(row.toneGuidance, "Concise and decision-oriented."),
      riskFlags: Array.isArray(row.riskFlags)
        ? row.riskFlags.map((value) => String(value).trim()).filter(Boolean).slice(0, 4)
        : [],
    });
  }

  const sectionPlans: SectionPlan[] = allowedSectionIds.map((sectionId) => {
    const existing = bySection.get(sectionId);
    if (existing) {
      return existing;
    }
    warnings.push(`Planner missing section ${sectionId}; injected starter plan.`);
    return {
      sectionId,
      intent: "Provide a pragmatic starter draft for this section.",
      evidenceUsed: "Use available workspace context conservatively.",
      assumptions: "Assumption: details need validation with the team.",
      riskFlags: ["evidence_limited"],
      toneGuidance: "Concise, practical, and non-speculative.",
    };
  });

  return { sectionPlans, warnings };
}
