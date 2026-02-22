"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { steps } from "@/lib/steps";
import { buildWorkspaceAiContext } from "@/lib/ai-context";
import { normalizeStepDraftResponse } from "@/lib/ai-step-schema";
import { buildEbookContext } from "@/lib/ai-ebook-context";
import { resolveModelsForStep } from "@/lib/ai-model-router";
import { normalizePlannerResponse } from "@/lib/ai-step-planner-schema";
import {
  getStepFieldKeys,
  getStepFieldStructure,
  type StepApplyMode,
} from "@/lib/step-structure";
import {
  getFormatContract,
  getSectionPrompt,
  getStepSystemPrompt,
} from "@/lib/ai-step-prompts";

type GenerateStepDraftArgs = {
  workspaceId: string;
  stepId: number;
  mode?: StepApplyMode;
  focusSectionId?: string;
};

type ApplyStepDraftArgs = {
  workspaceId: string;
  stepId: number;
  selected: Array<{ fieldKey: string; proposedValue: string }>;
  mode: StepApplyMode;
};

type WorkspaceOwnershipRow = {
  id: string;
  user_id: string;
};

type ExistingStepEntryRow = {
  field_key: string;
  content: string | null;
};

type SectionPlanSummary = {
  intent: string;
  assumptions: string;
  riskFlags: string[];
};

type StepDraftPipelineStage = "planner_writer_v1" | "single_stage_v1";

function requireAiStepDraftEnabled() {
  if (process.env.AI_STEP_DRAFT_ENABLED !== "true") {
    throw new Error("AI step drafting is disabled.");
  }
}

function resolvePipelineStage(): StepDraftPipelineStage {
  return process.env.AI_STEP_DRAFT_PIPELINE === "planner_writer_v1"
    ? "planner_writer_v1"
    : "single_stage_v1";
}

function getPlannerOutputMaxChars() {
  const parsed = Number(process.env.AI_PLANNER_MAX_OUTPUT_CHARS ?? 8000);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 8000;
}

async function requireWorkspaceOwnership(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthenticated");
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id,user_id")
    .eq("id", workspaceId)
    .single<WorkspaceOwnershipRow>();

  if (workspaceError || !workspace || workspace.user_id !== user.id) {
    throw new Error("Workspace not found or access denied.");
  }

  return { supabase, user };
}

async function callChatModel({
  model,
  system,
  user,
  temperature = 0.2,
}: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI request failed: ${response.status} ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI response was empty.");
  }
  return content;
}

function sectionSchemaHint(stepId: number) {
  const structure = getStepFieldStructure(stepId);
  const grouped = new Map<string, { sectionLabel: string; fields: string[] }>();
  for (const field of structure) {
    const section = grouped.get(field.sectionId) ?? {
      sectionLabel: field.sectionLabel,
      fields: [],
    };
    section.fields.push(field.fieldKey);
    grouped.set(field.sectionId, section);
  }
  return Array.from(grouped.entries())
    .map(
      ([sectionId, data]) =>
        `${sectionId} | ${data.sectionLabel} | fields: ${data.fields.join(", ")}`
    )
    .join("\n");
}

function fieldSchemaHint(stepId: number) {
  return getStepFieldStructure(stepId)
    .map(
      (field) =>
        `${field.fieldKey} | ${field.fieldLabel} | section=${field.sectionId} (${field.sectionLabel}) | ${getFormatContract(
          field
        )}`
    )
    .join("\n");
}

function plannerPrompt(args: {
  stepId: number;
  stepTitle: string;
  mode: StepApplyMode;
  focusSectionId?: string;
  stepEntriesContext: string;
  documentContext: string;
  curatedEbook: string;
  ebookExcerpt: string;
}) {
  return [
    `Step ${args.stepId}: ${args.stepTitle}`,
    `Apply mode: ${args.mode}`,
    args.focusSectionId
      ? `Focus section priority: ${args.focusSectionId}`
      : "Focus section priority: none",
    "",
    "Return strict JSON:",
    `{"sectionPlans":[{"sectionId":"...","intent":"...","evidenceUsed":"...","assumptions":"...","riskFlags":["..."],"toneGuidance":"..."}]}`,
    "Include all sectionIds provided.",
    "Use concise values and no markdown.",
    "",
    "Section schema:",
    sectionSchemaHint(args.stepId),
    "",
    "Curated instruction guidance:",
    args.curatedEbook,
    "",
    "Ebook excerpt context:",
    args.ebookExcerpt,
    "",
    "Step entries context:",
    args.stepEntriesContext,
    "",
    "Workspace docs context:",
    args.documentContext,
  ].join("\n");
}

function writerPrompt(args: {
  stepId: number;
  stepTitle: string;
  mode: StepApplyMode;
  focusSectionId?: string;
  plannerJson: string;
  stepEntriesContext: string;
  documentContext: string;
  curatedEbook: string;
  ebookExcerpt: string;
}) {
  const structure = getStepFieldStructure(args.stepId);
  const sectionContracts = Array.from(new Set(structure.map((field) => field.sectionId)))
    .map((sectionId) => `${sectionId}: ${getSectionPrompt(args.stepId, sectionId)}`)
    .join("\n");

  return [
    `Write final field drafts for Step ${args.stepId}: ${args.stepTitle}.`,
    `Apply mode: ${args.mode}`,
    args.focusSectionId
      ? `Focused section: ${args.focusSectionId} (deeper reasoning there, concise starters elsewhere).`
      : "No focused section.",
    "",
    "Return strict JSON object keyed by fieldKey.",
    'Each key value must be: { "proposedValue": string, "reason": string }',
    "Output all field keys in the schema exactly once.",
    "No unknown keys.",
    "",
    "Field schema + format contract:",
    fieldSchemaHint(args.stepId),
    "",
    "Section-specific instruction contracts:",
    sectionContracts,
    "",
    "Planner output JSON:",
    args.plannerJson,
    "",
    "Curated instruction guidance:",
    args.curatedEbook,
    "",
    "Ebook excerpt context:",
    args.ebookExcerpt,
    "",
    "Step entries context:",
    args.stepEntriesContext,
    "",
    "Workspace docs context:",
    args.documentContext,
  ].join("\n");
}

function singleStageFallbackPrompt(args: {
  stepId: number;
  stepTitle: string;
  mode: StepApplyMode;
  focusSectionId?: string;
  stepEntriesContext: string;
  documentContext: string;
  curatedEbook: string;
  ebookExcerpt: string;
}) {
  return [
    `Generate complete field drafts for Step ${args.stepId}: ${args.stepTitle}.`,
    `Apply mode: ${args.mode}.`,
    args.focusSectionId
      ? `Focused section: ${args.focusSectionId}.`
      : "No focused section.",
    "",
    "Return strict JSON object keyed by fieldKey with { proposedValue, reason }.",
    "No unknown keys. Include all keys.",
    "",
    "Field schema + format contract:",
    fieldSchemaHint(args.stepId),
    "",
    "Curated instruction guidance:",
    args.curatedEbook,
    "",
    "Ebook excerpt context:",
    args.ebookExcerpt,
    "",
    "Step entries context:",
    args.stepEntriesContext,
    "",
    "Workspace docs context:",
    args.documentContext,
  ].join("\n");
}

export async function generateStepDraft({
  workspaceId,
  stepId,
  mode = "fill_empty_only",
  focusSectionId,
}: GenerateStepDraftArgs) {
  requireAiStepDraftEnabled();

  if (!Number.isFinite(stepId) || stepId < 1 || stepId > 6) {
    throw new Error("Invalid step.");
  }

  const { supabase } = await requireWorkspaceOwnership(workspaceId);
  const stepTitle = steps.find((entry) => entry.id === stepId)?.title ?? `Step ${stepId}`;
  const structure = getStepFieldStructure(stepId);
  const sectionIds = Array.from(new Set(structure.map((field) => field.sectionId)));
  const normalizedFocusSectionId = focusSectionId && sectionIds.includes(focusSectionId)
    ? focusSectionId
    : undefined;
  const stepFieldKeys = structure.map((field) => field.fieldKey);

  const { data: existingRows, error: existingError } = await supabase
    .from("step_entries")
    .select("field_key,content")
    .eq("workspace_id", workspaceId)
    .eq("step_id", stepId)
    .in("field_key", stepFieldKeys)
    .returns<ExistingStepEntryRow[]>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByKey = new Map(
    (existingRows ?? []).map((row) => [row.field_key, row.content ?? ""])
  );

  const { stepEntriesContext, documentContext } = await buildWorkspaceAiContext(
    supabase,
    workspaceId
  );
  const { curated, excerpt } = buildEbookContext({
    stepId,
    sectionIds,
    documentContext,
  });
  const { plannerModel, writerModel } = resolveModelsForStep(stepId);
  const pipelineStage = resolvePipelineStage();
  const plannerWarnings: string[] = [];
  const warnings: string[] = [];
  const plannerOutputMaxChars = getPlannerOutputMaxChars();
  let sectionPlans = sectionIds.map((sectionId) => ({
    sectionId,
    intent: "Provide a pragmatic starter draft for this section.",
    evidenceUsed: "Use available workspace context conservatively.",
    assumptions: "Assumption: details need validation with the team.",
    riskFlags: ["evidence_limited"],
    toneGuidance: "Concise, practical, and non-speculative.",
  }));
  let writerOutputText: string;

  if (pipelineStage === "planner_writer_v1") {
    const plannerOutputText = await callChatModel({
      model: plannerModel,
      system: getStepSystemPrompt(stepId),
      user: plannerPrompt({
        stepId,
        stepTitle,
        mode,
        focusSectionId: normalizedFocusSectionId,
        stepEntriesContext,
        documentContext,
        curatedEbook: curated,
        ebookExcerpt: excerpt,
      }),
      temperature: 0.15,
    });

    const plannerOutputSafe =
      plannerOutputText.length > plannerOutputMaxChars
        ? plannerOutputText.slice(0, plannerOutputMaxChars)
        : plannerOutputText;

    const { sectionPlans: parsedPlans, warnings: parsedPlannerWarnings } =
      normalizePlannerResponse(plannerOutputSafe, sectionIds);
    sectionPlans = parsedPlans;
    plannerWarnings.push(...parsedPlannerWarnings);

    try {
      writerOutputText = await callChatModel({
        model: writerModel,
        system: getStepSystemPrompt(stepId),
        user: writerPrompt({
          stepId,
          stepTitle,
          mode,
          focusSectionId: normalizedFocusSectionId,
          plannerJson: JSON.stringify({ sectionPlans }),
          stepEntriesContext,
          documentContext,
          curatedEbook: curated,
          ebookExcerpt: excerpt,
        }),
        temperature: 0.2,
      });
    } catch {
      warnings.push("Writer stage failed; used single-stage fallback.");
      writerOutputText = await callChatModel({
        model: writerModel,
        system: getStepSystemPrompt(stepId),
        user: singleStageFallbackPrompt({
          stepId,
          stepTitle,
          mode,
          focusSectionId: normalizedFocusSectionId,
          stepEntriesContext,
          documentContext,
          curatedEbook: curated,
          ebookExcerpt: excerpt,
        }),
        temperature: 0.2,
      });
    }
  } else {
    warnings.push(
      "Planner/writer pipeline disabled by AI_STEP_DRAFT_PIPELINE; used single-stage writer."
    );
    writerOutputText = await callChatModel({
      model: writerModel,
      system: getStepSystemPrompt(stepId),
      user: singleStageFallbackPrompt({
        stepId,
        stepTitle,
        mode,
        focusSectionId: normalizedFocusSectionId,
        stepEntriesContext,
        documentContext,
        curatedEbook: curated,
        ebookExcerpt: excerpt,
      }),
      temperature: 0.2,
    });
  }

  const { normalized, warnings: normalizeWarnings } = normalizeStepDraftResponse(
    writerOutputText,
    structure
  );
  warnings.push(...normalizeWarnings);

  const sectionPlanById = new Map(sectionPlans.map((plan) => [plan.sectionId, plan]));

  const sectionsMap = new Map<
    string,
    {
      sectionId: string;
      sectionLabel: string;
      planSummary: SectionPlanSummary;
      items: Array<{
        fieldKey: string;
        fieldLabel: string;
        currentValue: string;
        proposedValue: string;
        reason: string;
        willApplyByDefault: boolean;
      }>;
    }
  >();

  let emptyFields = 0;
  let nonEmptyFields = 0;

  for (const field of structure) {
    const currentValue = (existingByKey.get(field.fieldKey) ?? "").trim();
    const isEmpty = currentValue.length === 0;
    if (isEmpty) {
      emptyFields += 1;
    } else {
      nonEmptyFields += 1;
    }

    const draft = normalized[field.fieldKey] ?? {
      proposedValue: "",
      reason: "No reason provided.",
    };
    const plan = sectionPlanById.get(field.sectionId);
    const group = sectionsMap.get(field.sectionId) ?? {
      sectionId: field.sectionId,
      sectionLabel: field.sectionLabel,
      planSummary: {
        intent: plan?.intent ?? "Starter intent.",
        assumptions: plan?.assumptions ?? "Assumption: validate with stakeholders.",
        riskFlags: plan?.riskFlags ?? [],
      },
      items: [],
    };

    group.items.push({
      fieldKey: field.fieldKey,
      fieldLabel: field.fieldLabel,
      currentValue,
      proposedValue: draft.proposedValue,
      reason: draft.reason,
      willApplyByDefault: mode === "overwrite" ? true : isEmpty,
    });
    sectionsMap.set(field.sectionId, group);
  }

  return {
    stepId,
    models: { plannerModel, writerModel },
    pipeline: { stage: pipelineStage },
    sections: Array.from(sectionsMap.values()),
    totals: {
      fields: structure.length,
      emptyFields,
      nonEmptyFields,
    },
    warnings,
    plannerWarnings,
  };
}

export async function applyStepDraft({
  workspaceId,
  stepId,
  selected,
  mode,
}: ApplyStepDraftArgs) {
  requireAiStepDraftEnabled();

  if (!Number.isFinite(stepId) || stepId < 1 || stepId > 6) {
    throw new Error("Invalid step.");
  }

  const { supabase } = await requireWorkspaceOwnership(workspaceId);
  const allowedFieldKeys = new Set(getStepFieldKeys(stepId));
  const selectedSafe = selected
    .filter((item) => allowedFieldKeys.has(item.fieldKey))
    .map((item) => ({
      fieldKey: item.fieldKey,
      proposedValue: (item.proposedValue ?? "").trim(),
    }))
    .filter((item) => item.proposedValue.length > 0);

  if (selectedSafe.length === 0) {
    return {
      appliedCount: 0,
      skippedCount: 0,
      overwrittenCount: 0,
    };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("step_entries")
    .select("field_key,content")
    .eq("workspace_id", workspaceId)
    .eq("step_id", stepId)
    .in(
      "field_key",
      selectedSafe.map((item) => item.fieldKey)
    )
    .returns<ExistingStepEntryRow[]>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingByKey = new Map(
    (existingRows ?? []).map((row) => [row.field_key, row.content ?? ""])
  );

  let appliedCount = 0;
  let skippedCount = 0;
  let overwrittenCount = 0;

  const payload = selectedSafe
    .filter((item) => {
      const existing = (existingByKey.get(item.fieldKey) ?? "").trim();
      if (mode === "overwrite") {
        if (existing.length > 0) {
          overwrittenCount += 1;
        }
        return true;
      }
      if (existing.length > 0) {
        skippedCount += 1;
        return false;
      }
      return true;
    })
    .map((item) => {
      appliedCount += 1;
      return {
        workspace_id: workspaceId,
        step_id: stepId,
        field_key: item.fieldKey,
        content: item.proposedValue,
      };
    });

  if (payload.length > 0) {
    const { error: upsertError } = await supabase.from("step_entries").upsert(payload, {
      onConflict: "workspace_id,step_id,field_key",
    });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  revalidatePath("/canvas");
  revalidatePath(`/step/${stepId}`);

  return {
    appliedCount,
    skippedCount,
    overwrittenCount,
  };
}
