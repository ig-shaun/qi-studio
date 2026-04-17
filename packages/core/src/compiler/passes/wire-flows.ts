import { nanoid } from "nanoid";
import type { Pass } from "./types.js";

export const wireFlows: Pass = async (_ctx) => ({
  passId: "wireFlows",
  patch: {
    id: nanoid(),
    source: "compiler",
    rationale: "stub: implemented in Phase 4",
    ops: [],
  },
  notes: "not yet implemented",
});
