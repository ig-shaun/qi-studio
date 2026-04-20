import { applyPatchTo } from "./apply.js";
import type { Graph } from "../schema/index.js";
import { parseIntent } from "./passes/parse-intent.js";
import { synthesizeValueLoops } from "./passes/synthesize-value-loops.js";
import { emergePods } from "./passes/emerge-pods.js";
import { composeRoles } from "./passes/compose-roles.js";
import { placeAgents } from "./passes/place-agents.js";
import { synthesizeGovernance } from "./passes/synthesize-governance.js";
import { wireFlows } from "./passes/wire-flows.js";
import { evaluateFitness } from "./passes/evaluate-fitness.js";
import { generatePath } from "./passes/generate-path.js";
import type { Pass, PassResult } from "./passes/types.js";

const ALL_PASSES: Pass[] = [
  parseIntent,
  synthesizeValueLoops,
  emergePods,
  composeRoles,
  placeAgents,
  synthesizeGovernance,
  wireFlows,
  evaluateFitness,
  generatePath,
];

import type { PassId } from "./passes/types.js";

export const PASS_ORDER: readonly PassId[] = [
  "parseIntent",
  "synthesizeValueLoops",
  "emergePods",
  "composeRoles",
  "placeAgents",
  "synthesizeGovernance",
  "wireFlows",
  "evaluateFitness",
  "generatePath",
] as const;

export type CompileOptions = {
  userPrompt: string;
  initialGraph: Graph;
  onBeforeStep?: (passId: PassId) => void | Promise<void>;
  onStep?: (result: PassResult, updatedGraph: Graph) => void | Promise<void>;
  signal?: AbortSignal;
};

export const compileIntent = async ({
  userPrompt,
  initialGraph,
  onBeforeStep,
  onStep,
  signal,
}: CompileOptions): Promise<{ graph: Graph; results: PassResult[] }> => {
  let graph = initialGraph;
  const results: PassResult[] = [];
  for (let i = 0; i < ALL_PASSES.length; i++) {
    const pass = ALL_PASSES[i]!;
    const passId = PASS_ORDER[i]!;
    if (signal?.aborted) throw new Error("compile aborted");
    await onBeforeStep?.(passId);
    const result = await pass({ graph, userPrompt, ...(signal ? { signal } : {}) });
    graph = applyPatchTo(graph, result.patch);
    results.push(result);
    await onStep?.(result, graph);
  }
  return { graph, results };
};
