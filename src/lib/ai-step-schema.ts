import type { StepFieldStructure } from "@/lib/step-structure";

export type StepFieldDraftValue = {
  proposedValue: string;
  reason: string;
};

export type StepFieldDraftMap = Record<string, StepFieldDraftValue>;

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
    throw new Error("AI did not return valid JSON.");
  }
}

function toBulletLines(text: string) {
  const compact = text
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s?/, "").trim())
    .filter(Boolean);
  if (compact.length === 0) {
    return "";
  }
  return compact.slice(0, 4).map((line) => `- ${line}`).join("\n");
}

function normalizeDraftValue(raw: string, field: StepFieldStructure) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return "";
  }

  if (field.formatHint === "score") {
    const match = trimmed.match(/[1-5]/);
    return match ? match[0] : "3";
  }

  if (field.formatHint === "short_paragraph") {
    return trimmed.slice(0, field.maxChars);
  }

  return toBulletLines(trimmed).slice(0, field.maxChars);
}

function fallbackProposed(field: StepFieldStructure) {
  if (field.formatHint === "score") {
    return "3";
  }
  if (field.formatHint === "short_paragraph") {
    return `Assumption: Draft a concise vision statement for ${field.fieldLabel.toLowerCase()} based on current workspace context.`;
  }
  return `- Assumption: Add initial draft for ${field.fieldLabel.toLowerCase()}.\n- Validate with team evidence and update specifics.`;
}

function fallbackReason() {
  return "Starter draft generated because specific evidence was limited.";
}

export function normalizeStepDraftResponse(
  rawResponseText: string,
  structure: StepFieldStructure[]
) {
  const parsed = parseJSONObject(rawResponseText);
  const responseObject =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const normalized: StepFieldDraftMap = {};
  const warnings: string[] = [];
  const knownKeys = new Set(structure.map((entry) => entry.fieldKey));

  for (const key of Object.keys(responseObject)) {
    if (!knownKeys.has(key)) {
      warnings.push(`Ignored unknown field key: ${key}`);
    }
  }

  for (const field of structure) {
    const rawItem = responseObject[field.fieldKey];
    let proposedValue = "";
    let reason = "";

    if (rawItem && typeof rawItem === "object") {
      const row = rawItem as Record<string, unknown>;
      proposedValue = normalizeDraftValue(String(row.proposedValue ?? ""), field);
      reason = String(row.reason ?? "").trim();
    } else if (typeof rawItem === "string") {
      proposedValue = normalizeDraftValue(rawItem, field);
    }

    if (!proposedValue) {
      proposedValue = fallbackProposed(field);
      warnings.push(`Used fallback starter for ${field.fieldLabel}.`);
    }

    normalized[field.fieldKey] = {
      proposedValue,
      reason: reason || fallbackReason(),
    };
  }

  return { normalized, warnings };
}
