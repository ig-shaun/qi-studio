import type { Graph } from "../schema/index.js";
import { computeMetrics, type FitnessMetric } from "./metrics.js";
import { detectAntiPatterns, type AntiPattern } from "./anti-patterns.js";

export * from "./metrics.js";
export * from "./anti-patterns.js";

export type FitnessReport = {
  metrics: FitnessMetric[];
  antiPatterns: AntiPattern[];
  score: number; // mean of all metrics, 0..1
};

export const computeFitness = (graph: Graph): FitnessReport => {
  const metrics = computeMetrics(graph);
  const antiPatterns = detectAntiPatterns(graph);
  const score =
    metrics.length === 0
      ? 0
      : metrics.reduce((s, m) => s + m.value, 0) / metrics.length;
  return { metrics, antiPatterns, score };
};
