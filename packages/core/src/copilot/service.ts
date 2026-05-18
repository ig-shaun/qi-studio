import { SYSTEM_PROMPT } from "./system-prompt.js";
import {
  CopilotConfigError,
  CopilotConnectionError,
  CopilotOutputError,
  CopilotRequestError,
} from "./errors.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_VERSION = "2023-06-01";

type AnthropicMessage = {
  content?: Array<{ type?: string; text?: string }>;
};

export type CopilotClient = {
  complete: (args: {
    userPrompt: string;
    passPrompt: string;
    maxTokens?: number;
    signal?: AbortSignal;
  }) => Promise<{ text: string; raw: AnthropicMessage }>;
};

export const createCopilot = (opts?: {
  apiKey?: string;
  model?: string;
}): CopilotClient => {
  const apiKey = (opts?.apiKey ?? process.env.ANTHROPIC_API_KEY)?.trim();
  if (!apiKey) {
    throw new CopilotConfigError(
      "ANTHROPIC_API_KEY is not set. Copilot cannot call Claude."
    );
  }
  const model = opts?.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  return {
    async complete({ userPrompt, passPrompt, maxTokens = 2048, signal }) {
      let response: Response;
      try {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "anthropic-version": ANTHROPIC_VERSION,
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `${passPrompt}\n\n---\nUser input:\n${userPrompt}`,
              },
            ],
          }),
          ...(signal ? { signal } : {}),
        });
      } catch (err) {
        throw new CopilotConnectionError(
          `Could not reach Anthropic: ${
            err instanceof Error ? err.message : String(err)
          }`,
          { cause: err }
        );
      }

      const body = await response.text();
      if (!response.ok) {
        throw new CopilotRequestError(response.status, body);
      }

      let raw: AnthropicMessage;
      try {
        raw = JSON.parse(body) as AnthropicMessage;
      } catch (err) {
        throw new CopilotOutputError(
          `Anthropic response was not valid JSON: ${
            err instanceof Error ? err.message : String(err)
          }`,
          body
        );
      }

      const text = (raw.content ?? [])
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("\n");

      if (!text.trim()) {
        throw new CopilotOutputError(
          "Anthropic response did not include a text block",
          body
        );
      }

      return { text, raw };
    },
  };
};

export const extractJsonBlock = (text: string): string => {
  const start = text.search(/[\[{]/);
  if (start === -1) {
    throw new CopilotOutputError("no JSON found in copilot output", text);
  }

  const open = text[start]!;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  throw new CopilotOutputError(
    "JSON in copilot output was not balanced (likely truncated)",
    text
  );
};
