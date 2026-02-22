"use client";

import { useEffect, useState, useTransition } from "react";
import { getAiChatReply } from "@/app/actions/ai-chat";
import { useStepFormContext } from "@/components/step-form-context";
import { createWorkspaceDraftFromChat } from "@/app/actions/workspace-documents";
import { AiStepPreviewModal } from "@/components/ai-step-preview-modal";
import { getStepFieldStructure } from "@/lib/step-structure";

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ContextStats = {
  docCount: number;
  truncatedDocCount: number;
  totalCharsUsed: number;
};

const chatPrompts = [
  "What assumptions in my strategy look weak?",
  "What is missing in my current draft?",
  "Give me a concise rewrite I can use directly.",
];

const draftActions = [{ id: "refine_step", label: "Refine This Step" }];

const structuredIntentPrompts = new Set([
  "help me refine this step for clarity.",
  "help me refine this step for clarity",
  "refine this step",
  "generate this step",
]);

type AiChatPanelProps = {
  workspaceId: string;
  currentStepId: number;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AiChatPanel({ workspaceId, currentStepId }: AiChatPanelProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [focusSectionId, setFocusSectionId] = useState("all");
  const [draftTriggerToken, setDraftTriggerToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [contextStats, setContextStats] = useState<ContextStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const { selectedFieldKey, selectedFieldLabel, insertIntoSelectedField } =
    useStepFormContext();

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setFeedback(null);
    setContextStats(null);
    setFocusSectionId("all");
    setDraftTriggerToken(0);
  }, [workspaceId, currentStepId]);

  const sectionOptions = (() => {
    const seen = new Set<string>();
    return getStepFieldStructure(currentStepId).reduce<Array<{ id: string; label: string }>>(
      (acc, field) => {
        if (!seen.has(field.sectionId)) {
          seen.add(field.sectionId);
          acc.push({ id: field.sectionId, label: field.sectionLabel });
        }
        return acc;
      },
      []
    );
  })();

  const triggerStructuredDraft = (feedbackText = "Opening structured draft preview.") => {
    setError(null);
    setFeedback(feedbackText);
    setDraftTriggerToken((prev) => prev + 1);
  };

  const sendMessage = (content: string) => {
    const message = content.trim();
    if (!message) {
      return;
    }

    if (structuredIntentPrompts.has(message.toLowerCase())) {
      triggerStructuredDraft("Routed to Structured Draft for this step.");
      setInput("");
      return;
    }

    setError(null);
    setFeedback(null);
    setMessages((prev) => [...prev, { id: makeId(), role: "user", content: message }]);
    setInput("");

    startTransition(async () => {
      try {
        const result = await getAiChatReply({
          workspaceId,
          currentStepId,
          userMessage: message,
        });
        setContextStats(result.contextStats);
        setMessages((prev) => [
          ...prev,
          { id: makeId(), role: "assistant", content: result.reply },
        ]);
      } catch (replyError) {
        const messageText =
          replyError instanceof Error ? replyError.message : "AI request failed.";
        setError(messageText);
      }
    });
  };

  const insertMessage = async (content: string) => {
    setFeedback(null);
    const inserted = insertIntoSelectedField(content);
    if (!inserted) {
      setError("Select a target field first, then try insert again.");
      return;
    }

    setError(null);
    setFeedback("Inserted into selected field.");
  };

  const saveDraftFromMessage = (content: string) => {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      try {
        const now = new Date();
        const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(now.getDate()).padStart(2, "0")}`;
        await createWorkspaceDraftFromChat(workspaceId, {
          title: `AI Draft ${dateLabel}`,
          content,
        });
        setFeedback("Saved as workspace draft.");
      } catch (draftError) {
        const messageText =
          draftError instanceof Error ? draftError.message : "Could not save draft.";
        setError(messageText);
      }
    });
  };

  return (
    <div className="flex h-full min-h-[480px] w-full flex-col rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Refine With AI
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Structured drafting + chat with workspace context.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessages([]);
            setError(null);
            setFeedback(null);
          }}
          className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-zinc-300"
        >
          Clear chat
        </button>
      </div>
      <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Structured Draft (Cell-Level)
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          Generate precise per-cell drafts for this step.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
            <span>Focus</span>
            <select
              value={focusSectionId}
              onChange={(event) => setFocusSectionId(event.target.value)}
              className="h-6 rounded-full border border-zinc-200 bg-white px-2 text-xs text-zinc-700 outline-none focus:border-zinc-400"
              aria-label="Focus section"
            >
              <option value="all">This step</option>
              {sectionOptions.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>
          {draftActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => triggerStructuredDraft("Running structured step draft.")}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300"
            >
              {action.label}
            </button>
          ))}
        </div>
        <AiStepPreviewModal
          workspaceId={workspaceId}
          stepId={currentStepId}
          focusSectionId={focusSectionId}
          onFocusSectionIdChange={setFocusSectionId}
          triggerGenerateToken={draftTriggerToken}
        />
      </div>

      <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Chat Assistant (Free Text)
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          Advisory guidance for critique, assumptions, and rewrites.
        </p>
        <div className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600">
          Target:{" "}
          <span className="font-medium text-zinc-800">
            {selectedFieldLabel ?? "None selected"}
          </span>
        </div>
        {contextStats && (
          <div className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-600">
            Context docs: {contextStats.docCount}; truncated/skipped: {contextStats.truncatedDocCount}; chars used:{" "}
            {contextStats.totalCharsUsed}.
          </div>
        )}
      </div>

      {messages.length === 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-zinc-600">
            Start with a quick prompt or ask your own question.
          </p>
          <div className="flex flex-col gap-2">
            {chatPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-xl p-3 text-sm ${
              message.role === "user"
                ? "ml-6 bg-zinc-900 text-white"
                : "mr-6 border border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.role === "assistant" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertMessage(message.content)}
                  disabled={!selectedFieldKey}
                  className="rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 disabled:opacity-60"
                >
                  Insert into selected field
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(message.content);
                    setFeedback("Copied to clipboard.");
                  }}
                  className="rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => saveDraftFromMessage(message.content)}
                  className="rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300"
                >
                  Save as workspace draft
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
      {feedback && <p className="mt-2 text-xs text-emerald-700">{feedback}</p>}

      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask AI to refine this strategy..."
          className="min-h-[88px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          disabled={isPending || !input.trim()}
          className="self-end rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
