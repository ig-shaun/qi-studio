"use client";

import { useMemo, useState } from "react";
import type {
  Graph,
  PodProtocol,
  RoleTemplate,
  ValueLoop,
} from "@ixo-studio/core/schema";
import type { GraphPatch, NodePatch } from "@ixo-studio/core/store";

type Props = {
  graph: Graph;
  onPatch: (patch: GraphPatch) => void;
};

const POD_TYPES: PodProtocol["podType"][] = [
  "stream-aligned",
  "platform",
  "enabling",
  "complicated-subsystem",
];

const newNodeId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const newListId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function PodsView({ graph, onPatch }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loops = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is ValueLoop => n.kind === "valueLoop"
      ),
    [graph]
  );
  const pods = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is PodProtocol => n.kind === "pod"
      ),
    [graph]
  );
  const roles = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is RoleTemplate => n.kind === "role"
      ),
    [graph]
  );

  if (loops.length === 0) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">No value loops yet</div>
          <h3 className="canvas-empty__title">Build loops before PODs.</h3>
          <p className="canvas-empty__body">
            Every POD is primarily owned by one value loop, so loops must
            exist first. Generate or add a value loop in the Value Loops view.
          </p>
        </div>
      </div>
    );
  }

  const update = (
    pod: PodProtocol,
    patch: Partial<PodProtocol>,
    rationale: string
  ) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale,
      ops: [{ op: "update-node", id: pod.id, patch }],
    });

  const addPod = () => {
    const pod: PodProtocol = {
      id: newNodeId("pod"),
      kind: "pod",
      name: "New POD",
      purpose: "",
      primaryLoopId: loops[0]!.id,
      podType: "stream-aligned",
      accountabilities: [],
      humanRoleIds: [],
      agentRoleIds: [],
      localDecisions: [],
      escalatedDecisions: [],
      metrics: [],
      cognitiveLoadBudget: 10,
    };
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Add POD",
      ops: [{ op: "add-node", node: pod }],
    });
  };

  const removePod = (pod: PodProtocol) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale: `Remove POD "${pod.name}"`,
      ops: [{ op: "remove-node", id: pod.id }],
    });

  const suggestMore = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compile/emerge-pods", {
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
        rationale: json.patch.rationale ?? "Suggested additional PODs",
        ops: json.patch.ops,
      });
    } catch (err) {
      console.error("[suggest pods] failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">POD protocols</div>
          <p className="form-toolbar__lead">
            Team Topologies types, cognitive load budgets, and weighted
            accountabilities. Overload is a hard invariant — the Organism
            flags any POD where load exceeds budget.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={addPod}
          >
            + Add POD
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

      {pods.length === 0 ? (
        <div className="form-empty">
          No PODs yet. Add one manually or ask the AI to suggest some.
        </div>
      ) : (
        <div className="card-grid">
          {pods.map((pod) => (
            <PodCard
              key={pod.id}
              pod={pod}
              loops={loops}
              roles={roles}
              onUpdate={(patch, rationale) => update(pod, patch, rationale)}
              onRemove={() => removePod(pod)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PodCard({
  pod,
  loops,
  roles,
  onUpdate,
  onRemove,
}: {
  pod: PodProtocol;
  loops: ValueLoop[];
  roles: RoleTemplate[];
  onUpdate: (patch: Partial<PodProtocol>, rationale: string) => void;
  onRemove: () => void;
}) {
  const load = pod.accountabilities.reduce(
    (sum, a) => sum + (a.complexityWeight ?? 1),
    0
  );
  const loadRatio = Math.min(1, load / pod.cognitiveLoadBudget);
  const overloaded = load > pod.cognitiveLoadBudget;

  const humans = roles.filter((r) => r.class === "human");
  const agents = roles.filter((r) => r.class === "agent" || r.class === "hybrid");

  const toggleRole = (
    kind: "human" | "agent",
    roleId: string
  ) => {
    const key = kind === "human" ? "humanRoleIds" : "agentRoleIds";
    const current = pod[key];
    const next = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];
    onUpdate({ [key]: next }, `Toggle ${kind} role`);
  };

  const updateAccountability = (
    i: number,
    partial: Partial<PodProtocol["accountabilities"][number]>
  ) => {
    const next = pod.accountabilities.slice();
    next[i] = { ...next[i]!, ...partial };
    onUpdate({ accountabilities: next }, "Edit accountability");
  };

  const addAccountability = () => {
    onUpdate(
      {
        accountabilities: [
          ...pod.accountabilities,
          { id: newListId("acc"), statement: "", complexityWeight: 1 },
        ],
      },
      "Add accountability"
    );
  };

  const removeAccountability = (i: number) => {
    const next = pod.accountabilities.slice();
    next.splice(i, 1);
    onUpdate({ accountabilities: next }, "Remove accountability");
  };

  return (
    <article
      className={`pod-card${overloaded ? " pod-card--overloaded" : ""}`}
      data-pod-type={pod.podType}
    >
      <div className="pod-card__header">
        <input
          className="input loop-card__name"
          value={pod.name}
          onChange={(e) => onUpdate({ name: e.target.value }, "Edit POD name")}
          placeholder="POD name"
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Remove POD"
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
          value={pod.purpose}
          onChange={(e) =>
            onUpdate({ purpose: e.target.value }, "Edit POD purpose")
          }
          placeholder="Why this POD exists"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Primary loop</span>
          <select
            className="select"
            value={pod.primaryLoopId}
            onChange={(e) =>
              onUpdate({ primaryLoopId: e.target.value }, "Change primary loop")
            }
          >
            {loops.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-field__label">Team Topologies type</span>
          <select
            className="select"
            value={pod.podType}
            onChange={(e) =>
              onUpdate(
                { podType: e.target.value as PodProtocol["podType"] },
                "Edit POD type"
              )
            }
          >
            {POD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="pod-gauge">
        <div className="pod-gauge__head">
          <span className="form-field__label">Cognitive load</span>
          <span
            className={`tag${overloaded ? " tag--alert" : ""}`}
            style={{ marginLeft: "auto" }}
          >
            {load} / {pod.cognitiveLoadBudget}
            {overloaded ? " — overload" : ""}
          </span>
        </div>
        <div className="pod-gauge__track">
          <div
            className={`pod-gauge__fill${overloaded ? " pod-gauge__fill--alert" : ""}`}
            style={{ width: `${loadRatio * 100}%` }}
          />
        </div>
        <label className="form-field" style={{ marginTop: 10 }}>
          <span className="form-field__label">Budget</span>
          <input
            className="input"
            type="number"
            min={1}
            max={50}
            step={1}
            value={pod.cognitiveLoadBudget}
            onChange={(e) => {
              const v = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(v))
                onUpdate({ cognitiveLoadBudget: v }, "Edit cognitive budget");
            }}
          />
        </label>
      </section>

      <section>
        <div className="form-field__label" style={{ marginBottom: 6 }}>
          Accountabilities
        </div>
        <ul className="editable-list">
          {pod.accountabilities.map((a, i) => (
            <li key={a.id} className="editable-list__row">
              <input
                className="input"
                value={a.statement}
                placeholder="What this POD is on the hook for"
                onChange={(e) =>
                  updateAccountability(i, { statement: e.target.value })
                }
              />
              <input
                className="input input--narrow"
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={a.complexityWeight}
                title="Complexity weight"
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  if (!Number.isNaN(v))
                    updateAccountability(i, { complexityWeight: v });
                }}
              />
              <button
                type="button"
                className="icon-button"
                aria-label="Remove accountability"
                onClick={() => removeAccountability(i)}
              >
                ×
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={addAccountability}
            >
              + Add accountability
            </button>
          </li>
        </ul>
      </section>

      <section>
        <div className="form-field__label" style={{ marginBottom: 6 }}>
          Human roles
        </div>
        <div className="chip-row">
          {humans.length === 0 ? (
            <span className="chip chip--muted">No human roles defined</span>
          ) : (
            humans.map((r) => (
              <button
                type="button"
                key={r.id}
                className={`chip${pod.humanRoleIds.includes(r.id) ? " chip--on" : ""}`}
                onClick={() => toggleRole("human", r.id)}
                title={r.purpose}
              >
                {r.name}
              </button>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="form-field__label" style={{ marginBottom: 6 }}>
          Agent roles
        </div>
        <div className="chip-row">
          {agents.length === 0 ? (
            <span className="chip chip--muted">No agent roles defined</span>
          ) : (
            agents.map((r) => (
              <button
                type="button"
                key={r.id}
                className={`chip${pod.agentRoleIds.includes(r.id) ? " chip--on" : ""}`}
                onClick={() => toggleRole("agent", r.id)}
                title={r.purpose}
              >
                {r.name}
                {r.agentClass ? ` · ${r.agentClass}` : ""}
              </button>
            ))
          )}
        </div>
      </section>

      <StringList
        label="Local decisions"
        values={pod.localDecisions}
        placeholder="What this POD decides on its own"
        onChange={(next) =>
          onUpdate({ localDecisions: next }, "Edit local decisions")
        }
      />
      <StringList
        label="Escalated decisions"
        values={pod.escalatedDecisions}
        placeholder="What this POD escalates upward"
        onChange={(next) =>
          onUpdate({ escalatedDecisions: next }, "Edit escalated decisions")
        }
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
    <section>
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
            + Add
          </button>
        </li>
      </ul>
    </section>
  );
}
