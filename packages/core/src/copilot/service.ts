import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { CopilotConfigError, CopilotOutputError } from "./errors.js";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export type CopilotClient = {
  complete: (args: {
    userPrompt: string;
    passPrompt: string;
    maxTokens?: number;
    signal?: AbortSignal;
  }) => Promise<{ text: string; raw: Anthropic.Message }>;
};

export const createCopilot = (opts?: {
  apiKey?: string;
  model?: string;
}): CopilotClient => {
  const apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new CopilotConfigError(
      "ANTHROPIC_API_KEY is not set. Copilot cannot call Claude."
    );
  }
  const client = new Anthropic({ apiKey });
  const model = opts?.model ?? DEFAULT_MODEL;

  return {
    async complete({ userPrompt, passPrompt, maxTokens = 2048, signal }) {
      const raw = await client.messages.create(
        {
          model,
          max_tokens: maxTokens,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            } as unknown as Anthropic.TextBlockParam,
          ],
          messages: [
            {
              role: "user",
              content: `${passPrompt}\n\n---\nUser input:\n${userPrompt}`,
            },
          ],
        },
        signal ? { signal } : undefined
      );

      const text = raw.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

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
