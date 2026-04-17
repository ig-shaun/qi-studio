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
              // Prompt caching — typed as any because the SDK's TextBlockParam
              // in this version omits cache_control even though the API honors it.
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
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced && fenced[1]) return fenced[1].trim();
  // Fall back to the first balanced JSON object/array in the text.
  const firstBrace = text.search(/[\[{]/);
  if (firstBrace === -1) {
    throw new CopilotOutputError("no JSON found in copilot output", text);
  }
  return text.slice(firstBrace).trim();
};
