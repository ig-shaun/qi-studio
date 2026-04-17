import { z } from "zod";
import { nanoid } from "nanoid";
import { newNodeId } from "../../schema/ids.js";
import { AutonomyLevel } from "../../schema/primitives.js";
import type { DelegationContract } from "../../schema/index.js";
import type { Pass } from "./types.js";
import { PatchMetaSchema, runLlmPass } from "./helpers.js";
import { getPods, getRoles, summarizePod, summarizeRole } from "../context.js";
import { PLACE_AGENTS_PROMPT } from "../prompts/place-agents.js";

const ResponseSchema = PatchMetaSchema.extend({
  delegations: z
    .array(
      z.object({
        podId: z.string(),
        supervisingHumanRoleId: z.string(),
        delegatedAgentRoleId: z.string(),
        mandate: z.string().min(1),
        autonomyLevel: AutonomyLevel,
        allowedActions: z.array(z.string()).default([]),
        forbiddenActions: z.array(z.string()).default([]),
        spendBudget: z.number().nullable().optional(),
        toolAccess: z
          .array(
            z.object({
              tool: z.string(),
              scope: z.enum(["read", "write", "invoke"]),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

export const placeAgents: Pass = async (ctx) => {
  const pods = getPods(ctx.graph);
  const roles = getRoles(ctx.graph);
  if (pods.length === 0) throw new Error("placeAgents requires PODs");

  const roleById = new Map(roles.map((r) => [r.id, r]));
  const podById = new Map(pods.map((p) => [p.id, p]));

  const userPrompt = JSON.stringify(
    {
      pods: pods.map(summarizePod),
      roles: roles.map(summarizeRole),
    },
    null,
    2
  );

  const parsed = await runLlmPass(ResponseSchema, {
    userPrompt,
    passPrompt: PLACE_AGENTS_PROMPT,
    ...(ctx.signal ? { signal: ctx.signal } : {}),
  });

  const ops = parsed.delegations
    .filter((d) => {
      const pod = podById.get(d.podId);
      const supervisor = roleById.get(d.supervisingHumanRoleId);
      const agent = roleById.get(d.delegatedAgentRoleId);
      if (!pod || !supervisor || !agent) return false;
      if (supervisor.class !== "human" && supervisor.class !== "hybrid") return false;
      if (agent.class !== "agent" && agent.class !== "hybrid") return false;
      // Supervisor and agent must both be assigned to this POD.
      const supervisorInPod = pod.humanRoleIds.includes(supervisor.id);
      const agentInPod = pod.agentRoleIds.includes(agent.id);
      return supervisorInPod && agentInPod;
    })
    .map((d) => {
      const contract: DelegationContract = {
        id: newNodeId("deleg"),
        kind: "delegation",
        podId: d.podId,
        supervisingHumanRoleId: d.supervisingHumanRoleId,
        delegatedAgentRoleId: d.delegatedAgentRoleId,
        mandate: d.mandate,
        autonomyLevel: d.autonomyLevel,
        allowedActions: d.allowedActions,
        forbiddenActions: d.forbiddenActions,
        ...(d.spendBudget != null ? { spendBudget: d.spendBudget } : {}),
        toolAccess: d.toolAccess,
      };
      return { op: "add-node" as const, node: contract };
    });

  return {
    passId: "placeAgents",
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
