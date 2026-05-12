import { describe, expect, it } from "vitest";
import { emptyGraph, materializeDelegationPolicy } from "../schema/index.js";
import { emptyScenarioBundle, TARGET_SCENARIO_ID } from "../store/scenario.js";
import { renderWorkspaceMarkdown } from "./markdown.js";

describe("renderWorkspaceMarkdown", () => {
  it("renders a ToC and one section per scenario in order", () => {
    const bundle = emptyScenarioBundle();
    const md = renderWorkspaceMarkdown({ bundle, workspaceName: "Demo" });
    expect(md).toContain("# Demo");
    expect(md).toContain("## Scenarios");
    for (const s of bundle.scenarios) {
      expect(md).toContain(`## ${s.name}`);
      expect(md).toContain("### Changelog");
    }
    // Ordering: Current State must come before Target State in the output.
    expect(md.indexOf("## Current State")).toBeLessThan(
      md.indexOf("## Target State")
    );
  });

  it("includes each scenario's changelog entries", () => {
    const bundle = emptyScenarioBundle();
    const target = bundle.scenarios.find((s) => s.id === TARGET_SCENARIO_ID)!;
    target.changelog.push({
      id: "e1",
      timestamp: "2026-04-20T10:30:00.000Z",
      source: "user",
      summary: "added 1 POD",
      rationale: "Added a platform POD",
      opsCount: 1,
      opCounts: {
        addNode: 1,
        updateNode: 0,
        removeNode: 0,
        addEdge: 0,
        removeEdge: 0,
      },
    });
    const md = renderWorkspaceMarkdown({ bundle });
    expect(md).toContain("Added a platform POD");
    expect(md).toContain("_user_");
  });

  it("reports empty scenarios without crashing", () => {
    const bundle = {
      scenarios: [
        {
          id: "scn_solo",
          name: "Solo",
          slug: "solo",
          kind: "custom" as const,
          order: 0,
          createdAt: "2026-04-20T10:00:00.000Z",
          updatedAt: "2026-04-20T10:00:00.000Z",
          graph: emptyGraph(),
          changelog: [],
        },
      ],
      activeScenarioId: "scn_solo",
    };
    const md = renderWorkspaceMarkdown({ bundle });
    expect(md).toContain("## Solo");
    expect(md).toContain("_This scenario is empty._");
  });

  it("renders role archetype and delegation policy envelopes", () => {
    const bundle = emptyScenarioBundle();
    const target = bundle.scenarios.find((s) => s.id === TARGET_SCENARIO_ID)!;
    target.graph = {
      nodes: {
        role_agent: {
          id: "role_agent",
          kind: "role",
          name: "Sentinel Monitor",
          class: "agent",
          archetype: "sentinel",
          agentClass: "service",
          purpose: "Watch guardrails",
          capabilities: [],
          accountabilities: [],
          decisionRights: [],
          incumbentCount: 0,
        },
        deleg_1: {
          id: "deleg_1",
          kind: "delegation",
          podId: "pod_1",
          supervisingHumanRoleId: "role_human",
          delegatedAgentRoleId: "role_agent",
          mandate: "Pause unsafe flows",
          ...materializeDelegationPolicy("sentinel"),
          allowedActions: [],
          forbiddenActions: [],
          toolAccess: [],
        },
      },
      edges: {},
    };

    const md = renderWorkspaceMarkdown({ bundle });
    expect(md).toContain("- **Archetype:** Sentinel");
    expect(md).toContain("flow:pause");
    expect(md).toContain("Threshold breaches pause implicated flows");
    expect(md).toContain("**Evidence boundary**");
    expect(md).toContain("Noisy false positives");
  });
});
