"use client";

import type { ReactNode } from "react";
import type { Graph, Node } from "@ixo-studio/core/schema";

type Props = {
  graph: Graph;
  selectedId?: string | undefined;
};

export function Inspector({ graph, selectedId }: Props) {
  const node: Node | undefined = selectedId ? graph.nodes[selectedId] : undefined;

  if (!node) return <OverviewInspector graph={graph} />;

  return (
    <aside className="inspector-panel">
      <NodeInspector node={node} graph={graph} />
    </aside>
  );
}

function OverviewInspector({ graph }: { graph: Graph }) {
  const intent = Object.values(graph.nodes).find((n) => n.kind === "intent");
  const loops = Object.values(graph.nodes).filter((n) => n.kind === "valueLoop");
  const pods = Object.values(graph.nodes).filter((n) => n.kind === "pod");
  const roles = Object.values(graph.nodes).filter((n) => n.kind === "role");
  const delegations = Object.values(graph.nodes).filter(
    (n) => n.kind === "delegation"
  );
  const checkpoints = Object.values(graph.nodes).filter(
    (n) => n.kind === "checkpoint"
  );

  if (!intent) {
    return (
      <aside className="inspector-panel">
        <Section title="Select a node">
          <p className="inspector-lead">
            Run Generate with AI to compile an intent, then click any sector on
            the organism to inspect it.
          </p>
        </Section>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      <Section title="Overview">
        <div className="eyebrow">Intent</div>
        <p className="inspector-lead">{intent.purpose}</p>
      </Section>
      <Section title="Composition">
        <Field label="Value loops">{loops.length}</Field>
        <Field label="PODs">{pods.length}</Field>
        <Field label="Roles">{roles.length}</Field>
        <Field label="Delegations">{delegations.length}</Field>
        <Field label="Checkpoints">{checkpoints.length}</Field>
      </Section>
      <Section title="Sovereignty zones">
        {intent.sovereigntyZones.length === 0 ? (
          <p className="inspector-lead">None declared.</p>
        ) : (
          <ul className="inspector-list">
            {intent.sovereigntyZones.map((z) => (
              <li key={z.id}>
                <strong>{z.name}.</strong> {z.description}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </aside>
  );
}

function NodeInspector({ node, graph }: { node: Node; graph: Graph }) {
  switch (node.kind) {
    case "intent":
      return (
        <>
          <Section title={node.purpose}>
            <div className="eyebrow">Intent Kernel</div>
          </Section>
          <Section title="Horizon">
            <Field label="Time horizon">{node.horizon}</Field>
            <Field label="Adaptability">{node.adaptabilityTarget}</Field>
          </Section>
          <Section title="Outcomes">
            <ul className="inspector-list">
              {node.outcomes.map((o) => (
                <li key={o.id}>{o.statement}</li>
              ))}
            </ul>
          </Section>
          <Section title="Sovereignty zones">
            <ul className="inspector-list">
              {node.sovereigntyZones.map((z) => (
                <li key={z.id}>
                  <strong>{z.name}.</strong> {z.description}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Principles">
            <ul className="inspector-list">
              {node.principles.map((p) => (
                <li key={p.id}>{p.statement}</li>
              ))}
            </ul>
          </Section>
          <Section title="Constraints">
            <ul className="inspector-list">
              {node.constraints.map((c) => (
                <li key={c.id}>
                  <span className="tag" style={{ marginRight: 8 }}>
                    {c.kind}
                  </span>
                  {c.statement}
                </li>
              ))}
            </ul>
          </Section>
        </>
      );
    case "valueLoop":
      return (
        <>
          <Section title={node.name}>
            <div className="eyebrow">Value loop</div>
            <p className="inspector-lead">{node.purpose}</p>
          </Section>
          <Section title="Operating">
            <Field label="Criticality">
              <span className={`tag${node.criticality === "high" ? " tag--alert" : ""}`}>
                {node.criticality}
              </span>
            </Field>
            {node.requiredLatency && (
              <Field label="Latency">{node.requiredLatency}</Field>
            )}
          </Section>
          {node.triggerSignals.length > 0 && (
            <Section title="Triggers">
              <ul className="inspector-list">
                {node.triggerSignals.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </Section>
          )}
          {node.outputs.length > 0 && (
            <Section title="Outputs">
              <ul className="inspector-list">
                {node.outputs.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      );
    case "pod": {
      const load = node.accountabilities.reduce(
        (sum, a) => sum + (a.complexityWeight ?? 1),
        0
      );
      const overloaded = load > node.cognitiveLoadBudget;
      const humans = node.humanRoleIds
        .map((id) => graph.nodes[id])
        .filter((n): n is Extract<Node, { kind: "role" }> => !!n && n.kind === "role");
      const agents = node.agentRoleIds
        .map((id) => graph.nodes[id])
        .filter((n): n is Extract<Node, { kind: "role" }> => !!n && n.kind === "role");
      return (
        <>
          <Section title={node.name}>
            <div className="eyebrow">POD — {node.podType}</div>
            <p className="inspector-lead">{node.purpose}</p>
          </Section>
          <Section title="Cognitive load">
            <Field label="Load / budget">
              <span className={overloaded ? "tag tag--alert" : "tag"}>
                {load} / {node.cognitiveLoadBudget}
                {overloaded ? " — overload" : ""}
              </span>
            </Field>
          </Section>
          {node.accountabilities.length > 0 && (
            <Section title="Accountabilities">
              <ul className="inspector-list">
                {node.accountabilities.map((a) => (
                  <li key={a.id}>
                    {a.statement}
                    <span className="tag" style={{ marginLeft: 8 }}>
                      w{a.complexityWeight}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {humans.length > 0 && (
            <Section title="Human roles">
              <ul className="inspector-list">
                {humans.map((r) => (
                  <li key={r.id}>{r.name}</li>
                ))}
              </ul>
            </Section>
          )}
          {agents.length > 0 && (
            <Section title="Agent roles">
              <ul className="inspector-list">
                {agents.map((r) => (
                  <li key={r.id}>
                    {r.name}
                    {r.agentClass && (
                      <span className="tag" style={{ marginLeft: 8 }}>
                        {r.agentClass}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {node.localDecisions.length > 0 && (
            <Section title="Local decisions">
              <ul className="inspector-list">
                {node.localDecisions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </Section>
          )}
          {node.escalatedDecisions.length > 0 && (
            <Section title="Escalated decisions">
              <ul className="inspector-list">
                {node.escalatedDecisions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      );
    }
    case "role":
      return (
        <>
          <Section title={node.name}>
            <div className="eyebrow">Role — {node.class}{node.agentClass ? ` · ${node.agentClass}` : ""}</div>
            <p className="inspector-lead">{node.purpose}</p>
          </Section>
          {node.accountabilities.length > 0 && (
            <Section title="Accountabilities">
              <ul className="inspector-list">
                {node.accountabilities.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </Section>
          )}
          {node.decisionRights.length > 0 && (
            <Section title="Decision rights">
              <ul className="inspector-list">
                {node.decisionRights.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      );
    case "delegation":
      return (
        <>
          <Section title={node.mandate}>
            <div className="eyebrow">Delegation contract</div>
          </Section>
          <Section title="Autonomy">
            <Field label="Level">
              <span className="tag">{node.autonomyLevel}</span>
            </Field>
            <Field label="Supervisor">{roleName(graph, node.supervisingHumanRoleId)}</Field>
            <Field label="Agent">{roleName(graph, node.delegatedAgentRoleId)}</Field>
            {node.checkpointPolicyId && (
              <Field label="Checkpoint">
                {checkpointName(graph, node.checkpointPolicyId)}
              </Field>
            )}
          </Section>
          {node.allowedActions.length > 0 && (
            <Section title="Allowed">
              <ul className="inspector-list">
                {node.allowedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </Section>
          )}
          {node.forbiddenActions.length > 0 && (
            <Section title="Forbidden">
              <ul className="inspector-list">
                {node.forbiddenActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      );
    case "checkpoint":
      return (
        <>
          <Section title={node.name}>
            <div className="eyebrow">Checkpoint</div>
          </Section>
          <Section title="Control">
            <Field label="Action scope">{node.actionScope}</Field>
            <Field label="Reversibility">
              <span
                className={`tag${node.reversibility === "irreversible" ? " tag--alert" : ""}`}
              >
                {node.reversibility}
              </span>
            </Field>
            <Field label="Human approval">
              {node.requiresHumanApproval ? "Required" : "Not required"}
            </Field>
            {node.approverRoleId && (
              <Field label="Approver">
                {roleName(graph, node.approverRoleId)}
              </Field>
            )}
            <Field label="Audit">{node.auditRequired ? "Required" : "—"}</Field>
          </Section>
        </>
      );
    case "policy":
      return (
        <>
          <Section title={node.name}>
            <div className="eyebrow">Policy</div>
            <p className="inspector-lead">{node.statement}</p>
          </Section>
          <Section title="Enforcement">
            <Field label="Enforcement">
              <span
                className={`tag${node.enforcement === "blocking" ? " tag--alert" : ""}`}
              >
                {node.enforcement}
              </span>
            </Field>
          </Section>
        </>
      );
  }
}

function roleName(graph: Graph, id: string): string {
  const n = graph.nodes[id];
  return n && n.kind === "role" ? n.name : id;
}

function checkpointName(graph: Graph, id: string): string {
  const n = graph.nodes[id];
  return n && n.kind === "checkpoint" ? n.name : id;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="inspector-section">
      <h3 className="inspector-section__title">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="inspector-field">
      <span className="inspector-field__label">{label}</span>
      <span className="inspector-field__value">{children}</span>
    </div>
  );
}
