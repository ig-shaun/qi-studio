import { produce } from "immer";
import type { Graph } from "../schema/index.js";
import type { GraphPatch } from "../store/patch.js";

// Pure equivalent of GraphStore.applyPatch, used inside the compiler where we
// want to thread the graph through passes without touching global state.
export const applyPatchTo = (graph: Graph, patch: GraphPatch): Graph =>
  produce(graph, (draft) => {
    for (const op of patch.ops) {
      switch (op.op) {
        case "add-node":
          draft.nodes[op.node.id] = op.node;
          if (op.node.kind === "intent") draft.intentId = op.node.id;
          break;
        case "update-node": {
          const existing = draft.nodes[op.id];
          if (existing) Object.assign(existing, op.patch);
          break;
        }
        case "remove-node":
          delete draft.nodes[op.id];
          if (draft.intentId === op.id) draft.intentId = undefined;
          break;
        case "add-edge":
          draft.edges[op.edge.id] = op.edge;
          break;
        case "remove-edge":
          delete draft.edges[op.id];
          break;
      }
    }
  });
