import { z } from "zod";
import { nanoid } from "nanoid";
import { newNodeId } from "../../schema/ids.js";
import { PodType } from "../../schema/primitives.js";
import type { PodProtocol } from "../../schema/index.js";
import type { Pass } from "./types.js";
import { PatchMetaSchema, runLlmPass } from "./helpers.js";
import { getIntent, getValueLoops, summarizeIntent, summarizeLoop } from "../context.js";
import { EMERGE_PODS_PROMPT } from "../prompts/emerge-pods.js";

const ResponseSchema = PatchMetaSchema.extend({
  pods: z
    .array(
      z.object({
        name: z.string().min(1),
        purpose: z.string(),
        primaryLoopId: z.string(),
        podType: PodType,
        accountabilities: z
          .array(
            z.object({
              statement: z.string(),
              complexityWeight: z.number().min(0.5).max(10),
            })
          )
          .default([]),
        localDecisions: z.array(z.string()).default([]),
        escalatedDecisions: z.array(z.string()).default([]),
        cognitiveLoadBudget: z.number().min(1).max(50).default(10),
      })
    )
    .min(1)
    .max(8),
});

export const emergePods: Pass = async (ctx) => {
  const intent = getIntent(ctx.graph);
  const loops = getValueLoops(ctx.graph);
  if (!intent) throw new Error("emergePods requires an Intent Kernel");
  if (loops.length === 0) {
    throw new Error("emergePods requires at least one value loop");
  }

  const knownLoopIds = new Set(loops.map((l) => l.id));
  const userPrompt = JSON.stringify(
    {
      intent: summarizeIntent(intent),
      loops: loops.map(summarizeLoop),
    },
    null,
    2
  );
  const parsed = await runLlmPass(ResponseSchema, {
    userPrompt,
    passPrompt: EMERGE_PODS_PROMPT,
    ...(ctx.signal ? { signal: ctx.signal } : {}),
  });

  const ops = parsed.pods
    .filter((p) => knownLoopIds.has(p.primaryLoopId))
    .map((p) => {
      const pod: PodProtocol = {
        id: newNodeId("pod"),
        kind: "pod",
        name: p.name,
        purpose: p.purpose,
        primaryLoopId: p.primaryLoopId,
        podType: p.podType,
        accountabilities: p.accountabilities.map((a) => ({
          id: `acc_${nanoid(6)}`,
          statement: a.statement,
          complexityWeight: a.complexityWeight,
        })),
        humanRoleIds: [],
        agentRoleIds: [],
        localDecisions: p.localDecisions,
        escalatedDecisions: p.escalatedDecisions,
        metrics: [],
        cognitiveLoadBudget: p.cognitiveLoadBudget,
      };
      return { op: "add-node" as const, node: pod };
    });

  return {
    passId: "emergePods",
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
