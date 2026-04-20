"use client";

import { useMemo, useState } from "react";
import type {
  Checkpoint,
  DelegationContract,
  GovernancePolicy,
  Graph,
  Node,
  PodProtocol,
  RoleTemplate,
} from "@ixo-studio/core/schema";
import type { GraphPatch, NodePatch } from "@ixo-studio/core/store";

type Props = {
  graph: Graph;
  onPatch: (patch: GraphPatch) => void;
};

const REVERSIBILITIES: Checkpoint["reversibility"][] = [
  "reversible",
  "partially-reversible",
  "irreversible",
];
const ENFORCEMENTS: GovernancePolicy["enforcement"][] = ["advisory", "blocking"];

const newNodeId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function GovernanceView({ graph, onPatch }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is RoleTemplate => n.kind === "role"
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
  const delegations = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is DelegationContract => n.kind === "delegation"
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
  const policies = useMemo(
    () =>
      Object.values(graph.nodes).filter(
        (n): n is GovernancePolicy => n.kind === "policy"
      ),
    [graph]
  );

  const approverOptions = useMemo(
    () => roles.filter((r) => r.class === "human" || r.class === "hybrid"),
    [roles]
  );

  const policyTargets = useMemo(() => {
    const list: { id: string; label: string; kind: Node["kind"] }[] = [];
    for (const p of pods) list.push({ id: p.id, label: p.name, kind: "pod" });
    for (const d of delegations)
      list.push({
        id: d.id,
        label: d.mandate || `delegation ${d.id.slice(-4)}`,
        kind: "delegation",
      });
    for (const r of roles) list.push({ id: r.id, label: r.name, kind: "role" });
    return list;
  }, [pods, delegations, roles]);

  const update = (
    id: string,
    patch: Partial<Checkpoint> | Partial<GovernancePolicy>,
    rationale: string
  ) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale,
      ops: [{ op: "update-node", id, patch: patch as never }],
    });

  const addCheckpoint = () => {
    const checkpoint: Checkpoint = {
      id: newNodeId("cp"),
      kind: "checkpoint",
      name: "New checkpoint",
      actionScope: "",
      reversibility: "reversible",
      requiresHumanApproval: false,
      auditRequired: true,
    };
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Add checkpoint",
      ops: [{ op: "add-node", node: checkpoint }],
    });
  };

  const removeCheckpoint = (cp: Checkpoint) => {
    // Also strip the reference from any delegation pointing at this checkpoint.
    const ops: NodePatch[] = [{ op: "remove-node", id: cp.id }];
    for (const d of delegations) {
      if (d.checkpointPolicyId === cp.id) {
        ops.push({
          op: "update-node",
          id: d.id,
          patch: { checkpointPolicyId: undefined } as never,
        });
      }
    }
    onPatch({
      id: patchId(),
      source: "user",
      rationale: `Remove checkpoint "${cp.name}"`,
      ops,
    });
  };

  const addPolicy = () => {
    const policy: GovernancePolicy = {
      id: newNodeId("pol"),
      kind: "policy",
      name: "New policy",
      statement: "",
      appliesToNodeIds: [],
      enforcement: "blocking",
    };
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Add policy",
      ops: [{ op: "add-node", node: policy }],
    });
  };

  const removePolicy = (p: GovernancePolicy) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale: `Remove policy "${p.name}"`,
      ops: [{ op: "remove-node", id: p.id }],
    });

  const suggestMore = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compile/synthesize-governance", {
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
      // Accept add-node + the checkpoint-link update-node ops so AI suggestions
      // can still wire checkpoints into existing delegations, but not clobber
      // other node edits.
      const ops = json.patch.ops.filter((o) => {
        if (o.op === "add-node") return true;
        if (o.op === "update-node") {
          const keys = Object.keys(
            (o as { patch: Record<string, unknown> }).patch
          );
          return keys.length === 1 && keys[0] === "checkpointPolicyId";
        }
        return false;
      });
      if (ops.length === 0) {
        setError("AI returned no new governance to add.");
        return;
      }
      onPatch({
        id: patchId(),
        source: "copilot",
        rationale: json.patch.rationale ?? "Suggested additional governance",
        ops,
      });
    } catch (err) {
      console.error("[suggest governance] failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Governance control plane</div>
          <p className="form-toolbar__lead">
            Checkpoints gate irreversible action with human approval and
            audit. Policies bind nodes to statements that can be advisory or
            blocking.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={addCheckpoint}
          >
            + Checkpoint
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={addPolicy}
          >
            + Policy
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

      <section className="governance-section">
        <h3 className="governance-section__title">Checkpoints</h3>
        {checkpoints.length === 0 ? (
          <div className="form-empty">
            No checkpoints yet. Irreversible actions should always be gated.
          </div>
        ) : (
          <div className="card-grid">
            {checkpoints.map((cp) => (
              <CheckpointCard
                key={cp.id}
                checkpoint={cp}
                approverOptions={approverOptions}
                onUpdate={(patch, rationale) => update(cp.id, patch, rationale)}
                onRemove={() => removeCheckpoint(cp)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="governance-section">
        <h3 className="governance-section__title">Policies</h3>
        {policies.length === 0 ? (
          <div className="form-empty">
            No policies yet — add binding or advisory guardrails.
          </div>
        ) : (
          <div className="card-grid">
            {policies.map((p) => (
              <PolicyCard
                key={p.id}
                policy={p}
                targets={policyTargets}
                onUpdate={(patch, rationale) => update(p.id, patch, rationale)}
                onRemove={() => removePolicy(p)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CheckpointCard({
  checkpoint: cp,
  approverOptions,
  onUpdate,
  onRemove,
}: {
  checkpoint: Checkpoint;
  approverOptions: RoleTemplate[];
  onUpdate: (patch: Partial<Checkpoint>, rationale: string) => void;
  onRemove: () => void;
}) {
  const needsApprover =
    cp.requiresHumanApproval && !cp.approverRoleId;
  const irreversibleWithoutApproval =
    cp.reversibility === "irreversible" && !cp.requiresHumanApproval;

  return (
    <article
      className={`checkpoint-card checkpoint-card--${cp.reversibility}${
        needsApprover || irreversibleWithoutApproval
          ? " checkpoint-card--warn"
          : ""
      }`}
    >
      <div className="pod-card__header">
        <span
          className={`role-badge reversibility-badge reversibility-badge--${cp.reversibility}`}
        >
          {cp.reversibility}
        </span>
        <input
          className="input loop-card__name"
          value={cp.name}
          placeholder="Checkpoint name"
          onChange={(e) =>
            onUpdate({ name: e.target.value }, "Edit checkpoint name")
          }
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Remove checkpoint"
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <label className="form-field">
        <span className="form-field__label">Action scope</span>
        <textarea
          className="textarea"
          rows={2}
          value={cp.actionScope}
          placeholder="Which actions this checkpoint gates"
          onChange={(e) =>
            onUpdate({ actionScope: e.target.value }, "Edit action scope")
          }
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Reversibility</span>
          <select
            className="select"
            value={cp.reversibility}
            onChange={(e) =>
              onUpdate(
                { reversibility: e.target.value as Checkpoint["reversibility"] },
                "Edit reversibility"
              )
            }
          >
            {REVERSIBILITIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="form-field__label">Approver</span>
          <select
            className="select"
            value={cp.approverRoleId ?? ""}
            onChange={(e) =>
              onUpdate(
                {
                  approverRoleId:
                    e.target.value === "" ? undefined : e.target.value,
                },
                "Edit approver"
              )
            }
          >
            <option value="">— none</option>
            {approverOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.class})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={cp.requiresHumanApproval}
            onChange={(e) =>
              onUpdate(
                { requiresHumanApproval: e.target.checked },
                "Toggle human approval"
              )
            }
          />
          <span>Requires human approval</span>
        </label>
        <label className="toggle-field">
          <input
            type="checkbox"
            checked={cp.auditRequired}
            onChange={(e) =>
              onUpdate(
                { auditRequired: e.target.checked },
                "Toggle audit requirement"
              )
            }
          />
          <span>Audit required</span>
        </label>
      </div>

      {(needsApprover || irreversibleWithoutApproval) && (
        <ul className="delegation-warnings">
          {needsApprover && (
            <li>
              Approval required but no approver chosen — the check is toothless.
            </li>
          )}
          {irreversibleWithoutApproval && (
            <li>
              Irreversible action scope without human approval — consider
              requiring one.
            </li>
          )}
        </ul>
      )}
    </article>
  );
}

function PolicyCard({
  policy: p,
  targets,
  onUpdate,
  onRemove,
}: {
  policy: GovernancePolicy;
  targets: { id: string; label: string; kind: Node["kind"] }[];
  onUpdate: (patch: Partial<GovernancePolicy>, rationale: string) => void;
  onRemove: () => void;
}) {
  const appliedSet = new Set(p.appliesToNodeIds);
  const toggle = (id: string) => {
    const next = appliedSet.has(id)
      ? p.appliesToNodeIds.filter((x) => x !== id)
      : [...p.appliesToNodeIds, id];
    onUpdate({ appliesToNodeIds: next }, "Edit policy scope");
  };

  return (
    <article
      className={`policy-card policy-card--${p.enforcement}`}
      data-enforcement={p.enforcement}
    >
      <div className="pod-card__header">
        <span
          className={`role-badge enforcement-badge enforcement-badge--${p.enforcement}`}
        >
          {p.enforcement}
        </span>
        <input
          className="input loop-card__name"
          value={p.name}
          placeholder="Policy name"
          onChange={(e) =>
            onUpdate({ name: e.target.value }, "Edit policy name")
          }
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Remove policy"
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <label className="form-field">
        <span className="form-field__label">Statement</span>
        <textarea
          className="textarea"
          rows={3}
          value={p.statement}
          placeholder="The rule this policy enforces"
          onChange={(e) =>
            onUpdate({ statement: e.target.value }, "Edit policy statement")
          }
        />
      </label>

      <label className="form-field">
        <span className="form-field__label">Enforcement</span>
        <select
          className="select"
          value={p.enforcement}
          onChange={(e) =>
            onUpdate(
              { enforcement: e.target.value as GovernancePolicy["enforcement"] },
              "Edit policy enforcement"
            )
          }
        >
          {ENFORCEMENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="form-field__label" style={{ marginBottom: 6 }}>
          Applies to
        </div>
        <div className="chip-row">
          {targets.length === 0 ? (
            <span className="chip chip--muted">
              No PODs, delegations, or roles to target yet
            </span>
          ) : (
            targets.map((t) => {
              const on = appliedSet.has(t.id);
              return (
                <button
                  type="button"
                  key={t.id}
                  className={`chip${on ? " chip--on" : ""}`}
                  onClick={() => toggle(t.id)}
                >
                  {t.label}
                  <span style={{ marginLeft: 6, color: "var(--ink-3)" }}>
                    {t.kind}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </article>
  );
}
