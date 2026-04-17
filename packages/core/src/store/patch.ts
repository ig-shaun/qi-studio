import type { Edge, Node } from "../schema/index.js";
import type { EdgeId, NodeId } from "../schema/ids.js";

export type NodePatch =
  | { op: "add-node"; node: Node }
  | { op: "update-node"; id: NodeId; patch: Partial<Node> }
  | { op: "remove-node"; id: NodeId };

export type EdgePatch =
  | { op: "add-edge"; edge: Edge }
  | { op: "remove-edge"; id: EdgeId };

export type GraphPatch = {
  id: string;
  source: "user" | "copilot" | "compiler";
  rationale?: string;
  assumptions?: string[];
  tradeoffs?: string[];
  impactedMetrics?: string[];
  ops: Array<NodePatch | EdgePatch>;
};
