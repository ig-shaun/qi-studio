import { nanoid } from "nanoid";
import { computeFitness } from "../../fitness/index.js";
import type { Pass } from "./types.js";

export const evaluateFitness: Pass = async ({ graph }) => {
  const report = computeFitness(graph);
  const summary = report.metrics
    .map((m) => `${m.name}: ${Math.round(m.value * 100)}%`)
    .join(" · ");
  return {
    passId: "evaluateFitness",
    patch: {
      id: nanoid(),
      source: "compiler",
      rationale:
        summary +
        (report.antiPatterns.length > 0
          ? ` · ${report.antiPatterns.length} anti-pattern${
              report.antiPatterns.length === 1 ? "" : "s"
            }`
          : ""),
      impactedMetrics: report.metrics.map((m) => m.id),
      ops: [],
    },
    notes: `fitness score ${(report.score * 100).toFixed(0)}%`,
  };
};
