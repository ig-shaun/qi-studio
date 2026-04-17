import { z } from "zod";
import { NodeId } from "./ids.js";
import { Criticality } from "./primitives.js";

export const ValueLoop = z.object({
  id: NodeId,
  kind: z.literal("valueLoop"),
  name: z.string().min(1),
  purpose: z.string(),
  intentId: NodeId,
  outcomeRefs: z.array(z.string()).default([]),
  triggerSignals: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  criticality: Criticality.default("medium"),
  requiredLatency: z.string().optional(),
});
export type ValueLoop = z.infer<typeof ValueLoop>;
