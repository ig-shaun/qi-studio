import { z } from "zod";
import { nanoid } from "nanoid";
import { newNodeId, type NodeId } from "../../schema/ids.js";
import { Reversibility } from "../../schema/primitives.js";
import type { Checkpoint, GovernancePolicy } from "../../schema/index.js";
import type { NodePatch } from "../../store/patch.js";
import type { Pass } from "./types.js";
import { PatchMetaSchema, runLlmPass } from "./helpers.js";
import { getDelegations, getIntent, getRoles, summarizeDelegation, summarizeIntent, summarizeRole } from "../context.js";
import { SYNTHESIZE_GOVERNANCE_PROMPT } from "../prompts/synthesize-governance.js";

const ResponseSchema = PatchMetaSchema.extend({
  checkpoints: z
    .array(
      z.object({
        tempId: z.string().min(1),
        name: z.string().min(1),
        actionScope: z.string(),
        reversibility: Reversibility,
        requiresHumanApproval: z.boolean(),
        approverRoleId: z.string().nullable(),
        auditRequired: z.boolean().default(true),
      })
    )
    .default([]),
  delegationCheckpoints: z
    .array(
      z.object({
        delegationId: z.string(),
        checkpointTempId: z.string(),
      })
    )
    .default([]),
  policies: z
    .array(
      z.object({
        name: z.string(),
        statement: z.string(),
        appliesToNodeIds: z.array(z.string()).default([]),
        enforcement: z.enum(["advisory", "blocking"]).default("blocking"),
      })
    )
    .default([]),
});

export const synthesizeGovernance: Pass = async (ctx) => {
  const intent = getIntent(ctx.graph);
  const delegations = getDelegations(ctx.graph);
  const roles = getRoles(ctx.graph);
  if (!intent) throw new Error("synthesizeGovernance requires an Intent Kernel");

  const roleById = new Map(roles.map((r) => [r.id, r]));
  const delegById = new Map(delegations.map((d) => [d.id, d]));

  const userPrompt = JSON.stringify(
    {
      intent: summarizeIntent(intent),
      delegations: delegations.map(summarizeDelegation),
      roles: roles.map(summarizeRole),
    },
    null,
    2
  );

  const parsed = await runLlmPass(ResponseSchema, {
    userPrompt,
    passPrompt: SYNTHESIZE_GOVERNANCE_PROMPT,
    ...(ctx.signal ? { signal: ctx.signal } : {}),
  });

  const tempIdToNodeId = new Map<string, NodeId>();
  const ops: NodePatch[] = [];

  for (const c of parsed.checkpoints) {
    // Validate approver role is human when approval is required.
    let approverRoleId: NodeId | undefined;
    if (c.approverRoleId) {
      const approver = roleById.get(c.approverRoleId);
      if (approver && (approver.class === "human" || approver.class === "hybrid")) {
        approverRoleId = approver.id;
      }
    }
    if (c.requiresHumanApproval && !approverRoleId) continue;

    const id = newNodeId("cp");
    tempIdToNodeId.set(c.tempId, id);
    const checkpoint: Checkpoint = {
      id,
      kind: "checkpoint",
      name: c.name,
      actionScope: c.actionScope,
      reversibility: c.reversibility,
      requiresHumanApproval: c.requiresHumanApproval,
      ...(approverRoleId ? { approverRoleId } : {}),
      auditRequired: c.auditRequired,
    };
    ops.push({ op: "add-node", node: checkpoint });
  }

  for (const link of parsed.delegationCheckpoints) {
    if (!delegById.has(link.delegationId)) continue;
    const cpId = tempIdToNodeId.get(link.checkpointTempId);
    if (!cpId) continue;
    ops.push({
      op: "update-node",
      id: link.delegationId,
      patch: { checkpointPolicyId: cpId } as never,
    });
  }

  for (const p of parsed.policies) {
    const policy: GovernancePolicy = {
      id: newNodeId("pol"),
      kind: "policy",
      name: p.name,
      statement: p.statement,
      appliesToNodeIds: p.appliesToNodeIds,
      enforcement: p.enforcement,
    };
    ops.push({ op: "add-node", node: policy });
  }

  return {
    passId: "synthesizeGovernance",
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
