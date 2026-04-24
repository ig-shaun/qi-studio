import { describe, expect, it } from "vitest";
import { emptyGraph } from "../schema/index.js";
import {
  DEFAULT_SCENARIOS,
  emptyScenarioBundle,
  TARGET_SCENARIO_ID,
  type ScenarioBundle,
} from "../store/scenario.js";
import {
  parseWorkspace,
  serializeWorkspace,
  WorkspaceImportError,
  WORKSPACE_FILE_KIND,
} from "./workspace.js";

describe("serializeWorkspace", () => {
  it("emits a v2 file with all scenarios", () => {
    const bundle = emptyScenarioBundle();
    const file = serializeWorkspace({ bundle, workspaceName: "Demo" });
    expect(file.kind).toBe(WORKSPACE_FILE_KIND);
    expect(file.version).toBe(2);
    expect(file.scenarios).toHaveLength(DEFAULT_SCENARIOS.length);
    expect(file.activeScenarioId).toBe(TARGET_SCENARIO_ID);
    expect(file.workspaceName).toBe("Demo");
  });
});

describe("parseWorkspace", () => {
  it("round-trips a v2 bundle unchanged", () => {
    const bundle = emptyScenarioBundle();
    const serialized = JSON.stringify(
      serializeWorkspace({ bundle, workspaceName: "Demo" })
    );
    const parsed = parseWorkspace(serialized);
    expect(parsed.importedVersion).toBe(2);
    expect(parsed.bundle.scenarios).toHaveLength(DEFAULT_SCENARIOS.length);
    expect(parsed.bundle.activeScenarioId).toBe(TARGET_SCENARIO_ID);
    expect(parsed.workspaceName).toBe("Demo");
  });

  it("upgrades a v1 file into a synthetic bundle", () => {
    const v1 = {
      kind: WORKSPACE_FILE_KIND,
      version: 1,
      exportedAt: "2026-04-20T00:00:00.000Z",
      workspaceName: "Legacy export",
      graph: emptyGraph(),
    };
    const parsed = parseWorkspace(JSON.stringify(v1));
    expect(parsed.importedVersion).toBe(1);
    expect(parsed.bundle.scenarios).toHaveLength(1);
    expect(parsed.bundle.scenarios[0]!.id).toBe(TARGET_SCENARIO_ID);
    expect(parsed.bundle.scenarios[0]!.changelog).toEqual([]);
    expect(parsed.workspaceName).toBe("Legacy export");
  });

  it("rejects files that match neither v1 nor v2", () => {
    expect(() => parseWorkspace(JSON.stringify({ kind: "something-else" }))).toThrow(
      WorkspaceImportError
    );
  });

  it("rejects non-JSON text", () => {
    expect(() => parseWorkspace("not json")).toThrow(WorkspaceImportError);
  });
});

describe("bundle preservation", () => {
  it("keeps custom scenario kind through round-trip", () => {
    const bundle: ScenarioBundle = emptyScenarioBundle();
    bundle.scenarios.push({
      id: "scn_custom1",
      name: "My scenario",
      slug: "my-scenario",
      kind: "custom",
      order: 99,
      createdAt: "2026-04-20T12:00:00.000Z",
      updatedAt: "2026-04-20T12:00:00.000Z",
      graph: emptyGraph(),
      changelog: [],
    });
    const text = JSON.stringify(serializeWorkspace({ bundle }));
    const parsed = parseWorkspace(text);
    const custom = parsed.bundle.scenarios.find((s) => s.id === "scn_custom1");
    expect(custom?.kind).toBe("custom");
    expect(custom?.order).toBe(99);
  });

  it("round-trips a migration plan attached to the bundle", () => {
    const bundle: ScenarioBundle = emptyScenarioBundle();
    bundle.migrationPlan = {
      id: "mpl_1",
      generatedAt: "2026-05-01T00:00:00.000Z",
      sourceScenarioId: "scn_current_state",
      targetScenarioId: TARGET_SCENARIO_ID,
      sourceName: "Current State",
      targetName: "Target State",
      summary: "Three phases to stand up the target.",
      phases: [
        {
          id: "mph_1",
          name: "Phase 1",
          rationale: "Start small.",
          preconditions: [],
          keyChanges: ["Stand up Pilot POD"],
          newRoles: [],
          retiredRoles: [],
          governanceShifts: [],
          risks: [],
        },
      ],
      risks: ["Watch for cognitive load overflow"],
      successMeasures: ["All delegations have a named human"],
    };
    const text = JSON.stringify(serializeWorkspace({ bundle }));
    const parsed = parseWorkspace(text);
    expect(parsed.bundle.migrationPlan?.id).toBe("mpl_1");
    expect(parsed.bundle.migrationPlan?.phases[0]?.keyChanges).toEqual([
      "Stand up Pilot POD",
    ]);
    expect(parsed.bundle.migrationPlan?.risks).toEqual([
      "Watch for cognitive load overflow",
    ]);
  });
});
