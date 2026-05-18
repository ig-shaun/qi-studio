import { z } from "zod";

export const MigrationPhase = z.object({
  id: z.string(),
  name: z.string().min(1),
  rationale: z.string().min(1),
  preconditions: z.array(z.string()).default([]),
  keyChanges: z.array(z.string()).default([]),
  newRoles: z.array(z.string()).default([]),
  retiredRoles: z.array(z.string()).default([]),
  governanceShifts: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});
export type MigrationPhase = z.infer<typeof MigrationPhase>;

export const MigrationPlan = z.object({
  id: z.string(),
  generatedAt: z.string(),
  sourceScenarioId: z.string(),
  targetScenarioId: z.string(),
  sourceName: z.string(),
  targetName: z.string(),
  summary: z.string().min(1),
  phases: z.array(MigrationPhase),
  risks: z.array(z.string()).default([]),
  successMeasures: z.array(z.string()).default([]),
});
export type MigrationPlan = z.infer<typeof MigrationPlan>;
