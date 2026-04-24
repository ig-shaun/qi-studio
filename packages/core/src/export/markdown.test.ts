import { describe, expect, it } from "vitest";
import { emptyGraph } from "../schema/index.js";
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

  it("appends a Migration Plan section when bundle.migrationPlan is set", () => {
    const bundle = emptyScenarioBundle();
    bundle.migrationPlan = {
      id: "mpl_1",
      generatedAt: "2026-05-01T10:00:00.000Z",
      sourceScenarioId: "scn_current_state",
      targetScenarioId: TARGET_SCENARIO_ID,
      sourceName: "Current State",
      targetName: "Target State",
      summary: "Three phases to stand up the target.",
      phases: [
        {
          id: "mph_1",
          name: "Stand up the pilot POD",
          rationale: "Start small so we can learn.",
          preconditions: [],
          keyChanges: ["Create Pilot POD"],
          newRoles: ["Pilot POD Lead"],
          retiredRoles: [],
          governanceShifts: [],
          risks: ["Cognitive load"],
        },
      ],
      risks: ["Capacity"],
      successMeasures: ["All delegations supervised"],
    };
    const md = renderWorkspaceMarkdown({ bundle });
    expect(md).toContain("## Migration Plan");
    expect(md).toContain("### Phase 1 — Stand up the pilot POD");
    expect(md).toContain("Three phases to stand up the target.");
    expect(md).toContain("- Create Pilot POD");
    expect(md).toContain("### Overall risks");
    expect(md).toContain("- Capacity");
    expect(md).toContain("### Success measures");
    expect(md).toContain("- All delegations supervised");
  });

  it("omits Migration Plan section when no plan is attached", () => {
    const bundle = emptyScenarioBundle();
    const md = renderWorkspaceMarkdown({ bundle });
    expect(md).not.toContain("## Migration Plan");
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
});
