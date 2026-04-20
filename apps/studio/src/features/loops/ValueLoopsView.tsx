"use client";

import { useMemo, useState } from "react";
import type {
  Graph,
  IntentKernel,
  ValueLoop,
} from "@ixo-studio/core/schema";
import type { GraphPatch, NodePatch } from "@ixo-studio/core/store";

type Props = {
  graph: Graph;
  onPatch: (patch: GraphPatch) => void;
};

const CRITICALITIES: ValueLoop["criticality"][] = ["high", "medium", "low"];

const newNodeId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function ValueLoopsView({ graph, onPatch }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intent = useMemo(
    () =>
      Object.values(graph.nodes).find(
        (n): n is IntentKernel => n.kind === "intent"
      ),
    [graph]
  );
  const loops = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is ValueLoop => n.kind === "valueLoop"
      ),
    [graph]
  );

  if (!intent) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">No intent yet</div>
          <h3 className="canvas-empty__title">Compile an intent first.</h3>
          <p className="canvas-empty__body">
            Value loops decompose outcomes from the Intent Kernel. Generate or
            import one before editing loops.
          </p>
        </div>
      </div>
    );
  }

  const update = (loop: ValueLoop, patch: Partial<ValueLoop>, rationale: string) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale,
      ops: [{ op: "update-node", id: loop.id, patch }],
    });

  const addLoop = () => {
    const firstOutcomeId = intent.outcomes[0]?.id;
    const loop: ValueLoop = {
      id: newNodeId("loop"),
      kind: "valueLoop",
      name: "New value loop",
      purpose: "",
      intentId: intent.id,
      outcomeRefs: firstOutcomeId ? [firstOutcomeId] : [],
      triggerSignals: [],
      outputs: [],
      criticality: "medium",
    };
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Add value loop",
      ops: [{ op: "add-node", node: loop }],
    });
  };

  const removeLoop = (loop: ValueLoop) => {
    onPatch({
      id: patchId(),
      source: "user",
      rationale: `Remove value loop "${loop.name}"`,
      ops: [{ op: "remove-node", id: loop.id }],
    });
  };

  const suggestMore = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compile/synthesize-value-loops", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ graph }),
      });
      const json = (await res.json()) as
        | { passId: string; patch: { ops: NodePatch[]; rationale?: string } }
        | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : `HTTP ${res.status}`);
        return;
      }
      onPatch({
        id: patchId(),
        source: "copilot",
        rationale: json.patch.rationale ?? "Suggested additional value loops",
        ops: json.patch.ops,
      });
    } catch (err) {
      console.error("[suggest loops] failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Value loops</div>
          <p className="form-toolbar__lead">
            Decomposition of outcomes into runnable loops. Each loop is owned
            by one or more PODs. Criticality drives fill colour on the
            Organism.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={addLoop}
          >
            + Add loop
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={suggestMore}
            disabled={busy}
          >
            <span className="button__dot" />
            {busy ? "Thinking…" : "Suggest more with AI"}
          </button>
        </div>
      </header>

      {error && <div className="form-error">{error}</div>}

      {loops.length === 0 ? (
        <div className="form-empty">
          No value loops yet. Add one manually or ask the AI to suggest some.
        </div>
      ) : (
        <div className="card-grid">
          {loops.map((loop) => (
            <LoopCard
              key={loop.id}
              loop={loop}
              intent={intent}
              onUpdate={(patch, rationale) => update(loop, patch, rationale)}
              onRemove={() => removeLoop(loop)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LoopCard({
  loop,
  intent,
  onUpdate,
  onRemove,
}: {
  loop: ValueLoop;
  intent: IntentKernel;
  onUpdate: (patch: Partial<ValueLoop>, rationale: string) => void;
  onRemove: () => void;
}) {
  const toggleOutcome = (outcomeId: string) => {
    const next = loop.outcomeRefs.includes(outcomeId)
      ? loop.outcomeRefs.filter((id) => id !== outcomeId)
      : [...loop.outcomeRefs, outcomeId];
    onUpdate({ outcomeRefs: next }, "Toggle outcome ref");
  };

  return (
    <article
      className={`loop-card loop-card--${loop.criticality}`}
      data-kind="valueLoop"
    >
      <div className="loop-card__header">
        <input
          className="input loop-card__name"
          value={loop.name}
          onChange={(e) => onUpdate({ name: e.target.value }, "Edit loop name")}
          placeholder="Loop name"
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Remove loop"
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <label className="form-field">
        <span className="form-field__label">Purpose</span>
        <textarea
          className="textarea"
          rows={2}
          value={loop.purpose}
          onChange={(e) =>
            onUpdate({ purpose: e.target.value }, "Edit loop purpose")
          }
          placeholder="What this loop accomplishes for the organism"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Criticality</span>
          <select
            className="select"
            value={loop.criticality}
            onChange={(e) =>
              onUpdate(
                { criticality: e.target.value as ValueLoop["criticality"] },
                "Edit loop criticality"
              )
            }
          >
            {CRITICALITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-field__label">Required latency</span>
          <input
            className="input"
            value={loop.requiredLatency ?? ""}
            placeholder="e.g. 24h, monthly, realtime"
            onChange={(e) =>
              onUpdate(
                e.target.value
                  ? { requiredLatency: e.target.value }
                  : { requiredLatency: undefined },
                "Edit required latency"
              )
            }
          />
        </label>
      </div>

      <div>
        <div className="form-field__label" style={{ marginBottom: 6 }}>
          Linked outcomes
        </div>
        <div className="chip-row">
          {intent.outcomes.length === 0 ? (
            <span className="chip chip--muted">No outcomes on intent yet</span>
          ) : (
            intent.outcomes.map((o) => {
              const on = loop.outcomeRefs.includes(o.id);
              return (
                <button
                  type="button"
                  key={o.id}
                  className={`chip${on ? " chip--on" : ""}`}
                  onClick={() => toggleOutcome(o.id)}
                  title={o.statement}
                >
                  {truncate(o.statement, 40)}
                </button>
              );
            })
          )}
        </div>
      </div>

      <StringList
        label="Trigger signals"
        values={loop.triggerSignals}
        placeholder="What signal fires this loop"
        onChange={(next) =>
          onUpdate({ triggerSignals: next }, "Edit trigger signals")
        }
      />
      <StringList
        label="Outputs"
        values={loop.outputs}
        placeholder="What this loop produces"
        onChange={(next) => onUpdate({ outputs: next }, "Edit outputs")}
      />
    </article>
  );
}

function StringList({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <div className="form-field__label" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <ul className="editable-list">
        {values.map((v, i) => (
          <li key={i} className="editable-list__row">
            <input
              className="input"
              value={v}
              placeholder={placeholder}
              onChange={(e) => {
                const next = values.slice();
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className="icon-button"
              aria-label="Remove"
              onClick={() => {
                const next = values.slice();
                next.splice(i, 1);
                onChange(next);
              }}
            >
              ×
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => onChange([...values, ""])}
          >
            + Add {label.toLowerCase()}
          </button>
        </li>
      </ul>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
