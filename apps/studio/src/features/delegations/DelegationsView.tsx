"use client";

import { useMemo, useState } from "react";
import type {
  Checkpoint,
  DelegationContract,
  Graph,
  PodProtocol,
  RoleTemplate,
} from "@ixo-studio/core/schema";
import type { GraphPatch, NodePatch } from "@ixo-studio/core/store";

type Props = {
  graph: Graph;
  onPatch: (patch: GraphPatch) => void;
};

const AUTONOMY_LEVELS: DelegationContract["autonomyLevel"][] = [
  "assist",
  "recommend",
  "act-with-approval",
  "act-with-audit",
];

const SCOPES: DelegationContract["toolAccess"][number]["scope"][] = [
  "read",
  "write",
  "invoke",
];

const newNodeId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function DelegationsView({ graph, onPatch }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const checkpoints = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is Checkpoint => n.kind === "checkpoint"
      ),
    [graph]
  );
  const delegations = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is DelegationContract => n.kind === "delegation"
      ),
    [graph]
  );

  const rolesById = useMemo(
    () => new Map(roles.map((r) => [r.id, r])),
    [roles]
  );
  const podsById = useMemo(
    () => new Map(pods.map((p) => [p.id, p])),
    [pods]
  );

  if (pods.length === 0 || roles.length === 0) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">Missing prerequisites</div>
          <h3 className="canvas-empty__title">Need PODs and roles.</h3>
          <p className="canvas-empty__body">
            Delegation contracts bind a human supervisor to an agent inside a
            POD. Build PODs and compose roles first.
          </p>
        </div>
      </div>
    );
  }

  const podsWithAgents = pods.filter((p) => p.agentRoleIds.length > 0);
  const canAddManual = podsWithAgents.length > 0;

  const update = (
    d: DelegationContract,
    patch: Partial<DelegationContract>,
    rationale: string
  ) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale,
      ops: [{ op: "update-node", id: d.id, patch }],
    });

  const addDelegation = () => {
    const pod = podsWithAgents[0];
    if (!pod) return;
    const supervisor = pod.humanRoleIds
      .map((id) => rolesById.get(id))
      .find((r): r is RoleTemplate => !!r);
    const agent = pod.agentRoleIds
      .map((id) => rolesById.get(id))
      .find((r): r is RoleTemplate => !!r);
    if (!supervisor || !agent) {
      setError(
        "Pick a POD that has at least one human role and one agent role assigned."
      );
      return;
    }
    const contract: DelegationContract = {
      id: newNodeId("deleg"),
      kind: "delegation",
      podId: pod.id,
      supervisingHumanRoleId: supervisor.id,
      delegatedAgentRoleId: agent.id,
      mandate: "",
      autonomyLevel: "assist",
      allowedActions: [],
      forbiddenActions: [],
      toolAccess: [],
    };
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Add delegation",
      ops: [{ op: "add-node", node: contract }],
    });
  };

  const removeDelegation = (d: DelegationContract) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale: `Remove delegation "${d.mandate || d.id}"`,
      ops: [{ op: "remove-node", id: d.id }],
    });

  const suggestMore = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compile/place-agents", {
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
      const ops = json.patch.ops.filter((o) => o.op === "add-node");
      if (ops.length === 0) {
        setError(
          "AI returned no new delegations. Make sure PODs have both human and agent roles assigned."
        );
        return;
      }
      onPatch({
        id: patchId(),
        source: "copilot",
        rationale: json.patch.rationale ?? "Suggested additional delegations",
        ops,
      });
    } catch (err) {
      console.error("[suggest delegations] failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Agent delegation</div>
          <p className="form-toolbar__lead">
            Contracts that bind every agent to a named human supervisor,
            scoped by autonomy level and checkpoint policy. No agent is
            allowed to act outside a contract.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={addDelegation}
            disabled={!canAddManual}
            title={
              canAddManual
                ? ""
                : "Assign a human and agent role to a POD first"
            }
          >
            + Add contract
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

      {delegations.length === 0 ? (
        <div className="form-empty">
          No delegation contracts yet. Every agent needs one.
        </div>
      ) : (
        <div className="card-grid">
          {delegations.map((d) => (
            <DelegationCard
              key={d.id}
              delegation={d}
              pods={pods}
              rolesById={rolesById}
              podsById={podsById}
              checkpoints={checkpoints}
              onUpdate={(patch, rationale) => update(d, patch, rationale)}
              onRemove={() => removeDelegation(d)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DelegationCard({
  delegation: d,
  pods,
  rolesById,
  podsById,
  checkpoints,
  onUpdate,
  onRemove,
}: {
  delegation: DelegationContract;
  pods: PodProtocol[];
  rolesById: Map<string, RoleTemplate>;
  podsById: Map<string, PodProtocol>;
  checkpoints: Checkpoint[];
  onUpdate: (patch: Partial<DelegationContract>, rationale: string) => void;
  onRemove: () => void;
}) {
  const pod = podsById.get(d.podId);
  const supervisor = rolesById.get(d.supervisingHumanRoleId);
  const agent = rolesById.get(d.delegatedAgentRoleId);

  const humanOptions = (pod?.humanRoleIds ?? [])
    .map((id) => rolesById.get(id))
    .filter((r): r is RoleTemplate => !!r);
  const agentOptions = (pod?.agentRoleIds ?? [])
    .map((id) => rolesById.get(id))
    .filter((r): r is RoleTemplate => !!r);

  // Flag invariant violations inline for this delegation.
  const missingSupervisor =
    !supervisor ||
    (supervisor.class !== "human" && supervisor.class !== "hybrid");
  const missingAgent =
    !agent || (agent.class !== "agent" && agent.class !== "hybrid");
  const needsCheckpoint =
    (d.autonomyLevel === "act-with-approval" ||
      d.autonomyLevel === "act-with-audit") &&
    !d.checkpointPolicyId;

  const hardProblem = missingSupervisor || missingAgent;

  return (
    <article
      className={`delegation-card delegation-card--${d.autonomyLevel}${
        hardProblem ? " delegation-card--invalid" : ""
      }`}
    >
      <div className="pod-card__header">
        <span className="role-badge role-badge--agent">delegation</span>
        <input
          className="input loop-card__name"
          value={d.mandate}
          placeholder="Mandate — what this agent is trusted to do"
          onChange={(e) =>
            onUpdate({ mandate: e.target.value }, "Edit mandate")
          }
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Remove delegation"
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <label className="form-field">
        <span className="form-field__label">Autonomy level</span>
        <div className="autonomy-segmented">
          {AUTONOMY_LEVELS.map((a) => (
            <button
              type="button"
              key={a}
              className={`autonomy-segmented__btn autonomy-segmented__btn--${a}${
                d.autonomyLevel === a ? " is-active" : ""
              }`}
              onClick={() => onUpdate({ autonomyLevel: a }, "Edit autonomy")}
            >
              {a}
            </button>
          ))}
        </div>
      </label>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">POD</span>
          <select
            className="select"
            value={d.podId}
            onChange={(e) => {
              // Changing POD may invalidate supervisor/agent choices — pick
              // first eligible of each from the new POD.
              const nextPod = pods.find((p) => p.id === e.target.value);
              if (!nextPod) return;
              const nextSupervisor = nextPod.humanRoleIds[0] ?? "";
              const nextAgent = nextPod.agentRoleIds[0] ?? "";
              onUpdate(
                {
                  podId: nextPod.id,
                  supervisingHumanRoleId:
                    nextSupervisor || d.supervisingHumanRoleId,
                  delegatedAgentRoleId: nextAgent || d.delegatedAgentRoleId,
                },
                "Change delegation POD"
              );
            }}
          >
            {pods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-field__label">Checkpoint</span>
          <select
            className="select"
            value={d.checkpointPolicyId ?? ""}
            onChange={(e) =>
              onUpdate(
                {
                  checkpointPolicyId:
                    e.target.value === "" ? undefined : e.target.value,
                },
                "Edit checkpoint link"
              )
            }
          >
            <option value="">— none</option>
            {checkpoints.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.reversibility})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Supervising human</span>
          <select
            className="select"
            value={d.supervisingHumanRoleId}
            onChange={(e) =>
              onUpdate(
                { supervisingHumanRoleId: e.target.value },
                "Change supervisor"
              )
            }
          >
            {humanOptions.length === 0 ? (
              <option value="">— no human role on this POD</option>
            ) : (
              humanOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="form-field">
          <span className="form-field__label">Delegated agent</span>
          <select
            className="select"
            value={d.delegatedAgentRoleId}
            onChange={(e) =>
              onUpdate(
                { delegatedAgentRoleId: e.target.value },
                "Change delegated agent"
              )
            }
          >
            {agentOptions.length === 0 ? (
              <option value="">— no agent role on this POD</option>
            ) : (
              agentOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.agentClass ? ` · ${r.agentClass}` : ""}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {(missingSupervisor || missingAgent || needsCheckpoint) && (
        <ul className="delegation-warnings">
          {missingSupervisor && (
            <li>No valid human supervisor — this breaks an invariant.</li>
          )}
          {missingAgent && <li>No valid agent role on this contract.</li>}
          {needsCheckpoint && (
            <li>
              Act-with-approval / act-with-audit should link to a checkpoint.
            </li>
          )}
        </ul>
      )}

      <StringList
        label="Allowed actions"
        values={d.allowedActions}
        placeholder="What this agent may do"
        onChange={(next) =>
          onUpdate({ allowedActions: next }, "Edit allowed actions")
        }
      />
      <StringList
        label="Forbidden actions"
        values={d.forbiddenActions}
        placeholder="Hard limits the agent must not cross"
        onChange={(next) =>
          onUpdate({ forbiddenActions: next }, "Edit forbidden actions")
        }
      />

      <section>
        <div className="form-field__label" style={{ marginBottom: 6 }}>
          Tool access
        </div>
        <ul className="editable-list">
          {d.toolAccess.map((t, i) => (
            <li key={i} className="editable-list__row">
              <input
                className="input"
                value={t.tool}
                placeholder="Tool / system identifier"
                onChange={(e) => {
                  const next = d.toolAccess.slice();
                  next[i] = { ...t, tool: e.target.value };
                  onUpdate({ toolAccess: next }, "Edit tool access");
                }}
              />
              <select
                className="select select--narrow"
                value={t.scope}
                onChange={(e) => {
                  const next = d.toolAccess.slice();
                  next[i] = {
                    ...t,
                    scope: e.target
                      .value as DelegationContract["toolAccess"][number]["scope"],
                  };
                  onUpdate({ toolAccess: next }, "Edit tool scope");
                }}
              >
                {SCOPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                aria-label="Remove tool"
                onClick={() => {
                  const next = d.toolAccess.slice();
                  next.splice(i, 1);
                  onUpdate({ toolAccess: next }, "Remove tool access");
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
              onClick={() =>
                onUpdate(
                  {
                    toolAccess: [
                      ...d.toolAccess,
                      { tool: "", scope: "read" as const },
                    ],
                  },
                  "Add tool access"
                )
              }
            >
              + Add tool
            </button>
          </li>
        </ul>
      </section>

      <label className="form-field">
        <span className="form-field__label">Spend budget (optional)</span>
        <input
          className="input"
          type="number"
          min={0}
          step={100}
          placeholder="0"
          value={d.spendBudget ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") {
              onUpdate({ spendBudget: undefined }, "Clear spend budget");
              return;
            }
            const n = Number.parseFloat(v);
            if (!Number.isNaN(n))
              onUpdate({ spendBudget: n }, "Edit spend budget");
          }}
        />
      </label>
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
