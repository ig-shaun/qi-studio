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

export type CompileOptions = {
  userPrompt: string;
  initialGraph: Graph;
  onStep?: (result: PassResult, updatedGraph: Graph) => void | Promise<void>;
  signal?: AbortSignal;
};

export const compileIntent = async ({
  userPrompt,
  initialGraph,
  onStep,
  signal,
}: CompileOptions): Promise<{ graph: Graph; results: PassResult[] }> => {
  let graph = initialGraph;
  const results: PassResult[] = [];
  for (const pass of ALL_PASSES) {
    if (signal?.aborted) throw new Error("compile aborted");
    const result = await pass({ graph, userPrompt, ...(signal ? { signal } : {}) });
    graph = applyPatchTo(graph, result.patch);
    results.push(result);
    await onStep?.(result, graph);
  }
  return { graph, results };
};
