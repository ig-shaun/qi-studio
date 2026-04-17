import { z } from "zod";
import { EdgeId, NodeId } from "./ids.js";
import { IntentKernel } from "./intent.js";
import { ValueLoop } from "./value-loop.js";
import { PodProtocol } from "./pod.js";
import { RoleTemplate } from "./role.js";
import { DelegationContract } from "./delegation.js";
import { Checkpoint, GovernancePolicy } from "./governance.js";
import { Edge } from "./edge.js";

export const Node = z.discriminatedUnion("kind", [
  IntentKernel,
  ValueLoop,
  PodProtocol,
  RoleTemplate,
  DelegationContract,
  Checkpoint,
  GovernancePolicy,
]);
export type Node = z.infer<typeof Node>;

export const Graph = z.object({
  intentId: NodeId.optional(),
  nodes: z.record(NodeId, Node),
  edges: z.record(EdgeId, Edge),
});
export type Graph = z.infer<typeof Graph>;

export const emptyGraph = (): Graph => ({ nodes: {}, edges: {} });
