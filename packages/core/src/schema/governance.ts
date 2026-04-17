import { z } from "zod";
import { NodeId } from "./ids.js";
import { Reversibility } from "./primitives.js";

export const Checkpoint = z.object({
  id: NodeId,
  kind: z.literal("checkpoint"),
  name: z.string().min(1),
  actionScope: z.string(),
  reversibility: Reversibility,
  requiresHumanApproval: z.boolean(),
  approverRoleId: NodeId.optional(),
  auditRequired: z.boolean().default(true),
  escalationToRoleId: NodeId.optional(),
});
export type Checkpoint = z.infer<typeof Checkpoint>;

export const GovernancePolicy = z.object({
  id: NodeId,
  kind: z.literal("policy"),
  name: z.string(),
  statement: z.string(),
  appliesToNodeIds: z.array(NodeId).default([]),
  enforcement: z.enum(["advisory", "blocking"]).default("blocking"),
});
export type GovernancePolicy = z.infer<typeof GovernancePolicy>;
