import { z } from "zod";
import { Graph, emptyGraph } from "../schema/graph.js";
import type { GraphPatch, GraphPatchSource } from "./patch.js";

export const ScenarioKind = z.enum([
  "current",
  "pilot",
  "quarter",
  "target",
  "custom",
]);
export type ScenarioKind = z.infer<typeof ScenarioKind>;

const GraphPatchSourceSchema: z.ZodType<GraphPatchSource> = z.enum([
  "user",
  "copilot",
  "compiler",
]);

export const ChangelogEntry = z.object({
  id: z.string(),
  timestamp: z.string(),
  source: GraphPatchSourceSchema,
  rationale: z.string().optional(),
  summary: z.string(),
  opsCount: z.number().int().nonnegative(),
  opCounts: z.object({
    addNode: z.number().int().nonnegative(),
    updateNode: z.number().int().nonnegative(),
    removeNode: z.number().int().nonnegative(),
    addEdge: z.number().int().nonnegative(),
    removeEdge: z.number().int().nonnegative(),
  }),
});
export type ChangelogEntry = z.infer<typeof ChangelogEntry>;

export const Scenario = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  kind: ScenarioKind,
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  graph: Graph,
  changelog: z.array(ChangelogEntry),
});
export type Scenario = z.infer<typeof Scenario>;

export const ScenarioBundle = z.object({
  scenarios: z.array(Scenario),
  activeScenarioId: z.string(),
});
export type ScenarioBundle = z.infer<typeof ScenarioBundle>;

export type DefaultScenarioSeed = {
  id: string;
  slug: string;
  name: string;
  kind: ScenarioKind;
  order: number;
};

// Stable IDs + slugs keep export filenames and persistence keys stable across
// sessions, even if the user renames a default scenario.
export const DEFAULT_SCENARIOS: readonly DefaultScenarioSeed[] = [
  {
    id: "scn_current_state",
    slug: "current-state",
    name: "Current State",
    kind: "current",
    order: 0,
  },
  {
    id: "scn_pilot_pod",
    slug: "pilot-pod",
    name: "Pilot POD",
    kind: "pilot",
    order: 1,
  },
  {
    id: "scn_quarter_1",
    slug: "quarter-1",
    name: "Quarter 1",
    kind: "quarter",
    order: 2,
  },
  {
    id: "scn_quarter_2",
    slug: "quarter-2",
    name: "Quarter 2",
    kind: "quarter",
    order: 3,
  },
  {
    id: "scn_quarter_3",
    slug: "quarter-3",
    name: "Quarter 3",
    kind: "quarter",
    order: 4,
  },
  {
    id: "scn_target_state",
    slug: "target-state",
    name: "Target State",
    kind: "target",
    order: 5,
  },
] as const;

export const TARGET_SCENARIO_ID = "scn_target_state";

export const emptyScenario = (seed: DefaultScenarioSeed): Scenario => {
  const now = new Date().toISOString();
  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    kind: seed.kind,
    order: seed.order,
    createdAt: now,
    updatedAt: now,
    graph: emptyGraph(),
    changelog: [],
  };
};

export const emptyScenarioBundle = (): ScenarioBundle => ({
  scenarios: DEFAULT_SCENARIOS.map(emptyScenario),
  activeScenarioId: TARGET_SCENARIO_ID,
});

export const activeScenario = (bundle: ScenarioBundle): Scenario => {
  const found = bundle.scenarios.find((s) => s.id === bundle.activeScenarioId);
  if (found) return found;
  // Shouldn't happen; fall back to the first scenario so the UI never crashes.
  return bundle.scenarios[0]!;
};

export const findScenario = (
  bundle: ScenarioBundle,
  id: string
): Scenario | undefined => bundle.scenarios.find((s) => s.id === id);

export type PatchSummary = {
  summary: string;
  opsCount: number;
  opCounts: ChangelogEntry["opCounts"];
};

export const summarizePatch = (patch: GraphPatch): PatchSummary => {
  const opCounts = {
    addNode: 0,
    updateNode: 0,
    removeNode: 0,
    addEdge: 0,
    removeEdge: 0,
  };
  const nodeKindAdds: Record<string, number> = {};
  const nodeKindRemoves: Record<string, number> = {};
  const nodeKindUpdates: Record<string, number> = {};

  for (const op of patch.ops) {
    switch (op.op) {
      case "add-node":
        opCounts.addNode += 1;
        nodeKindAdds[op.node.kind] = (nodeKindAdds[op.node.kind] ?? 0) + 1;
        break;
      case "update-node":
        opCounts.updateNode += 1;
        // We don't know the kind from the op alone; leave anonymous.
        nodeKindUpdates["node"] = (nodeKindUpdates["node"] ?? 0) + 1;
        break;
      case "remove-node":
        opCounts.removeNode += 1;
        nodeKindRemoves["node"] = (nodeKindRemoves["node"] ?? 0) + 1;
        break;
      case "add-edge":
        opCounts.addEdge += 1;
        break;
      case "remove-edge":
        opCounts.removeEdge += 1;
        break;
    }
  }

  const parts: string[] = [];
  if (opCounts.addNode) {
    const breakdown = Object.entries(nodeKindAdds)
      .map(([kind, n]) => `${n} ${pluralKind(kind, n)}`)
      .join(", ");
    parts.push(`added ${breakdown}`);
  }
  if (opCounts.updateNode) {
    parts.push(
      `updated ${opCounts.updateNode} node${opCounts.updateNode === 1 ? "" : "s"}`
    );
  }
  if (opCounts.removeNode) {
    parts.push(
      `removed ${opCounts.removeNode} node${opCounts.removeNode === 1 ? "" : "s"}`
    );
  }
  if (opCounts.addEdge) {
    parts.push(
      `added ${opCounts.addEdge} edge${opCounts.addEdge === 1 ? "" : "s"}`
    );
  }
  if (opCounts.removeEdge) {
    parts.push(
      `removed ${opCounts.removeEdge} edge${opCounts.removeEdge === 1 ? "" : "s"}`
    );
  }

  const opsCount = patch.ops.length;
  const summary = parts.length ? parts.join(" · ") : "no-op";
  return { summary, opsCount, opCounts };
};

const KIND_LABEL_SINGULAR: Record<string, string> = {
  intent: "intent kernel",
  valueLoop: "value loop",
  pod: "POD",
  role: "role",
  delegation: "delegation",
  checkpoint: "checkpoint",
  policy: "policy",
};
const KIND_LABEL_PLURAL: Record<string, string> = {
  intent: "intent kernels",
  valueLoop: "value loops",
  pod: "PODs",
  role: "roles",
  delegation: "delegations",
  checkpoint: "checkpoints",
  policy: "policies",
};

const pluralKind = (kind: string, n: number): string => {
  if (n === 1) return KIND_LABEL_SINGULAR[kind] ?? kind;
  return KIND_LABEL_PLURAL[kind] ?? `${kind}s`;
};

export const changelogEntryFromPatch = (patch: GraphPatch): ChangelogEntry => {
  const { summary, opsCount, opCounts } = summarizePatch(patch);
  return {
    id: patch.id,
    timestamp: patch.timestamp ?? new Date().toISOString(),
    source: patch.source,
    ...(patch.rationale ? { rationale: patch.rationale } : {}),
    summary,
    opsCount,
    opCounts,
  };
};
