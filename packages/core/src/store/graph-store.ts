import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { emptyGraph, type Graph } from "../schema/index.js";
import type { GraphPatch } from "./patch.js";

type GraphStore = {
  graph: Graph;
  decisionLog: GraphPatch[];
  applyPatch: (patch: GraphPatch) => void;
};

export const useGraphStore = create<GraphStore>()(
  immer((set) => ({
    graph: emptyGraph(),
    decisionLog: [],
    applyPatch: (patch) =>
      set((state) => {
        for (const op of patch.ops) {
          switch (op.op) {
            case "add-node":
              state.graph.nodes[op.node.id] = op.node;
              if (op.node.kind === "intent") state.graph.intentId = op.node.id;
              break;
            case "update-node": {
              const existing = state.graph.nodes[op.id];
              if (existing) {
                Object.assign(existing, op.patch);
              }
              break;
            }
            case "remove-node":
              delete state.graph.nodes[op.id];
              if (state.graph.intentId === op.id) state.graph.intentId = undefined;
              break;
            case "add-edge":
              state.graph.edges[op.edge.id] = op.edge;
              break;
            case "remove-edge":
              delete state.graph.edges[op.id];
              break;
          }
        }
        state.decisionLog.push(patch);
      }),
  }))
);
