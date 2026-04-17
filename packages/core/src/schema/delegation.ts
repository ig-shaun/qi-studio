import { z } from "zod";
import { NodeId } from "./ids.js";
import { AutonomyLevel } from "./primitives.js";

export const ToolPermission = z.object({
  tool: z.string(),
  scope: z.enum(["read", "write", "invoke"]),
});
export type ToolPermission = z.infer<typeof ToolPermission>;

export const DelegationContract = z.object({
  id: NodeId,
  kind: z.literal("delegation"),
  podId: NodeId,
  supervisingHumanRoleId: NodeId,
  delegatedAgentRoleId: NodeId,
  mandate: z.string().min(1),
  autonomyLevel: AutonomyLevel,
  allowedActions: z.array(z.string()).default([]),
  forbiddenActions: z.array(z.string()).default([]),
  spendBudget: z.number().nonnegative().optional(),
  toolAccess: z.array(ToolPermission).default([]),
  checkpointPolicyId: NodeId.optional(),
  observabilityPolicyId: NodeId.optional(),
  rollbackPolicyId: NodeId.optional(),
});
export type DelegationContract = z.infer<typeof DelegationContract>;
