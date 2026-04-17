import { z } from "zod";
import { nanoid } from "nanoid";

export const NodeId = z.string().min(1);
export type NodeId = z.infer<typeof NodeId>;

export const EdgeId = z.string().min(1);
export type EdgeId = z.infer<typeof EdgeId>;

export const newNodeId = (prefix: string): NodeId => `${prefix}_${nanoid(10)}`;
export const newEdgeId = (): EdgeId => `edge_${nanoid(10)}`;
