type EbookContextArgs = {
  stepId: number;
  sectionIds: string[];
  documentContext: string;
};

const curatedByStep: Record<number, string[]> = {
  1: [
    "Keep business model entries concrete and mutually consistent.",
    "Prefer operationally testable statements over abstract ambitions.",
  ],
  2: [
    "Every KPI must support a real decision, not vanity reporting.",
    "Prioritize a few high-signal indicators and explicit decision hooks.",
  ],
  3: [
    "Maturity claims should match evidence and constraints, not aspiration.",
    "Constraint quality matters as much as capability scoring.",
  ],
  4: [
    "Map lifecycle gaps where decisions lose fidelity.",
    "Capture handoff friction and tooling limits explicitly.",
  ],
  5: [
    "Customer pains/gains must tie directly to proposed initiative logic.",
    "Avoid generic value claims; articulate mechanism and evidence.",
  ],
  6: [
    "Vision should be concise and centered on decision-change outcomes.",
    "Scope boundaries should reduce ambiguity and overreach.",
  ],
};

function getSnippetBudget() {
  const parsed = Number(process.env.AI_EBOOK_SNIPPET_MAX_CHARS ?? 6000);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 6000;
}

export function buildEbookContext({
  stepId,
  sectionIds,
  documentContext,
}: EbookContextArgs) {
  const lines: string[] = [];
  for (const hint of curatedByStep[stepId] ?? []) {
    lines.push(`- ${hint}`);
  }

  if (sectionIds.length > 0) {
    lines.push(
      `- Current sections in focus: ${sectionIds.map((entry) => entry.replaceAll("_", " ")).join(", ")}.`
    );
  }

  const curated = lines.join("\n");
  const max = getSnippetBudget();
  const excerpt =
    documentContext.length > max
      ? `${documentContext.slice(0, max).trim()}\n...[excerpt truncated]`
      : documentContext;

  return {
    curated,
    excerpt,
  };
}
