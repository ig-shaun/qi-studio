import { describe, expect, it } from "vitest";
import type { GraphPatch } from "./patch.js";
import {
  DEFAULT_SCENARIOS,
  activeScenario,
  changelogEntryFromPatch,
  emptyScenarioBundle,
  summarizePatch,
} from "./scenario.js";

describe("DEFAULT_SCENARIOS", () => {
  it("has six ordered scenarios with stable slugs", () => {
    expect(DEFAULT_SCENARIOS.map((s) => s.slug)).toEqual([
      "current-state",
      "pilot-pod",
      "quarter-1",
      "quarter-2",
      "quarter-3",
      "target-state",
    ]);
    expect(DEFAULT_SCENARIOS.map((s) => s.order)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("emptyScenarioBundle", () => {
  it("defaults active to Target State", () => {
    const bundle = emptyScenarioBundle();
    expect(bundle.scenarios).toHaveLength(6);
    expect(activeScenario(bundle).slug).toBe("target-state");
  });
});

describe("summarizePatch", () => {
  it("humanises node-add ops by kind", () => {
    const patch: GraphPatch = {
      id: "p1",
      source: "compiler",
      ops: [
        {
          op: "add-node",
          node: {
            id: "pod_a",
            kind: "pod",
            name: "A",
            purpose: "",
            primaryLoopId: "loop_1",
            podType: "stream-aligned",
            accountabilities: [],
            humanRoleIds: [],
            agentRoleIds: [],
            localDecisions: [],
            escalatedDecisions: [],
            metrics: [],
            cognitiveLoadBudget: 6,
          },
        },
        {
          op: "add-node",
          node: {
            id: "pod_b",
            kind: "pod",
            name: "B",
            purpose: "",
            primaryLoopId: "loop_1",
            podType: "stream-aligned",
            accountabilities: [],
            humanRoleIds: [],
            agentRoleIds: [],
            localDecisions: [],
            escalatedDecisions: [],
            metrics: [],
            cognitiveLoadBudget: 6,
          },
        },
        {
          op: "add-node",
          node: {
            id: "role_a",
            kind: "role",
            name: "Role A",
            class: "human",
            purpose: "",
            capabilities: [],
            accountabilities: [],
            decisionRights: [],
            incumbentCount: 1,
          },
        },
      ],
    };
    expect(summarizePatch(patch).summary).toBe("added 2 PODs, 1 role");
  });

  it("reports no-op for empty ops arrays", () => {
    const patch: GraphPatch = { id: "p2", source: "user", ops: [] };
    expect(summarizePatch(patch).summary).toBe("no-op");
  });

  it("combines updates and removals", () => {
    const patch: GraphPatch = {
      id: "p3",
      source: "user",
      ops: [
        { op: "update-node", id: "role_a", patch: { name: "Renamed" } },
        { op: "remove-edge", id: "edge_1" },
      ],
    };
    expect(summarizePatch(patch).summary).toBe("updated 1 node · removed 1 edge");
  });
});

describe("changelogEntryFromPatch", () => {
  it("carries rationale + injects timestamp", () => {
    const patch: GraphPatch = {
      id: "p4",
      source: "copilot",
      rationale: "Re-parsed intent from prompt",
      ops: [],
    };
    const entry = changelogEntryFromPatch(patch);
    expect(entry.id).toBe("p4");
    expect(entry.source).toBe("copilot");
    expect(entry.rationale).toBe("Re-parsed intent from prompt");
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
