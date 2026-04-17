import { z } from "zod";
import { NodeId } from "./ids.js";
import { PodType } from "./primitives.js";

export const Accountability = z.object({
  id: z.string(),
  statement: z.string(),
  complexityWeight: z.number().min(0).max(10).default(1),
});
export type Accountability = z.infer<typeof Accountability>;

export const PodProtocol = z.object({
  id: NodeId,
  kind: z.literal("pod"),
  name: z.string().min(1),
  purpose: z.string(),
  primaryLoopId: NodeId,
  podType: PodType,
  accountabilities: z.array(Accountability).default([]),
  humanRoleIds: z.array(NodeId).default([]),
  agentRoleIds: z.array(NodeId).default([]),
  localDecisions: z.array(z.string()).default([]),
  escalatedDecisions: z.array(z.string()).default([]),
  metrics: z.array(z.string()).default([]),
  cognitiveLoadBudget: z.number().min(1).max(100).default(10),
});
export type PodProtocol = z.infer<typeof PodProtocol>;
