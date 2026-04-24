"use client";

import { useMemo, useRef, useState } from "react";
import type { ScenarioBundle } from "@ixo-studio/core/store";
import { findScenario, TARGET_SCENARIO_ID } from "@ixo-studio/core/store";
import type { MigrationPlan } from "@ixo-studio/core/migration";

type Props = {
  bundle: ScenarioBundle;
  onPlanUpdate: (plan: MigrationPlan | null) => void;
};

const CURRENT_SCENARIO_ID = "scn_current_state";

export function MigrationPlanView({ bundle, onPlanUpdate }: Props) {
  const plan = bundle.migrationPlan;

  const defaultSource = useMemo(() => {
    if (findScenario(bundle, CURRENT_SCENARIO_ID)) return CURRENT_SCENARIO_ID;
    return bundle.scenarios[0]?.id ?? "";
  }, [bundle]);
  const defaultTarget = useMemo(() => {
    if (findScenario(bundle, TARGET_SCENARIO_ID)) return TARGET_SCENARIO_ID;
    return bundle.scenarios[bundle.scenarios.length - 1]?.id ?? "";
  }, [bundle]);

  const [sourceId, setSourceId] = useState<string>(
    plan?.sourceScenarioId ?? defaultSource
  );
  const [targetId, setTargetId] = useState<string>(
    plan?.targetScenarioId ?? defaultTarget
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sourceScenario = findScenario(bundle, sourceId);
  const targetScenario = findScenario(bundle, targetId);
  const samePair = sourceId === targetId;
  const canGenerate =
    !!sourceScenario && !!targetScenario && !samePair && !loading;

  const generate = async () => {
    if (!sourceScenario || !targetScenario) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/compile/migration", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceGraph: sourceScenario.graph,
          targetGraph: targetScenario.graph,
          sourceScenarioId: sourceScenario.id,
          targetScenarioId: targetScenario.id,
          sourceName: sourceScenario.name,
          targetName: targetScenario.name,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { plan: MigrationPlan };
      onPlanUpdate(data.plan);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("[migration] request failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const clearPlan = () => {
    onPlanUpdate(null);
    setError(null);
  };

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Path view</div>
          <p className="form-toolbar__lead">
            Claude reads both scenarios and drafts a sequenced migration plan.
            Source and target can be any two scenarios; by default we go from
            Current State to Target State.
          </p>
        </div>
      </header>

      <section className="migration-controls">
        <label className="form-field">
          <span className="form-field__label">Source</span>
          <select
            className="select"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            disabled={loading}
          >
            {bundle.scenarios
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {nodeCountLabel(s.graph.nodes)}
                </option>
              ))}
          </select>
        </label>

        <div className="migration-controls__arrow" aria-hidden>
          →
        </div>

        <label className="form-field">
          <span className="form-field__label">Target</span>
          <select
            className="select"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={loading}
          >
            {bundle.scenarios
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {nodeCountLabel(s.graph.nodes)}
                </option>
              ))}
          </select>
        </label>

        <div className="migration-controls__actions">
          {loading ? (
            <button
              type="button"
              className="button button--ghost"
              onClick={cancel}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary"
              onClick={generate}
              disabled={!canGenerate}
            >
              <span className="button__dot" />
              {plan ? "Regenerate" : "Generate migration plan"}
            </button>
          )}
          {plan && !loading && (
            <button
              type="button"
              className="button button--ghost"
              onClick={clearPlan}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {samePair && (
        <p className="migration-hint">
          Source and target are the same scenario — pick two different
          scenarios to generate a plan.
        </p>
      )}

      {error && <p className="migration-error">{error}</p>}

      {loading && (
        <div className="migration-loading">
          <span className="migration-loading__dot" />
          <span>
            Drafting plan… this typically takes 10–20 seconds for populated
            scenarios.
          </span>
        </div>
      )}

      {plan && !loading && <PlanReader plan={plan} />}

      {!plan && !loading && (
        <div className="migration-empty">
          <div className="eyebrow">No plan yet</div>
          <h3 className="migration-empty__title">
            What moves the organisation from here to there?
          </h3>
          <p className="migration-empty__body">
            Pick a source and target scenario above, then click Generate.
            Claude will sequence the shift into phases with rationale, key
            changes, role transitions, governance moves, and risks.
          </p>
        </div>
      )}
    </div>
  );
}

function PlanReader({ plan }: { plan: MigrationPlan }) {
  return (
    <article className="migration-plan">
      <header className="migration-plan__header">
        <div className="migration-plan__route">
          <span>{plan.sourceName}</span>
          <span className="migration-plan__arrow" aria-hidden>→</span>
          <span>{plan.targetName}</span>
        </div>
        <div className="migration-plan__meta">
          Generated {formatTimestamp(plan.generatedAt)}
        </div>
      </header>

      <p className="migration-plan__summary">{plan.summary}</p>

      <ol className="migration-phases">
        {plan.phases.map((p, i) => (
          <li key={p.id} className="migration-phase">
            <div className="migration-phase__index">Phase {i + 1}</div>
            <h4 className="migration-phase__name">{p.name}</h4>
            <p className="migration-phase__rationale">{p.rationale}</p>
            <PhaseField label="Preconditions" items={p.preconditions} />
            <PhaseField label="Key changes" items={p.keyChanges} />
            <PhaseField label="New roles" items={p.newRoles} />
            <PhaseField label="Retired roles" items={p.retiredRoles} />
            <PhaseField label="Governance shifts" items={p.governanceShifts} />
            <PhaseField label="Risks" items={p.risks} tone="risk" />
          </li>
        ))}
      </ol>

      {plan.risks.length > 0 && (
        <section className="migration-block migration-block--risks">
          <h4 className="migration-block__title">Overall risks</h4>
          <ul className="migration-list">
            {plan.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {plan.successMeasures.length > 0 && (
        <section className="migration-block migration-block--success">
          <h4 className="migration-block__title">Success measures</h4>
          <ul className="migration-list">
            {plan.successMeasures.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function PhaseField({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone?: "risk";
}) {
  if (!items.length) return null;
  return (
    <div className={`migration-phase__field${tone ? ` migration-phase__field--${tone}` : ""}`}>
      <div className="migration-phase__field-label">{label}</div>
      <ul className="migration-list">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

const nodeCountLabel = (nodes: Record<string, unknown>): string => {
  const n = Object.keys(nodes).length;
  if (n === 0) return " — empty";
  return ` — ${n} node${n === 1 ? "" : "s"}`;
};

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
