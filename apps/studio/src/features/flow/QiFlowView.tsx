"use client";

import { useMemo, useState } from "react";
import type {
  Graph,
  InteractionEdge,
  PodProtocol,
} from "@ixo-studio/core/schema";
import type { GraphPatch, EdgePatch } from "@ixo-studio/core/store";

type Props = {
  graph: Graph;
  onPatch: (patch: GraphPatch) => void;
};

const MODES: InteractionEdge["mode"][] = [
  "collaboration",
  "x-as-a-service",
  "facilitation",
];

const newEdgeId = () =>
  `edge_${Math.random().toString(36).slice(2, 12)}`;
const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function QiFlowView({ graph, onPatch }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pods = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is PodProtocol => n.kind === "pod"
      ),
    [graph]
  );
  const podsById = useMemo(
    () => new Map(pods.map((p) => [p.id, p])),
    [pods]
  );

  const edges = useMemo(
    () =>
      Object.values(graph.edges).filter(
        (e): e is InteractionEdge => e.kind === "interaction"
      ),
    [graph]
  );

  if (pods.length < 2) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">Not enough PODs</div>
          <h3 className="canvas-empty__title">Need at least two PODs.</h3>
          <p className="canvas-empty__body">
            Qi flow maps the interactions between PODs. Add more PODs, then
            come back to wire their relationships.
          </p>
        </div>
      </div>
    );
  }

  const update = (
    edge: InteractionEdge,
    patch: Partial<Omit<InteractionEdge, "id" | "kind">>,
    rationale: string
  ) => {
    // Edge mutations go through remove + add since the GraphPatch shape
    // only supports add-edge / remove-edge.
    const next: InteractionEdge = { ...edge, ...patch };
    onPatch({
      id: patchId(),
      source: "user",
      rationale,
      ops: [
        { op: "remove-edge", id: edge.id },
        { op: "add-edge", edge: next },
      ],
    });
  };

  const addEdge = () => {
    const from = pods[0]!;
    const to = pods[1]!;
    const edge: InteractionEdge = {
      id: newEdgeId(),
      kind: "interaction",
      from: from.id,
      to: to.id,
      mode: "x-as-a-service",
    };
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Add interaction edge",
      ops: [{ op: "add-edge", edge }],
    });
  };

  const removeEdge = (edge: InteractionEdge) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Remove interaction edge",
      ops: [{ op: "remove-edge", id: edge.id }],
    });

  const inferFlows = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compile/wire-flows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ graph }),
      });
      const json = (await res.json()) as
        | { passId: string; patch: { ops: EdgePatch[]; rationale?: string } }
        | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : `HTTP ${res.status}`);
        return;
      }
      if (json.patch.ops.length === 0) {
        setError(
          "No implicit flows to wire — add shared roles or mix platform/enabling PODs with stream-aligned ones."
        );
        return;
      }
      onPatch({
        id: patchId(),
        source: "compiler",
        rationale:
          json.patch.rationale ??
          "Inferred interaction edges from Team Topologies rules",
        ops: json.patch.ops,
      });
    } catch (err) {
      console.error("[wire flows] failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Qi flow map</div>
          <p className="form-toolbar__lead">
            Interaction edges between PODs and their human-AI teams. Collaboration
            and facilitation edges must carry a review date and exit criteria
            so coordination doesn't become permanent.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={addEdge}
          >
            + Edge
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={inferFlows}
            disabled={busy}
            title="Rule-based: platform/enabling PODs to stream-aligned PODs; shared roles ⇒ collaboration"
          >
            <span className="button__dot" />
            {busy ? "Wiring…" : "Infer flows"}
          </button>
        </div>
      </header>

      {error && <div className="form-error">{error}</div>}

      {edges.length === 0 ? (
        <div className="form-empty">
          No interaction edges yet. Add one manually or infer from POD types.
        </div>
      ) : (
        <ul className="edge-list">
          {edges.map((edge) => (
            <EdgeRow
              key={edge.id}
              edge={edge}
              pods={pods}
              from={podsById.get(edge.from)}
              to={podsById.get(edge.to)}
              onUpdate={(patch, rationale) => update(edge, patch, rationale)}
              onRemove={() => removeEdge(edge)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EdgeRow({
  edge,
  pods,
  from,
  to,
  onUpdate,
  onRemove,
}: {
  edge: InteractionEdge;
  pods: PodProtocol[];
  from?: PodProtocol | undefined;
  to?: PodProtocol | undefined;
  onUpdate: (
    patch: Partial<Omit<InteractionEdge, "id" | "kind">>,
    rationale: string
  ) => void;
  onRemove: () => void;
}) {
  const needsCoordinationDetails =
    edge.mode === "collaboration" || edge.mode === "facilitation";
  const invalid =
    needsCoordinationDetails && (!edge.reviewDate || !edge.exitCriteria);
  const orphan = !from || !to;

  return (
    <li
      className={`edge-row edge-row--${edge.mode}${
        invalid || orphan ? " edge-row--warn" : ""
      }`}
    >
      <div className="edge-row__ends">
        <select
          className="select"
          value={edge.from}
          onChange={(e) => onUpdate({ from: e.target.value }, "Change edge source")}
        >
          {pods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="edge-row__arrow" aria-hidden>
          →
        </span>
        <select
          className="select"
          value={edge.to}
          onChange={(e) => onUpdate({ to: e.target.value }, "Change edge target")}
        >
          {pods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="edge-row__mode">
        {MODES.map((m) => (
          <button
            type="button"
            key={m}
            className={`chip edge-mode-chip edge-mode-chip--${m}${
              edge.mode === m ? " chip--on" : ""
            }`}
            onClick={() => {
              // Clearing coordination details is OK when switching to x-as-a-service
              const next: Partial<InteractionEdge> = { mode: m };
              if (m === "x-as-a-service") {
                next.reviewDate = undefined;
                next.exitCriteria = undefined;
              }
              onUpdate(next, "Change edge mode");
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {needsCoordinationDetails && (
        <div className="edge-row__details">
          <label className="form-field">
            <span className="form-field__label">Review date</span>
            <input
              type="date"
              className="input"
              value={edge.reviewDate ?? ""}
              onChange={(e) =>
                onUpdate(
                  {
                    reviewDate: e.target.value || undefined,
                  },
                  "Edit review date"
                )
              }
            />
          </label>
          <label className="form-field">
            <span className="form-field__label">Exit criteria</span>
            <input
              className="input"
              placeholder="When does this coordination end?"
              value={edge.exitCriteria ?? ""}
              onChange={(e) =>
                onUpdate(
                  {
                    exitCriteria: e.target.value || undefined,
                  },
                  "Edit exit criteria"
                )
              }
            />
          </label>
        </div>
      )}

      {invalid && !orphan && (
        <div className="edge-row__warn">
          ⚠ {edge.mode} edges must carry a review date and exit criteria.
        </div>
      )}
      {orphan && (
        <div className="edge-row__warn">
          ⚠ One end of this edge no longer exists.
        </div>
      )}

      <button
        type="button"
        className="icon-button edge-row__remove"
        aria-label="Remove edge"
        onClick={onRemove}
      >
        ×
      </button>
    </li>
  );
}
