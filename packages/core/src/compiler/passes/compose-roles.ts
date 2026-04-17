import { z } from "zod";
import { nanoid } from "nanoid";
import { newNodeId, type NodeId } from "../../schema/ids.js";
import { AgentClass, RoleClass } from "../../schema/primitives.js";
import type { RoleTemplate } from "../../schema/index.js";
import type { Pass } from "./types.js";
import type { NodePatch } from "../../store/patch.js";
import { PatchMetaSchema, runLlmPass } from "./helpers.js";
import { getIntent, getPods, summarizeIntent, summarizePod } from "../context.js";
import { COMPOSE_ROLES_PROMPT } from "../prompts/compose-roles.js";

const ResponseSchema = PatchMetaSchema.extend({
  roles: z
    .array(
      z.object({
        tempId: z.string().min(1),
        name: z.string().min(1),
        class: RoleClass,
        agentClass: AgentClass.nullable(),
        purpose: z.string(),
        accountabilities: z.array(z.string()).default([]),
        decisionRights: z.array(z.string()).default([]),
      })
    )
    .min(1),
  assignments: z
    .array(
      z.object({
        podId: z.string(),
        humanRoleTempIds: z.array(z.string()),
        agentRoleTempIds: z.array(z.string()).default([]),
      })
    )
    .min(1),
});

export const composeRoles: Pass = async (ctx) => {
  const intent = getIntent(ctx.graph);
  const pods = getPods(ctx.graph);
  if (!intent) throw new Error("composeRoles requires an Intent Kernel");
  if (pods.length === 0) throw new Error("composeRoles requires at least one POD");

  const knownPodIds = new Set(pods.map((p) => p.id));
  const userPrompt = JSON.stringify(
    {
      intent: summarizeIntent(intent),
      pods: pods.map(summarizePod),
    },
    null,
    2
  );

  const parsed = await runLlmPass(ResponseSchema, {
    userPrompt,
    passPrompt: COMPOSE_ROLES_PROMPT,
    ...(ctx.signal ? { signal: ctx.signal } : {}),
  });

  // Cross-field validation the Zod schema can't express on its own.
  const validRoles = parsed.roles.filter((r) => {
    if (r.class === "human") return r.agentClass === null;
    if (r.class === "agent") return r.agentClass !== null;
    return true; // hybrid allows either
  });

  const tempIdToNodeId = new Map<string, NodeId>();
  const ops: NodePatch[] = [];

  for (const r of validRoles) {
    const id = newNodeId("role");
    tempIdToNodeId.set(r.tempId, id);
    const role: RoleTemplate = {
      id,
      kind: "role",
      name: r.name,
      class: r.class,
      ...(r.agentClass ? { agentClass: r.agentClass } : {}),
      purpose: r.purpose,
      capabilities: [],
      accountabilities: r.accountabilities,
      decisionRights: r.decisionRights,
      incumbentCount: 0,
    };
    ops.push({ op: "add-node", node: role });
  }

  for (const a of parsed.assignments) {
    if (!knownPodIds.has(a.podId)) continue;
    const humanIds = a.humanRoleTempIds
      .map((t) => tempIdToNodeId.get(t))
      .filter((x): x is NodeId => !!x);
    const agentIds = a.agentRoleTempIds
      .map((t) => tempIdToNodeId.get(t))
      .filter((x): x is NodeId => !!x);
    if (humanIds.length === 0) continue; // invariant requires a human role per POD
    ops.push({
      op: "update-node",
      id: a.podId,
      patch: { humanRoleIds: humanIds, agentRoleIds: agentIds } as never,
    });
  }

  return {
    passId: "composeRoles",
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
