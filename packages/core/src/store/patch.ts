import type { Edge, Node } from "../schema/index.js";
import type { EdgeId, NodeId } from "../schema/ids.js";

export type NodePatch =
  | { op: "add-node"; node: Node }
  | { op: "update-node"; id: NodeId; patch: Partial<Node> }
  | { op: "remove-node"; id: NodeId };

export type EdgePatch =
  | { op: "add-edge"; edge: Edge }
  | { op: "remove-edge"; id: EdgeId };

export type GraphPatchSource = "user" | "copilot" | "compiler";

export type GraphPatch = {
  id: string;
  timestamp?: string;
  source: GraphPatchSource;
  rationale?: string;
  assumptions?: string[];
  tradeoffs?: string[];
  impactedMetrics?: string[];
  ops: Array<NodePatch | EdgePatch>;
};

export type MakePatchArgs = Omit<GraphPatch, "id" | "timestamp"> & {
  id?: string;
  timestamp?: string;
};

const randomId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const makePatch = (args: MakePatchArgs): GraphPatch => ({
  id: args.id ?? randomId(),
  timestamp: args.timestamp ?? new Date().toISOString(),
  source: args.source,
  ...(args.rationale ? { rationale: args.rationale } : {}),
  ...(args.assumptions ? { assumptions: args.assumptions } : {}),
  ...(args.tradeoffs ? { tradeoffs: args.tradeoffs } : {}),
  ...(args.impactedMetrics ? { impactedMetrics: args.impactedMetrics } : {}),
  ops: args.ops,
});
