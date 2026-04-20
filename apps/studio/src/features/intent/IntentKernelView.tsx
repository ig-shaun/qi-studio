"use client";

import { useMemo, useState } from "react";
import type { Graph, IntentKernel } from "@ixo-studio/core/schema";
import type { GraphPatch } from "@ixo-studio/core/store";
import { ReparseModal } from "./ReparseModal";

type Props = {
  graph: Graph;
  onPatch: (patch: GraphPatch) => void;
};

const HORIZONS: IntentKernel["horizon"][] = ["90d", "1y", "3y"];
const ADAPTABILITY: IntentKernel["adaptabilityTarget"][] = [
  "stable",
  "adaptive",
  "highly-adaptive",
];
const CONSTRAINT_KINDS: IntentKernel["constraints"][number]["kind"][] = [
  "regulatory",
  "ethical",
  "resource",
  "technical",
  "strategic",
];
const STAKEHOLDER_KINDS: IntentKernel["stakeholders"][number]["kind"][] = [
  "customer",
  "beneficiary",
  "regulator",
  "partner",
  "internal",
];

const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function IntentKernelView({ graph, onPatch }: Props) {
  const [reparseOpen, setReparseOpen] = useState(false);
  const intent = useMemo(
    () =>
      Object.values(graph.nodes).find(
        (n): n is IntentKernel => n.kind === "intent"
      ),
    [graph]
  );

  if (!intent) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">No intent yet</div>
          <h3 className="canvas-empty__title">Generate one first.</h3>
          <p className="canvas-empty__body">
            The Intent Kernel anchors every other view. Use Generate with AI to
            seed it from a purpose statement, then refine it here.
          </p>
        </div>
      </div>
    );
  }

  const update = (patch: Partial<IntentKernel>, rationale: string) => {
    onPatch({
      id: patchId(),
      source: "user",
      rationale,
      ops: [{ op: "update-node", id: intent.id, patch }],
    });
  };

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Intent kernel</div>
          <p className="form-toolbar__lead">
            Edit the source-of-truth that every other view compiles from.
            Changes flow through the graph immediately and re-validate
            invariants.
          </p>
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setReparseOpen(true)}
        >
          <span className="button__dot" />
          Re-parse with AI
        </button>
      </header>

      {reparseOpen && (
        <ReparseModal
          intent={intent}
          onPatch={onPatch}
          onClose={() => setReparseOpen(false)}
        />
      )}

      <Section
        title="Purpose"
        eyebrow="Why this exists"
        help="One sentence. Reads as a verb-led commitment, not a slogan."
      >
        <textarea
          className="textarea"
          rows={3}
          value={intent.purpose}
          onChange={(e) => update({ purpose: e.target.value }, "Edit purpose")}
        />
      </Section>

      <Section title="Horizon & adaptability" eyebrow="Time and posture">
        <div className="form-row">
          <Field label="Horizon">
            <select
              className="select"
              value={intent.horizon}
              onChange={(e) =>
                update(
                  { horizon: e.target.value as IntentKernel["horizon"] },
                  "Edit horizon"
                )
              }
            >
              {HORIZONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Adaptability target">
            <select
              className="select"
              value={intent.adaptabilityTarget}
              onChange={(e) =>
                update(
                  {
                    adaptabilityTarget: e.target
                      .value as IntentKernel["adaptabilityTarget"],
                  },
                  "Edit adaptability"
                )
              }
            >
              {ADAPTABILITY.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section
        title="Outcomes"
        eyebrow="What 'success' looks like"
        help="Concrete results the organism is accountable for."
        onAdd={() =>
          update(
            {
              outcomes: [
                ...intent.outcomes,
                { id: newId("out"), statement: "" },
              ],
            },
            "Add outcome"
          )
        }
      >
        <ul className="editable-list">
          {intent.outcomes.map((o, i) => (
            <li key={o.id} className="editable-list__row">
              <input
                className="input"
                placeholder="Outcome statement"
                value={o.statement}
                onChange={(e) =>
                  update(
                    {
                      outcomes: replaceAt(intent.outcomes, i, {
                        ...o,
                        statement: e.target.value,
                      }),
                    },
                    "Edit outcome"
                  )
                }
              />
              <input
                className="input input--narrow"
                placeholder="Metric (optional)"
                value={o.metric ?? ""}
                onChange={(e) =>
                  update(
                    {
                      outcomes: replaceAt(intent.outcomes, i, {
                        ...o,
                        ...(e.target.value
                          ? { metric: e.target.value }
                          : { metric: undefined }),
                      }),
                    },
                    "Edit outcome metric"
                  )
                }
              />
              <RemoveButton
                onClick={() =>
                  update(
                    { outcomes: removeAt(intent.outcomes, i) },
                    "Remove outcome"
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Sovereignty zones"
        eyebrow="Non-delegable judgment"
        help="Decisions a named human must always retain. At least one is required."
        onAdd={() =>
          update(
            {
              sovereigntyZones: [
                ...intent.sovereigntyZones,
                {
                  id: newId("sov"),
                  name: "",
                  description: "",
                  nonDelegable: true,
                },
              ],
            },
            "Add sovereignty zone"
          )
        }
      >
        <ul className="editable-list editable-list--stacked">
          {intent.sovereigntyZones.map((z, i) => (
            <li key={z.id} className="editable-list__row editable-list__row--stacked">
              <div className="editable-list__row">
                <input
                  className="input input--narrow"
                  placeholder="Zone name"
                  value={z.name}
                  onChange={(e) =>
                    update(
                      {
                        sovereigntyZones: replaceAt(
                          intent.sovereigntyZones,
                          i,
                          { ...z, name: e.target.value }
                        ),
                      },
                      "Edit sovereignty zone name"
                    )
                  }
                />
                <RemoveButton
                  onClick={() =>
                    update(
                      {
                        sovereigntyZones: removeAt(intent.sovereigntyZones, i),
                      },
                      "Remove sovereignty zone"
                    )
                  }
                />
              </div>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Why this judgment must stay with a human"
                value={z.description}
                onChange={(e) =>
                  update(
                    {
                      sovereigntyZones: replaceAt(
                        intent.sovereigntyZones,
                        i,
                        { ...z, description: e.target.value }
                      ),
                    },
                    "Edit sovereignty zone description"
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Constraints"
        eyebrow="Hard limits"
        onAdd={() =>
          update(
            {
              constraints: [
                ...intent.constraints,
                { id: newId("con"), statement: "", kind: "regulatory" },
              ],
            },
            "Add constraint"
          )
        }
      >
        <ul className="editable-list">
          {intent.constraints.map((c, i) => (
            <li key={c.id} className="editable-list__row">
              <select
                className="select select--narrow"
                value={c.kind}
                onChange={(e) =>
                  update(
                    {
                      constraints: replaceAt(intent.constraints, i, {
                        ...c,
                        kind: e.target
                          .value as IntentKernel["constraints"][number]["kind"],
                      }),
                    },
                    "Edit constraint kind"
                  )
                }
              >
                {CONSTRAINT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Constraint statement"
                value={c.statement}
                onChange={(e) =>
                  update(
                    {
                      constraints: replaceAt(intent.constraints, i, {
                        ...c,
                        statement: e.target.value,
                      }),
                    },
                    "Edit constraint"
                  )
                }
              />
              <RemoveButton
                onClick={() =>
                  update(
                    { constraints: removeAt(intent.constraints, i) },
                    "Remove constraint"
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Principles"
        eyebrow="Heuristics for judgment"
        onAdd={() =>
          update(
            {
              principles: [
                ...intent.principles,
                { id: newId("prn"), statement: "" },
              ],
            },
            "Add principle"
          )
        }
      >
        <ul className="editable-list">
          {intent.principles.map((p, i) => (
            <li key={p.id} className="editable-list__row">
              <input
                className="input"
                placeholder="Principle"
                value={p.statement}
                onChange={(e) =>
                  update(
                    {
                      principles: replaceAt(intent.principles, i, {
                        ...p,
                        statement: e.target.value,
                      }),
                    },
                    "Edit principle"
                  )
                }
              />
              <RemoveButton
                onClick={() =>
                  update(
                    { principles: removeAt(intent.principles, i) },
                    "Remove principle"
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Stakeholders"
        eyebrow="Who depends on this"
        onAdd={() =>
          update(
            {
              stakeholders: [
                ...intent.stakeholders,
                { id: newId("stk"), label: "", kind: "customer" },
              ],
            },
            "Add stakeholder"
          )
        }
      >
        <ul className="editable-list">
          {intent.stakeholders.map((s, i) => (
            <li key={s.id} className="editable-list__row">
              <select
                className="select select--narrow"
                value={s.kind}
                onChange={(e) =>
                  update(
                    {
                      stakeholders: replaceAt(intent.stakeholders, i, {
                        ...s,
                        kind: e.target
                          .value as IntentKernel["stakeholders"][number]["kind"],
                      }),
                    },
                    "Edit stakeholder kind"
                  )
                }
              >
                {STAKEHOLDER_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Stakeholder label"
                value={s.label}
                onChange={(e) =>
                  update(
                    {
                      stakeholders: replaceAt(intent.stakeholders, i, {
                        ...s,
                        label: e.target.value,
                      }),
                    },
                    "Edit stakeholder"
                  )
                }
              />
              <RemoveButton
                onClick={() =>
                  update(
                    { stakeholders: removeAt(intent.stakeholders, i) },
                    "Remove stakeholder"
                  )
                }
              />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  eyebrow,
  help,
  onAdd,
  children,
}: {
  title: string;
  eyebrow?: string;
  help?: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <header className="form-section__header">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h3 className="form-section__title">{title}</h3>
          {help && <p className="form-section__help">{help}</p>}
        </div>
        {onAdd && (
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={onAdd}
          >
            + Add
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      {children}
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label="Remove"
      onClick={onClick}
    >
      ×
    </button>
  );
}

function replaceAt<T>(arr: T[], i: number, next: T): T[] {
  const out = arr.slice();
  out[i] = next;
  return out;
}

function removeAt<T>(arr: T[], i: number): T[] {
  const out = arr.slice();
  out.splice(i, 1);
  return out;
}
