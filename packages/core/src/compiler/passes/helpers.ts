import { z } from "zod";
import { createCopilot, extractJsonBlock, CopilotOutputError } from "../../copilot/index.js";

export type LlmCallArgs = {
  userPrompt: string;
  passPrompt: string;
  maxTokens?: number;
  signal?: AbortSignal;
};

export const runLlmPass = async <T extends z.ZodTypeAny>(
  schema: T,
  args: LlmCallArgs
): Promise<z.infer<T>> => {
  const copilot = createCopilot();
  const complete = {
    userPrompt: args.userPrompt,
    passPrompt: args.passPrompt,
    maxTokens: args.maxTokens ?? 8192,
    ...(args.signal ? { signal: args.signal } : {}),
  };
  const { text } = await copilot.complete(complete);
  try {
    const json = extractJsonBlock(text);
    return schema.parse(JSON.parse(json));
  } catch (err) {
    if (err instanceof CopilotOutputError) throw err;
    throw new CopilotOutputError(
      `response did not validate: ${(err as Error).message}`,
      text
    );
  }
};

// Shared fragment for patch metadata shape across all passes.
export const PatchMetaSchema = z.object({
  rationale: z.string(),
  assumptions: z.array(z.string()).default([]),
  tradeoffs: z.array(z.string()).default([]),
  impactedMetrics: z.array(z.string()).default([]),
});
