import { z } from "zod";

export const Horizon = z.enum(["90d", "1y", "3y"]);
export type Horizon = z.infer<typeof Horizon>;

export const AdaptabilityTarget = z.enum(["stable", "adaptive", "highly-adaptive"]);
export type AdaptabilityTarget = z.infer<typeof AdaptabilityTarget>;

export const Criticality = z.enum(["low", "medium", "high"]);
export type Criticality = z.infer<typeof Criticality>;

export const PodType = z.enum([
  "stream-aligned",
  "platform",
  "enabling",
  "complicated-subsystem",
]);
export type PodType = z.infer<typeof PodType>;

export const RoleClass = z.enum(["human", "agent", "hybrid"]);
export type RoleClass = z.infer<typeof RoleClass>;

export const AgentClass = z.enum(["orchestration", "service", "copilot"]);
export type AgentClass = z.infer<typeof AgentClass>;

export const AutonomyLevel = z.enum([
  "assist",
  "recommend",
  "act-with-approval",
  "act-with-audit",
]);
export type AutonomyLevel = z.infer<typeof AutonomyLevel>;

export const InteractionMode = z.enum([
  "collaboration",
  "x-as-a-service",
  "facilitation",
]);
export type InteractionMode = z.infer<typeof InteractionMode>;

export const Reversibility = z.enum(["reversible", "partially-reversible", "irreversible"]);
export type Reversibility = z.infer<typeof Reversibility>;
