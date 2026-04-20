"use client";

import { useMemo, useState } from "react";
import type {
  Graph,
  PodProtocol,
  RoleTemplate,
} from "@ixo-studio/core/schema";
import type { GraphPatch, NodePatch } from "@ixo-studio/core/store";

type Props = {
  graph: Graph;
  onPatch: (patch: GraphPatch) => void;
};

const ROLE_CLASSES: RoleTemplate["class"][] = ["human", "agent", "hybrid"];
const AGENT_CLASSES: NonNullable<RoleTemplate["agentClass"]>[] = [
  "orchestration",
  "service",
  "copilot",
];

type ClassFilter = "all" | RoleTemplate["class"];

const newNodeId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function RolesView({ graph, onPatch }: Props) {
  const [filter, setFilter] = useState<ClassFilter>("all");
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

  const filteredRoles = useMemo(
    () => (filter === "all" ? roles : roles.filter((r) => r.class === filter)),
    [roles, filter]
  );

  if (pods.length === 0) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">No PODs yet</div>
          <h3 className="canvas-empty__title">Compose PODs before roles.</h3>
          <p className="canvas-empty__body">
            Roles bundle accountabilities inside PODs — so PODs need to exist
            first. Add at least one POD, then return here.
          </p>
        </div>
      </div>
    );
  }

  const update = (
    role: RoleTemplate,
    patch: Partial<RoleTemplate>,
    rationale: string
  ) =>
    onPatch({
      id: patchId(),
      source: "user",
      rationale,
      ops: [{ op: "update-node", id: role.id, patch }],
    });

  const addRole = (cls: RoleTemplate["class"]) => {
    const role: RoleTemplate = {
      id: newNodeId("role"),
      kind: "role",
      name: `New ${cls} role`,
      class: cls,
      ...(cls === "agent" ? { agentClass: "service" } : {}),
      purpose: "",
      capabilities: [],
      accountabilities: [],
      decisionRights: [],
      incumbentCount: 0,
    };
    onPatch({
      id: patchId(),
      source: "user",
      rationale: "Add role",
      ops: [{ op: "add-node", node: role }],
    });
  };

  const removeRole = (role: RoleTemplate) => {
    // Also strip the role ID from any POD that references it so we don't
    // leave stale references.
    const ops: NodePatch[] = [{ op: "remove-node", id: role.id }];
    for (const pod of pods) {
      const inHumans = pod.humanRoleIds.includes(role.id);
      const inAgents = pod.agentRoleIds.includes(role.id);
      if (!inHumans && !inAgents) continue;
      ops.push({
        op: "update-node",
        id: pod.id,
        patch: {
          humanRoleIds: inHumans
            ? pod.humanRoleIds.filter((id) => id !== role.id)
            : pod.humanRoleIds,
          agentRoleIds: inAgents
            ? pod.agentRoleIds.filter((id) => id !== role.id)
            : pod.agentRoleIds,
        } as never,
      });
    }
    onPatch({
      id: patchId(),
      source: "user",
      rationale: `Remove role "${role.name}"`,
      ops,
    });
  };

  const suggestMore = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compile/compose-roles", {
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
      // Only accept add-node ops here; update-node ops would clobber any POD
      // role-assignment edits the user has already made.
      const ops = json.patch.ops.filter((o) => o.op === "add-node");
      if (ops.length === 0) {
        setError("AI returned no new roles to add.");
        return;
      }
      onPatch({
        id: patchId(),
        source: "copilot",
        rationale: json.patch.rationale ?? "Suggested additional roles",
        ops,
      });
    } catch (err) {
      console.error("[suggest roles] failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const podsOwning = (roleId: string) =>
    pods.filter(
      (p) =>
        p.humanRoleIds.includes(roleId) || p.agentRoleIds.includes(roleId)
    );

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Role lattice</div>
          <p className="form-toolbar__lead">
            Purpose-led role bundles. Human roles anchor judgment, agent roles
            carry delegated autonomy, hybrid roles span both. A POD without a
            human role is an invariant violation.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => addRole("human")}
          >
            + Human
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => addRole("agent")}
          >
            + Agent
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => addRole("hybrid")}
          >
            + Hybrid
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

      <div className="chip-row" style={{ paddingBottom: 4 }}>
        {(["all", "human", "agent", "hybrid"] as const).map((c) => (
          <button
            type="button"
            key={c}
            className={`chip${filter === c ? " chip--on" : ""}`}
            onClick={() => setFilter(c)}
          >
            {c}
            <span style={{ marginLeft: 8, color: "var(--ink-3)" }}>
              {c === "all"
                ? roles.length
                : roles.filter((r) => r.class === c).length}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      {filteredRoles.length === 0 ? (
        <div className="form-empty">
          {roles.length === 0
            ? "No roles yet. Add one manually or ask the AI."
            : `No ${filter} roles yet.`}
        </div>
      ) : (
        <div className="card-grid">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              roles={roles}
              podsOwning={podsOwning(role.id)}
              onUpdate={(patch, rationale) => update(role, patch, rationale)}
              onRemove={() => removeRole(role)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleCard({
  role,
  roles,
  podsOwning,
  onUpdate,
  onRemove,
}: {
  role: RoleTemplate;
  roles: RoleTemplate[];
  podsOwning: PodProtocol[];
  onUpdate: (patch: Partial<RoleTemplate>, rationale: string) => void;
  onRemove: () => void;
}) {
  return (
    <article className="role-card" data-role-class={role.class}>
      <div className="pod-card__header">
        <span
          className={`role-badge role-badge--${role.class}`}
          aria-label={`${role.class} role`}
        >
          {role.class}
        </span>
        <input
          className="input loop-card__name"
          value={role.name}
          onChange={(e) =>
            onUpdate({ name: e.target.value }, "Edit role name")
          }
          placeholder="Role name"
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Remove role"
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
          value={role.purpose}
          onChange={(e) =>
            onUpdate({ purpose: e.target.value }, "Edit role purpose")
          }
          placeholder="What this role exists to do"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span className="form-field__label">Class</span>
          <select
            className="select"
            value={role.class}
            onChange={(e) => {
              const next = e.target.value as RoleTemplate["class"];
              const patch: Partial<RoleTemplate> = { class: next };
              // Keep agentClass consistent: required when class=agent,
              // forbidden when class=human.
              if (next === "human") patch.agentClass = undefined;
              if (next === "agent" && !role.agentClass)
                patch.agentClass = "service";
              onUpdate(patch, "Change role class");
            }}
          >
            {ROLE_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {role.class !== "human" && (
          <label className="form-field">
            <span className="form-field__label">Agent class</span>
            <select
              className="select"
              value={role.agentClass ?? ""}
              onChange={(e) =>
                onUpdate(
                  {
                    agentClass:
                      (e.target.value as RoleTemplate["agentClass"]) ||
                      undefined,
                  },
                  "Edit agent class"
                )
              }
            >
              {role.class === "hybrid" && <option value="">—</option>}
              {AGENT_CLASSES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <StringList
        label="Accountabilities"
        values={role.accountabilities}
        placeholder="What this role is on the hook for"
        onChange={(next) =>
          onUpdate({ accountabilities: next }, "Edit accountabilities")
        }
      />
      <StringList
        label="Decision rights"
        values={role.decisionRights}
        placeholder="What this role can decide unilaterally"
        onChange={(next) =>
          onUpdate({ decisionRights: next }, "Edit decision rights")
        }
      />

      <label className="form-field">
        <span className="form-field__label">Escalates to</span>
        <select
          className="select"
          value={role.escalationToRoleId ?? ""}
          onChange={(e) =>
            onUpdate(
              {
                escalationToRoleId:
                  e.target.value === "" ? undefined : e.target.value,
              },
              "Edit escalation target"
            )
          }
        >
          <option value="">— no escalation</option>
          {roles
            .filter((r) => r.id !== role.id)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.class})
              </option>
            ))}
        </select>
      </label>

      <div>
        <div className="form-field__label" style={{ marginBottom: 6 }}>
          Assigned to PODs
        </div>
        <div className="chip-row">
          {podsOwning.length === 0 ? (
            <span className="chip chip--muted">
              Not assigned — toggle on a POD card
            </span>
          ) : (
            podsOwning.map((p) => (
              <span key={p.id} className="chip chip--on" title={p.purpose}>
                {p.name}
              </span>
            ))
          )}
        </div>
      </div>
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
