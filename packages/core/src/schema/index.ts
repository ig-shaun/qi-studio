// v1 Zod schemas for the IXO Studio graph. Each node type has a thin v1 shape;
// fields are optional where later phases will extend them, so Phase-2 work
// doesn't require a schema migration.
export * from "./ids.js";
export * from "./primitives.js";
export * from "./intent.js";
export * from "./value-loop.js";
export * from "./pod.js";
export * from "./role.js";
export * from "./delegation.js";
export * from "./governance.js";
export * from "./edge.js";
export * from "./graph.js";
