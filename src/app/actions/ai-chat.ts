"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { steps } from "@/lib/steps";

type GetAiChatReplyArgs = {
  workspaceId: string;
  currentStepId: number;
  userMessage: string;
};

type StepEntryRow = {
  step_id: number;
  field_key: string;
  content: string | null;
};

type WorkspaceOwnershipRow = {
  id: string;
  user_id: string;
};

const MAX_MESSAGE_LENGTH = 2000;

function requireAiChatEnabled() {
  if (process.env.AI_CHAT_PANEL_ENABLED !== "true") {
    throw new Error("AI chat is disabled.");
  }
}

function currentStepTitle(stepId: number) {
  return steps.find((entry) => entry.id === stepId)?.title ?? `Step ${stepId}`;
}

function buildWorkspaceContext(entries: StepEntryRow[]) {
  const grouped = new Map<number, Array<{ fieldKey: string; content: string }>>();

  for (const row of entries) {
    const cleaned = (row.content ?? "").trim();
    if (!cleaned) {
      continue;
    }

    const list = grouped.get(row.step_id) ?? [];
    list.push({
      fieldKey: row.field_key,
      content: cleaned,
    });
    grouped.set(row.step_id, list);
  }

  const lines: string[] = [];
  for (const step of steps) {
    lines.push(`Step ${step.id} - ${step.title}`);
    const list = grouped.get(step.id) ?? [];
    if (list.length === 0) {
      lines.push("- (no saved content)");
      continue;
    }
    for (const item of list) {
      lines.push(`- ${item.fieldKey}: ${item.content}`);
    }
  }

  return lines.join("\n");
}

export async function getAiChatReply({
  workspaceId,
  currentStepId,
  userMessage,
}: GetAiChatReplyArgs) {
  requireAiChatEnabled();

  const message = userMessage.trim();
  if (!message) {
    throw new Error("Message cannot be empty.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message is too long. Limit to ${MAX_MESSAGE_LENGTH} characters.`);
  }

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

  const { data: entries, error: entriesError } = await supabase
    .from("step_entries")
    .select("step_id,field_key,content")
    .eq("workspace_id", workspaceId)
    .order("step_id", { ascending: true });

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  const workspaceContext = buildWorkspaceContext((entries ?? []) as StepEntryRow[]);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a practical data strategy coach. Give concise, actionable advice. Do not invent facts. If information is missing, say so clearly.",
        },
        {
          role: "user",
          content: [
            `Current step: ${currentStepTitle(currentStepId)}.`,
            "Use whole workspace context below when advising:",
            workspaceContext,
            "",
            `User question: ${message}`,
          ].join("\n"),
        },
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
  const reply = payload.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("AI response was empty.");
  }

  return {
    reply,
  };
}

