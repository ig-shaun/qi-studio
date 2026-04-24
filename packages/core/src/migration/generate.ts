import { nanoid } from "nanoid";
import { z } from "zod";
import {
  CopilotOutputError,
  createCopilot,
  extractJsonBlock,
} from "../copilot/index.js";
import type { Graph } from "../schema/index.js";
import { summarizeGraphDiff } from "./diff.js";
import { MIGRATION_PLAN_PROMPT } from "./prompt.js";
import { MigrationPlan, MigrationPhase } from "./types.js";

const MigrationPlanResponse = z.object({
  summary: z.string().min(1),
  phases: z.array(
    z.object({
      name: z.string().min(1),
      rationale: z.string().min(1),
      preconditions: z.array(z.string()).default([]),
      keyChanges: z.array(z.string()).default([]),
      newRoles: z.array(z.string()).default([]),
      retiredRoles: z.array(z.string()).default([]),
      governanceShifts: z.array(z.string()).default([]),
      risks: z.array(z.string()).default([]),
    })
  ),
  risks: z.array(z.string()).default([]),
  successMeasures: z.array(z.string()).default([]),
});

export type GenerateMigrationPlanArgs = {
  sourceGraph: Graph;
  targetGraph: Graph;
  sourceScenarioId: string;
  targetScenarioId: string;
  sourceName: string;
  targetName: string;
  signal?: AbortSignal;
};

export const generateMigrationPlan = async (
  args: GenerateMigrationPlanArgs
): Promise<MigrationPlan> => {
  const diff = summarizeGraphDiff(args.sourceGraph, args.targetGraph);
  const userPrompt = buildUserPrompt({
    ...args,
    diffSummary: diff.summary,
    diffBullets: diff.bullets,
  });

  const copilot = createCopilot();
  const completeArgs = {
    userPrompt,
    passPrompt: MIGRATION_PLAN_PROMPT,
    maxTokens: 16384,
    ...(args.signal ? { signal: args.signal } : {}),
  };
  const { text } = await copilot.complete(completeArgs);

  let parsed: z.infer<typeof MigrationPlanResponse>;
  try {
    const json = extractJsonBlock(text);
    parsed = MigrationPlanResponse.parse(JSON.parse(json));
  } catch (err) {
    if (err instanceof CopilotOutputError) throw err;
    throw new CopilotOutputError(
      `generateMigrationPlan response did not validate: ${(err as Error).message}`,
      text
    );
  }

  const phases: MigrationPhase[] = parsed.phases.map((p) => ({
    id: `mph_${nanoid(6)}`,
    name: p.name,
    rationale: p.rationale,
    preconditions: p.preconditions,
    keyChanges: p.keyChanges,
    newRoles: p.newRoles,
    retiredRoles: p.retiredRoles,
    governanceShifts: p.governanceShifts,
    risks: p.risks,
  }));

  const plan: MigrationPlan = MigrationPlan.parse({
    id: `mpl_${nanoid(8)}`,
    generatedAt: new Date().toISOString(),
    sourceScenarioId: args.sourceScenarioId,
    targetScenarioId: args.targetScenarioId,
    sourceName: args.sourceName,
    targetName: args.targetName,
    summary: parsed.summary,
    phases,
    risks: parsed.risks,
    successMeasures: parsed.successMeasures,
  });
  return plan;
};

const buildUserPrompt = ({
  sourceGraph,
  targetGraph,
  sourceName,
  targetName,
  diffSummary,
  diffBullets,
}: GenerateMigrationPlanArgs & {
  diffSummary: string;
  diffBullets: string[];
}): string => {
  const bullets = diffBullets.length
    ? diffBullets.map((b) => `- ${b}`).join("\n")
    : "- (no node-level differences)";
  return [
    `SOURCE SCENARIO: ${sourceName}`,
    `TARGET SCENARIO: ${targetName}`,
    "",
    "## Delta summary",
    diffSummary,
    "",
    "## Delta bullets",
    bullets,
    "",
    "## Full SOURCE graph (JSON)",
    JSON.stringify(sourceGraph),
    "",
    "## Full TARGET graph (JSON)",
    JSON.stringify(targetGraph),
  ].join("\n");
};
