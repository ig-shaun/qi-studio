import { describe, expect, it } from "vitest";
import { emptyGraph, type Graph } from "../schema/index.js";
import { summarizeGraphDiff } from "./diff.js";
import { MigrationPlan } from "./types.js";

const pod = (id: string, name: string) => ({
  id,
  kind: "pod" as const,
  name,
  purpose: "",
  primaryLoopId: "loop_1",
  podType: "stream-aligned" as const,
  accountabilities: [],
  humanRoleIds: [],
  agentRoleIds: [],
  localDecisions: [],
  escalatedDecisions: [],
  metrics: [],
  cognitiveLoadBudget: 6,
});

const role = (id: string, name: string) => ({
  id,
  kind: "role" as const,
  name,
  class: "human" as const,
  purpose: "do things",
  capabilities: [],
  accountabilities: [],
  decisionRights: [],
  incumbentCount: 0,
});

const graphWith = (nodes: Graph["nodes"]): Graph => ({ nodes, edges: {} });

describe("summarizeGraphDiff", () => {
  it("reports identical graphs as a no-op", () => {
    const diff = summarizeGraphDiff(emptyGraph(), emptyGraph());
    expect(diff.bullets).toEqual([]);
    expect(diff.summary).toContain("identical node sets");
  });

  it("lists added and retired nodes grouped by kind", () => {
    const source = graphWith({ pod_a: pod("pod_a", "A"), role_x: role("role_x", "X") });
    const target = graphWith({ pod_a: pod("pod_a", "A"), pod_b: pod("pod_b", "B") });
    const diff = summarizeGraphDiff(source, target);
    expect(diff.bullets.some((b) => b.includes("added 1 PODs"))).toBe(true);
    expect(diff.bullets.some((b) => b.includes('"B"'))).toBe(true);
    expect(diff.bullets.some((b) => b.includes("retired 1 roles"))).toBe(true);
    expect(diff.bullets.some((b) => b.includes('"X"'))).toBe(true);
  });

  it("reports edge count deltas", () => {
    const source: Graph = { nodes: {}, edges: {} };
    const target: Graph = {
      nodes: {},
      edges: {
        e1: {
          id: "e1",
          kind: "interaction",
          mode: "collaboration",
          from: "pod_a",
          to: "pod_b",
        },
      },
    };
    const diff = summarizeGraphDiff(source, target);
    expect(diff.bullets.some((b) => b.includes("interaction edges: 0 → 1"))).toBe(true);
  });
});

describe("MigrationPlan schema", () => {
  it("round-trips through JSON with defaults filled in", () => {
    const plan = MigrationPlan.parse({
      id: "mpl_test",
      generatedAt: "2026-05-01T00:00:00.000Z",
      sourceScenarioId: "scn_current_state",
      targetScenarioId: "scn_target_state",
      sourceName: "Current State",
      targetName: "Target State",
      summary: "Stand up the target state in three phases.",
      phases: [
        {
          id: "mph_a",
          name: "Phase 1",
          rationale: "Start small.",
        },
      ],
    });
    expect(plan.phases[0]!.keyChanges).toEqual([]);
    expect(plan.risks).toEqual([]);
    expect(plan.successMeasures).toEqual([]);
  });
});
