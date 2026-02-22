"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { steps } from "@/lib/steps";
import { buildWorkspaceAiContext } from "@/lib/ai-context";

type GetAiChatReplyArgs = {
  workspaceId: string;
  currentStepId: number;
  userMessage: string;
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

  const { stepEntriesContext, documentContext, contextStats } =
    await buildWorkspaceAiContext(supabase, workspaceId);

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
            "You are a practical data strategy coach. Prioritize the user's current step unless they explicitly ask for another step. Give concise, actionable advice with concrete next actions. Do not use placeholders like 'repeat similarly'. When giving templates, include one fully worked example and a concise checklist. Avoid domain assumptions not present in workspace or document context; if needed, label them as Assumption. Treat workspace documents as reference context and do not fabricate facts.",
        },
        {
          role: "user",
          content: [
            `Current step: ${currentStepTitle(currentStepId)}.`,
            "",
            "Step entries context:",
            stepEntriesContext,
            "",
            "Workspace documents context:",
            documentContext,
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
    contextStats,
  };
}
