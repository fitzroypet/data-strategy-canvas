"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyStepDraft, generateStepDraft } from "@/app/actions/ai-step-draft";
import type { StepApplyMode } from "@/lib/step-structure";
import { getStepFieldStructure } from "@/lib/step-structure";

type StepDraftResponse = Awaited<ReturnType<typeof generateStepDraft>>;

type AiStepPreviewModalProps = {
  workspaceId: string;
  stepId: number;
  focusSectionId?: string;
  onFocusSectionIdChange?: (value: string) => void;
  triggerGenerateToken?: number;
};

function truncatePreview(text: string, max = 240) {
  const value = (text ?? "").trim();
  if (value.length <= max) {
    return value || "(empty)";
  }
  return `${value.slice(0, max).trim()}...`;
}

function selectionKey(fieldKey: string) {
  return `selected:${fieldKey}`;
}

export function AiStepPreviewModal({
  workspaceId,
  stepId,
  focusSectionId: focusSectionIdProp,
  onFocusSectionIdChange,
  triggerGenerateToken,
}: AiStepPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<StepApplyMode>("fill_empty_only");
  const [focusSectionIdLocal, setFocusSectionIdLocal] = useState<string>("all");
  const [draft, setDraft] = useState<StepDraftResponse | null>(null);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedCount = useMemo(
    () =>
      Object.values(selectedMap).reduce((count, selected) => (selected ? count + 1 : count), 0),
    [selectedMap]
  );
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
  const focusSectionId = focusSectionIdProp ?? focusSectionIdLocal;

  const setFocusSectionId = (value: string) => {
    if (onFocusSectionIdChange) {
      onFocusSectionIdChange(value);
      return;
    }
    setFocusSectionIdLocal(value);
  };

  const generate = (focusId = focusSectionId) => {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const response = await generateStepDraft({
          workspaceId,
          stepId,
          mode,
          focusSectionId: focusId === "all" ? undefined : focusId,
        });
        setDraft(response);
        const defaults: Record<string, boolean> = {};
        for (const section of response.sections) {
          for (const item of section.items) {
            defaults[selectionKey(item.fieldKey)] = item.willApplyByDefault;
          }
        }
        setSelectedMap(defaults);
        setOpen(true);
      } catch (draftError) {
        const message =
          draftError instanceof Error ? draftError.message : "Could not generate step draft.";
        setError(message);
      }
    });
  };

  useEffect(() => {
    if (!triggerGenerateToken || triggerGenerateToken < 1) {
      return;
    }
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGenerateToken]);

  const applySelected = () => {
    if (!draft) {
      return;
    }

    const selected = draft.sections
      .flatMap((section) => section.items)
      .filter((item) => selectedMap[selectionKey(item.fieldKey)])
      .map((item) => ({ fieldKey: item.fieldKey, proposedValue: item.proposedValue }));

    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const result = await applyStepDraft({
          workspaceId,
          stepId,
          selected,
          mode,
        });
        setFeedback(
          `Applied ${result.appliedCount}. Skipped ${result.skippedCount}. Overwritten ${result.overwrittenCount}.`
        );
        router.refresh();
        setOpen(false);
      } catch (applyError) {
        const message =
          applyError instanceof Error ? applyError.message : "Could not apply selected draft.";
        setError(message);
      }
    });
  };

  const toggleItem = (fieldKey: string) => {
    const key = selectionKey(fieldKey);
    setSelectedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!focusSectionIdProp && (
          <select
            value={focusSectionId}
            onChange={(event) => setFocusSectionId(event.target.value)}
            className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
          >
            <option value="all">Focus: this step</option>
            {sectionOptions.map((section) => (
              <option key={section.id} value={section.id}>
                Focus: {section.label}
              </option>
            ))}
          </select>
        )}
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as StepApplyMode)}
          className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs text-zinc-700 shadow-sm outline-none focus:border-zinc-400"
        >
          <option value="fill_empty_only">Fill empty only</option>
          <option value="overwrite">Allow overwrite</option>
        </select>
        <button
          type="button"
          disabled={isPending}
          onClick={() => generate()}
          className="h-9 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
        >
          Generate This Step
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
      {feedback && <p className="mt-2 text-xs text-emerald-700">{feedback}</p>}

      {open && draft && (
        <div className="fixed inset-0 z-50 bg-zinc-900/35 p-4">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  AI Draft Preview
                </div>
                <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                  Step {draft.stepId} draft ({draft.totals.fields} fields)
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                    pipeline: {draft.pipeline.stage}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                    planner: {draft.models.plannerModel}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                    writer: {draft.models.writerModel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-300"
              >
                Close
              </button>
            </div>

            {draft.warnings.length > 0 && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {draft.warnings.join(" ")}
              </div>
            )}
            {draft.plannerWarnings.length > 0 && (
              <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                {draft.plannerWarnings.join(" ")}
              </div>
            )}

            <div className="flex-1 space-y-4 overflow-auto pr-1">
              {draft.sections.map((section) => (
                <section
                  key={section.sectionId}
                  className="rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-3"
                >
                  <div className="mb-2 text-sm font-semibold text-zinc-800">
                    {section.sectionLabel}
                  </div>
                  <div className="mb-2 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[11px] text-zinc-600">
                    <p>
                      <span className="font-medium text-zinc-700">Intent:</span>{" "}
                      {section.planSummary.intent}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-zinc-700">Assumptions:</span>{" "}
                      {section.planSummary.assumptions}
                    </p>
                    {section.planSummary.riskFlags.length > 0 && (
                      <p className="mt-1">
                        <span className="font-medium text-zinc-700">Risk flags:</span>{" "}
                        {section.planSummary.riskFlags.join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const selected = selectedMap[selectionKey(item.fieldKey)] ?? false;
                      const isEmpty = !item.currentValue.trim();
                      return (
                        <article
                          key={item.fieldKey}
                          className="rounded-xl border border-zinc-200 bg-white p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleItem(item.fieldKey)}
                                className="h-4 w-4 rounded border-zinc-300"
                              />
                              {item.fieldLabel}
                            </label>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isEmpty
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {isEmpty ? "empty" : "already filled"}
                            </span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-600">
                              <div className="mb-1 font-medium text-zinc-500">Current</div>
                              <pre className="whitespace-pre-wrap font-sans">
                                {truncatePreview(item.currentValue)}
                              </pre>
                            </div>
                            <div className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-700">
                              <div className="mb-1 font-medium text-zinc-500">Proposed</div>
                              <pre className="whitespace-pre-wrap font-sans">
                                {truncatePreview(item.proposedValue, 320)}
                              </pre>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-zinc-500">{item.reason}</p>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-200 pt-3">
              <div className="text-xs text-zinc-600">Selected cells: {selectedCount}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generate("all")}
                  disabled={isPending}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => generate(focusSectionId)}
                  disabled={isPending || focusSectionId === "all"}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
                >
                  Focus Section
                </button>
                <button
                  type="button"
                  onClick={applySelected}
                  disabled={isPending || selectedCount === 0}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  Apply Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
