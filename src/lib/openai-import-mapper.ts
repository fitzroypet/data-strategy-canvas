import { VALID_FIELD_KEYS } from "@/lib/field-catalog";

type MapImportArgs = {
  extractedText: string;
};

export type MappingResult = {
  mapping: Record<string, string>;
  warnings: string[];
};

const MAX_FIELD_LENGTH = 4000;

function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

function buildSystemPrompt() {
  return [
    "You are helping map business strategy documents into a 6-step data strategy canvas.",
    "Return strict JSON only with this shape: {\"mapping\": {\"field_key\": \"content\"}}.",
    "Use only the allowed field keys provided by the user.",
    "Do not invent facts; only map clear information from the source text.",
    "Keep content concise and practical.",
    "If unknown, omit the field key.",
  ].join(" ");
}

function cleanMapping(raw: unknown): MappingResult {
  const warnings: string[] = [];
  const mapping: Record<string, string> = {};

  if (!raw || typeof raw !== "object" || !("mapping" in raw)) {
    throw new Error("Model response did not include a mapping object.");
  }

  const candidate = (raw as { mapping: unknown }).mapping;
  if (!candidate || typeof candidate !== "object") {
    throw new Error("Model mapping payload is not a valid object.");
  }

  for (const [fieldKey, value] of Object.entries(candidate as Record<string, unknown>)) {
    if (!VALID_FIELD_KEYS.has(fieldKey)) {
      warnings.push(`Ignored unknown field key: ${fieldKey}`);
      continue;
    }

    if (typeof value !== "string") {
      warnings.push(`Ignored non-string content for field key: ${fieldKey}`);
      continue;
    }

    const cleaned = value.trim().slice(0, MAX_FIELD_LENGTH);
    if (!cleaned) {
      continue;
    }
    mapping[fieldKey] = cleaned;
  }

  return { mapping, warnings };
}

export async function mapDocumentToFieldKeys({
  extractedText,
}: MapImportArgs): Promise<MappingResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const allowedFieldKeys = Array.from(VALID_FIELD_KEYS).sort();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: [
            "Allowed field keys:",
            allowedFieldKeys.join(", "),
            "",
            "Source strategy document text:",
            extractedText,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawContent = json.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI response did not include message content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error("OpenAI returned invalid JSON content.");
  }

  return cleanMapping(parsed);
}

