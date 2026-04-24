import type { Graph } from "../../schema/index.js";
import type { GraphPatch } from "../../store/patch.js";

export type PassId =
  | "parseIntent"
  | "synthesizeValueLoops"
  | "emergePods"
  | "composeRoles"
  | "placeAgents"
  | "synthesizeGovernance"
  | "wireFlows"
  | "evaluateFitness";

export type PassContext = {
  graph: Graph;
  userPrompt?: string;
  signal?: AbortSignal;
};

export type PassResult = {
  passId: PassId;
  patch: GraphPatch;
  notes?: string;
};

export type Pass = (ctx: PassContext) => Promise<PassResult>;
