import { nanoid } from "nanoid";
import type { Pass } from "./types.js";

export const generatePath: Pass = async (_ctx) => ({
  passId: "generatePath",
  patch: {
    id: nanoid(),
    source: "compiler",
    rationale: "stub: migration mode is a v2 capability per plan",
    ops: [],
  },
  notes: "not yet implemented",
});
