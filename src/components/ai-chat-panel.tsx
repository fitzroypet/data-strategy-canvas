"use client";

import { useEffect, useState, useTransition } from "react";
import { getAiChatReply } from "@/app/actions/ai-chat";
import { useStepFormContext } from "@/components/step-form-context";

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickPrompts = [
  "Help me refine this step for clarity.",
  "What assumptions in my strategy look weak?",
  "What is missing in my current draft?",
  "Give me a concise rewrite I can use directly.",
];

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
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { selectedFieldKey, selectedFieldLabel, insertIntoSelectedField } =
    useStepFormContext();

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setFeedback(null);
  }, [workspaceId, currentStepId]);

  const sendMessage = (content: string) => {
    const message = content.trim();
    if (!message) {
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

  return (
    <div className="flex h-full min-h-[480px] w-full flex-col rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Refine With AI
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Chat with context from your whole workspace.
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

      <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs text-zinc-600">
        Target:{" "}
        <span className="font-medium text-zinc-800">
          {selectedFieldLabel ?? "None selected"}
        </span>
      </div>

      {messages.length === 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-zinc-600">
            Start with a quick prompt or ask your own question.
          </p>
          <div className="flex flex-col gap-2">
            {quickPrompts.map((prompt) => (
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

