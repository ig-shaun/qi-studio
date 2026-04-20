import { nanoid } from "nanoid";
import { newEdgeId } from "../../schema/ids.js";
import type { InteractionEdge } from "../../schema/index.js";
import type { EdgePatch } from "../../store/patch.js";
import { getPods } from "../context.js";
import type { Pass } from "./types.js";

// Minimal rule-based inference: any two PODs that share a role through a
// delegation get a collaboration edge. Platform → stream-aligned PODs become
// x-as-a-service. No LLM call; v1 deliberately keeps flow inference explicit.
export const wireFlows: Pass = async ({ graph }) => {
  const pods = getPods(graph);
  const ops: EdgePatch[] = [];
  const seen = new Set<string>();

  const connect = (
    fromId: string,
    toId: string,
    mode: InteractionEdge["mode"]
  ) => {
    if (fromId === toId) return;
    const key = `${fromId}->${toId}:${mode}`;
    if (seen.has(key)) return;
    // Don't emit duplicates of existing edges either.
    for (const e of Object.values(graph.edges)) {
      if (
        e.kind === "interaction" &&
        e.from === fromId &&
        e.to === toId &&
        e.mode === mode
      )
        return;
    }
    seen.add(key);
    const edge: InteractionEdge = {
      id: newEdgeId(),
      kind: "interaction",
      from: fromId,
      to: toId,
      mode,
    };
    ops.push({ op: "add-edge", edge });
  };

  // Platform + enabling PODs publish to stream-aligned PODs.
  for (const producer of pods) {
    if (producer.podType !== "platform" && producer.podType !== "enabling")
      continue;
    for (const consumer of pods) {
      if (consumer.podType !== "stream-aligned") continue;
      const mode: InteractionEdge["mode"] =
        producer.podType === "enabling" ? "facilitation" : "x-as-a-service";
      connect(producer.id, consumer.id, mode);
    }
  }

  // Shared roles imply collaboration.
  for (let i = 0; i < pods.length; i++) {
    for (let j = i + 1; j < pods.length; j++) {
      const a = pods[i]!;
      const b = pods[j]!;
      const shared = [...a.humanRoleIds, ...a.agentRoleIds].some((id) =>
        b.humanRoleIds.includes(id) || b.agentRoleIds.includes(id)
      );
      if (shared) connect(a.id, b.id, "collaboration");
    }
  }

  return {
    passId: "wireFlows",
    patch: {
      id: nanoid(),
      source: "compiler",
      rationale:
        ops.length > 0
          ? `Inferred ${ops.length} interaction edge${ops.length === 1 ? "" : "s"} from Team Topologies rules and shared roles.`
          : "No implicit flows to wire.",
      ops,
    },
  };
};
