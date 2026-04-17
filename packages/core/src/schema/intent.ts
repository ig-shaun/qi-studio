import { z } from "zod";
import { NodeId } from "./ids.js";
import { AdaptabilityTarget, Horizon } from "./primitives.js";

export const Outcome = z.object({
  id: z.string(),
  statement: z.string(),
  metric: z.string().optional(),
});
export type Outcome = z.infer<typeof Outcome>;

export const Constraint = z.object({
  id: z.string(),
  statement: z.string(),
  kind: z.enum(["regulatory", "ethical", "resource", "technical", "strategic"]),
});
export type Constraint = z.infer<typeof Constraint>;

export const JudgmentBoundary = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nonDelegable: z.boolean().default(true),
  accountableRoleId: NodeId.optional(),
});
export type JudgmentBoundary = z.infer<typeof JudgmentBoundary>;

export const StakeholderRef = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["customer", "beneficiary", "regulator", "partner", "internal"]),
});
export type StakeholderRef = z.infer<typeof StakeholderRef>;

export const Principle = z.object({
  id: z.string(),
  statement: z.string(),
});
export type Principle = z.infer<typeof Principle>;

export const IntentKernel = z.object({
  id: NodeId,
  kind: z.literal("intent"),
  purpose: z.string().min(1),
  stakeholders: z.array(StakeholderRef).default([]),
  outcomes: z.array(Outcome).default([]),
  constraints: z.array(Constraint).default([]),
  sovereigntyZones: z.array(JudgmentBoundary).default([]),
  principles: z.array(Principle).default([]),
  horizon: Horizon.default("1y"),
  adaptabilityTarget: AdaptabilityTarget.default("adaptive"),
  executiveSponsor: NodeId.optional(),
  dataAiOwner: NodeId.optional(),
});
export type IntentKernel = z.infer<typeof IntentKernel>;
