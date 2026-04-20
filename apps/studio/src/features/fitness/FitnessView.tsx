"use client";

import { useMemo } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import {
  computeFitness,
  type AntiPattern,
  type FitnessMetric,
} from "@ixo-studio/core/fitness";

type Props = {
  graph: Graph;
};

export function FitnessView({ graph }: Props) {
  const report = useMemo(() => computeFitness(graph), [graph]);
  const hasNodes = Object.keys(graph.nodes).length > 0;

  if (!hasNodes) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">No organism yet</div>
          <h3 className="canvas-empty__title">Nothing to measure.</h3>
          <p className="canvas-empty__body">
            Generate or import a workspace first. Fitness metrics read the
            whole graph; they can't run on an empty one.
          </p>
        </div>
      </div>
    );
  }

  const score = report.score;

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Fitness lab</div>
          <p className="form-toolbar__lead">
            Four signature metrics and a rule-based anti-pattern scan. All
            computed deterministically from the current graph — no AI call.
          </p>
        </div>
        <div className="fitness-overall">
          <div className="fitness-overall__label">Overall</div>
          <div className="fitness-overall__value">
            {Math.round(score * 100)}
            <span>%</span>
          </div>
        </div>
      </header>

      <section className="fitness-metrics">
        {report.metrics.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </section>

      <section className="governance-section">
        <h3 className="governance-section__title">Anti-patterns</h3>
        {report.antiPatterns.length === 0 ? (
          <div className="form-empty">
            No anti-patterns detected. The organism's shape is clean.
          </div>
        ) : (
          <ul className="antipattern-list">
            {report.antiPatterns.map((p) => (
              <AntiPatternRow key={p.id} pattern={p} graph={graph} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({ metric }: { metric: FitnessMetric }) {
  const pct = Math.round(metric.value * 100);
  const tone =
    metric.value >= 0.8 ? "good" : metric.value >= 0.5 ? "warn" : "poor";
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__label">{metric.name}</div>
      <div className="metric-card__number">
        {pct}
        <span>%</span>
      </div>
      <div className="metric-card__bar" aria-hidden>
        <div
          className="metric-card__bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="metric-card__display">{metric.display}</div>
      <p className="metric-card__desc">{metric.description}</p>
    </article>
  );
}

function AntiPatternRow({
  pattern,
  graph,
}: {
  pattern: AntiPattern;
  graph: Graph;
}) {
  const labels = pattern.nodeIds
    .map((id) => labelForNode(graph, id))
    .filter(Boolean);
  return (
    <li className={`antipattern-row antipattern-row--${pattern.severity}`}>
      <div className="antipattern-row__head">
        <span
          className={`role-badge antipattern-badge antipattern-badge--${pattern.severity}`}
        >
          {pattern.severity}
        </span>
        <h4 className="antipattern-row__title">{pattern.name}</h4>
        <span className="antipattern-row__count">
          {pattern.nodeIds.length} affected
        </span>
      </div>
      <p className="antipattern-row__desc">{pattern.description}</p>
      {labels.length > 0 && (
        <div className="chip-row">
          {labels.slice(0, 10).map((l, i) => (
            <span key={i} className="chip">
              {l}
            </span>
          ))}
          {labels.length > 10 && (
            <span className="chip chip--muted">
              +{labels.length - 10} more
            </span>
          )}
        </div>
      )}
    </li>
  );
}

function labelForNode(graph: Graph, id: string): string | null {
  const node = graph.nodes[id];
  if (!node) return null;
  switch (node.kind) {
    case "intent":
      return node.purpose.slice(0, 50);
    case "valueLoop":
    case "pod":
    case "role":
    case "checkpoint":
    case "policy":
      return node.name;
    case "delegation":
      return node.mandate || `delegation ${id.slice(-4)}`;
  }
}
