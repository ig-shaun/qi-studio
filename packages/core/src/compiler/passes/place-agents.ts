import { nanoid } from "nanoid";
import type { Pass } from "./types.js";

export const placeAgents: Pass = async (_ctx) => ({
  passId: "placeAgents",
  patch: {
    id: nanoid(),
    source: "compiler",
    rationale: "stub: implemented in Phase 4",
    ops: [],
  },
  notes: "not yet implemented",
});
