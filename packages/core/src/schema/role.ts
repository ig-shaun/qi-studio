import { z } from "zod";
import { NodeId } from "./ids.js";
import { AgentClass, RoleClass } from "./primitives.js";

export const Capability = z.object({
  id: z.string(),
  name: z.string(),
});
export type Capability = z.infer<typeof Capability>;

export const RoleTemplate = z.object({
  id: NodeId,
  kind: z.literal("role"),
  name: z.string().min(1),
  class: RoleClass,
  agentClass: AgentClass.optional(),
  purpose: z.string(),
  capabilities: z.array(Capability).default([]),
  accountabilities: z.array(z.string()).default([]),
  decisionRights: z.array(z.string()).default([]),
  escalationToRoleId: NodeId.optional(),
  incumbentCount: z.number().int().nonnegative().default(0),
});
export type RoleTemplate = z.infer<typeof RoleTemplate>;
