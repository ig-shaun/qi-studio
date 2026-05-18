import { z } from "zod";
import { Graph, emptyGraph } from "../schema/index.js";
import { MigrationPlan } from "../migration/types.js";
import {
  Scenario,
  ScenarioBundle,
  TARGET_SCENARIO_ID,
} from "../store/scenario.js";

export const WORKSPACE_FILE_KIND = "qi-studio.workspace";
export const WORKSPACE_FILE_VERSION = 2;

// v1 file — kept so older exports still import cleanly.
export const WorkspaceFileV1 = z.object({
  kind: z.literal(WORKSPACE_FILE_KIND),
  version: z.literal(1),
  exportedAt: z.string(),
  workspaceName: z.string().optional(),
  prompt: z.string().optional(),
  graph: Graph,
});
export type WorkspaceFileV1 = z.infer<typeof WorkspaceFileV1>;

export const WorkspaceFileV2 = z.object({
  kind: z.literal(WORKSPACE_FILE_KIND),
  version: z.literal(2),
  exportedAt: z.string(),
  workspaceName: z.string().optional(),
  prompt: z.string().optional(),
  scenarios: z.array(Scenario),
  activeScenarioId: z.string(),
  migrationPlan: MigrationPlan.optional(),
});
export type WorkspaceFileV2 = z.infer<typeof WorkspaceFileV2>;

// Union of all supported file versions — the current export is always v2.
export type WorkspaceFile = WorkspaceFileV1 | WorkspaceFileV2;

export type SerializeWorkspaceArgs = {
  bundle: ScenarioBundle;
  workspaceName?: string;
  prompt?: string;
};

export const serializeWorkspace = ({
  bundle,
  workspaceName,
  prompt,
}: SerializeWorkspaceArgs): WorkspaceFileV2 => ({
  kind: WORKSPACE_FILE_KIND,
  version: 2,
  exportedAt: new Date().toISOString(),
  ...(workspaceName ? { workspaceName } : {}),
  ...(prompt ? { prompt } : {}),
  scenarios: bundle.scenarios,
  activeScenarioId: bundle.activeScenarioId,
  ...(bundle.migrationPlan ? { migrationPlan: bundle.migrationPlan } : {}),
});

export class WorkspaceImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceImportError";
  }
}

export type ParseWorkspaceResult = {
  bundle: ScenarioBundle;
  workspaceName?: string;
  prompt?: string;
  importedVersion: 1 | 2;
};

// Parse a workspace file. v2 is the canonical shape; v1 files are upgraded in
// memory into a bundle with one Target State scenario and an empty changelog.
export const parseWorkspace = (text: string): ParseWorkspaceResult => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new WorkspaceImportError(
      `File is not valid JSON: ${(err as Error).message}`
    );
  }

  const v2 = WorkspaceFileV2.safeParse(json);
  if (v2.success) {
    return {
      bundle: {
        scenarios: v2.data.scenarios,
        activeScenarioId: v2.data.activeScenarioId,
        ...(v2.data.migrationPlan ? { migrationPlan: v2.data.migrationPlan } : {}),
      },
      ...(v2.data.workspaceName ? { workspaceName: v2.data.workspaceName } : {}),
      ...(v2.data.prompt ? { prompt: v2.data.prompt } : {}),
      importedVersion: 2,
    };
  }

  const v1 = WorkspaceFileV1.safeParse(json);
  if (v1.success) {
    const now = new Date().toISOString();
    const targetScenario: Scenario = {
      id: TARGET_SCENARIO_ID,
      name: "Target State",
      slug: "target-state",
      kind: "target",
      order: 0,
      createdAt: now,
      updatedAt: now,
      graph: v1.data.graph,
      changelog: [],
    };
    return {
      bundle: {
        scenarios: [targetScenario],
        activeScenarioId: TARGET_SCENARIO_ID,
      },
      ...(v1.data.workspaceName ? { workspaceName: v1.data.workspaceName } : {}),
      ...(v1.data.prompt ? { prompt: v1.data.prompt } : {}),
      importedVersion: 1,
    };
  }

  // Neither version matched — surface the v2 issues since that's the target.
  throw new WorkspaceImportError(
    `File does not match Qi Studio workspace schema: ${v2.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")}`
  );
};

// Utility for tests: build an empty v2 file with a single Target State scenario.
export const emptyWorkspaceFile = (): WorkspaceFileV2 => {
  const now = new Date().toISOString();
  return {
    kind: WORKSPACE_FILE_KIND,
    version: 2,
    exportedAt: now,
    scenarios: [
      {
        id: TARGET_SCENARIO_ID,
        name: "Target State",
        slug: "target-state",
        kind: "target",
        order: 0,
        createdAt: now,
        updatedAt: now,
        graph: emptyGraph(),
        changelog: [],
      },
    ],
    activeScenarioId: TARGET_SCENARIO_ID,
  };
};
