import { z } from "zod";
import { nanoid } from "nanoid";
import { newNodeId } from "../../schema/ids.js";
import { Criticality } from "../../schema/primitives.js";
import type { ValueLoop } from "../../schema/index.js";
import type { Pass } from "./types.js";
import { PatchMetaSchema, runLlmPass } from "./helpers.js";
import { getIntent, summarizeIntent } from "../context.js";
import { SYNTHESIZE_VALUE_LOOPS_PROMPT } from "../prompts/synthesize-value-loops.js";

const ResponseSchema = PatchMetaSchema.extend({
  loops: z
    .array(
      z.object({
        name: z.string().min(1),
        purpose: z.string(),
        outcomeRefs: z.array(z.string()).min(1),
        triggerSignals: z.array(z.string()).default([]),
        outputs: z.array(z.string()).default([]),
        criticality: Criticality,
        requiredLatency: z.string().optional(),
      })
    )
    .min(1)
    .max(8),
});

export const synthesizeValueLoops: Pass = async (ctx) => {
  const intent = getIntent(ctx.graph);
  if (!intent) {
    throw new Error("synthesizeValueLoops requires an Intent Kernel");
  }

  const userPrompt = JSON.stringify({ intent: summarizeIntent(intent) }, null, 2);
  const parsed = await runLlmPass(ResponseSchema, {
    userPrompt,
    passPrompt: SYNTHESIZE_VALUE_LOOPS_PROMPT,
    ...(ctx.signal ? { signal: ctx.signal } : {}),
  });

  const ops = parsed.loops.map((l) => {
    const loop: ValueLoop = {
      id: newNodeId("loop"),
      kind: "valueLoop",
      name: l.name,
      purpose: l.purpose,
      intentId: intent.id,
      outcomeRefs: l.outcomeRefs,
      triggerSignals: l.triggerSignals,
      outputs: l.outputs,
      criticality: l.criticality,
      ...(l.requiredLatency ? { requiredLatency: l.requiredLatency } : {}),
    };
    return { op: "add-node" as const, node: loop };
  });

  return {
    passId: "synthesizeValueLoops",
    patch: {
      id: nanoid(),
      source: "compiler",
      rationale: parsed.rationale,
      assumptions: parsed.assumptions,
      tradeoffs: parsed.tradeoffs,
      impactedMetrics: parsed.impactedMetrics,
      ops,
    },
  };
};
