import { z } from "zod";
import { EdgeId, NodeId } from "./ids.js";
import { InteractionMode } from "./primitives.js";

export const EdgeKind = z.enum([
  "service",
  "authority",
  "escalation",
  "learning",
  "interaction",
]);
export type EdgeKind = z.infer<typeof EdgeKind>;

export const InteractionEdge = z.object({
  id: EdgeId,
  kind: z.literal("interaction"),
  from: NodeId,
  to: NodeId,
  mode: InteractionMode,
  reviewDate: z.string().optional(),
  exitCriteria: z.string().optional(),
});
export type InteractionEdge = z.infer<typeof InteractionEdge>;

export const PlainEdge = z.object({
  id: EdgeId,
  kind: z.enum(["service", "authority", "escalation", "learning"]),
  from: NodeId,
  to: NodeId,
  label: z.string().optional(),
});
export type PlainEdge = z.infer<typeof PlainEdge>;

export const Edge = z.discriminatedUnion("kind", [InteractionEdge, PlainEdge]);
export type Edge = z.infer<typeof Edge>;
