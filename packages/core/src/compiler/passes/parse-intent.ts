import { z } from "zod";
import { nanoid } from "nanoid";
import { createCopilot, extractJsonBlock, CopilotOutputError } from "../../copilot/index.js";
import { newNodeId } from "../../schema/ids.js";
import { AdaptabilityTarget, Horizon } from "../../schema/primitives.js";
import type { IntentKernel } from "../../schema/intent.js";
import type { Pass } from "./types.js";
import { PARSE_INTENT_PROMPT } from "../prompts/parse-intent.js";

const ParseIntentResponse = z.object({
  rationale: z.string(),
  assumptions: z.array(z.string()).default([]),
  tradeoffs: z.array(z.string()).default([]),
  impactedMetrics: z.array(z.string()).default([]),
  kernel: z.object({
    purpose: z.string().min(1),
    stakeholders: z.array(
      z.object({
        label: z.string(),
        kind: z.enum(["customer", "beneficiary", "regulator", "partner", "internal"]),
      })
    ),
    outcomes: z.array(
      z.object({
        statement: z.string(),
        metric: z.string().nullable().optional(),
      })
    ),
    constraints: z
      .array(
        z.object({
          statement: z.string(),
          kind: z.enum([
            "regulatory",
            "ethical",
            "resource",
            "technical",
            "strategic",
          ]),
        })
      )
      .default([]),
    sovereigntyZones: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
        })
      )
      .min(1),
    principles: z
      .array(z.object({ statement: z.string() }))
      .default([]),
    horizon: Horizon.default("1y"),
    adaptabilityTarget: AdaptabilityTarget.default("adaptive"),
  }),
});

export const parseIntent: Pass = async (ctx) => {
  if (!ctx.userPrompt) {
    throw new Error("parseIntent requires a userPrompt");
  }

  const copilot = createCopilot();
  const completeArgs = {
    userPrompt: ctx.userPrompt,
    passPrompt: PARSE_INTENT_PROMPT,
    maxTokens: 8192,
    ...(ctx.signal ? { signal: ctx.signal } : {}),
  };
  const { text } = await copilot.complete(completeArgs);

  let parsed: z.infer<typeof ParseIntentResponse>;
  try {
    const json = extractJsonBlock(text);
    parsed = ParseIntentResponse.parse(JSON.parse(json));
  } catch (err) {
    if (err instanceof CopilotOutputError) throw err;
    throw new CopilotOutputError(
      `parseIntent response did not validate: ${(err as Error).message}`,
      text
    );
  }

  const intentId = newNodeId("intent");
  const kernel: IntentKernel = {
    id: intentId,
    kind: "intent",
    purpose: parsed.kernel.purpose,
    stakeholders: parsed.kernel.stakeholders.map((s) => ({
      id: `stk_${nanoid(6)}`,
      label: s.label,
      kind: s.kind,
    })),
    outcomes: parsed.kernel.outcomes.map((o) => ({
      id: `out_${nanoid(6)}`,
      statement: o.statement,
      ...(o.metric ? { metric: o.metric } : {}),
    })),
    constraints: parsed.kernel.constraints.map((c) => ({
      id: `con_${nanoid(6)}`,
      statement: c.statement,
      kind: c.kind,
    })),
    sovereigntyZones: parsed.kernel.sovereigntyZones.map((z) => ({
      id: `sov_${nanoid(6)}`,
      name: z.name,
      description: z.description,
      nonDelegable: true,
    })),
    principles: parsed.kernel.principles.map((p) => ({
      id: `prn_${nanoid(6)}`,
      statement: p.statement,
    })),
    horizon: parsed.kernel.horizon,
    adaptabilityTarget: parsed.kernel.adaptabilityTarget,
  };

  return {
    passId: "parseIntent",
    patch: {
      id: nanoid(),
      source: "compiler",
      rationale: parsed.rationale,
      assumptions: parsed.assumptions,
      tradeoffs: parsed.tradeoffs,
      impactedMetrics: parsed.impactedMetrics,
      ops: [{ op: "add-node", node: kernel }],
    },
  };
};
