"use client";

import type { Graph, Node } from "@ixo-studio/core/schema";

type Props = {
  graph: Graph;
  selectedId?: string | undefined;
  onClose: () => void;
};

export function Inspector({ graph, selectedId, onClose }: Props) {
  const node: Node | undefined = selectedId ? graph.nodes[selectedId] : undefined;

  if (!node) {
    return (
      <aside style={panelStyle}>
        <p style={{ color: "#94a3b8", margin: 0 }}>
          Select a node to inspect its fields.
        </p>
      </aside>
    );
  }

  return (
    <aside style={panelStyle}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 11, color: "#94a3b8" }}>
          {node.kind}
        </strong>
        <button onClick={onClose} style={closeButtonStyle}>close</button>
      </header>
      <NodeBody node={node} graph={graph} />
    </aside>
  );
}

function NodeBody({ node, graph }: { node: Node; graph: Graph }) {
  switch (node.kind) {
    case "intent":
      return (
        <section>
          <h2 style={h2Style}>{node.purpose}</h2>
          <Field label="Horizon">{node.horizon}</Field>
          <Field label="Adaptability">{node.adaptabilityTarget}</Field>
          <List label="Outcomes" items={node.outcomes.map((o) => o.statement)} />
          <List
            label="Sovereignty zones"
            items={node.sovereigntyZones.map((z) => `${z.name} — ${z.description}`)}
          />
          <List label="Principles" items={node.principles.map((p) => p.statement)} />
          <List
            label="Constraints"
            items={node.constraints.map((c) => `[${c.kind}] ${c.statement}`)}
          />
        </section>
      );
    case "valueLoop":
      return (
        <section>
          <h2 style={h2Style}>{node.name}</h2>
          <p style={{ color: "#cbd5f5", marginTop: 0 }}>{node.purpose}</p>
          <Field label="Criticality">{node.criticality}</Field>
          {node.requiredLatency && <Field label="Latency">{node.requiredLatency}</Field>}
          <List label="Triggers" items={node.triggerSignals} />
          <List label="Outputs" items={node.outputs} />
        </section>
      );
    case "pod": {
      const load = node.accountabilities.reduce(
        (sum, a) => sum + (a.complexityWeight ?? 1),
        0
      );
      const humans = node.humanRoleIds
        .map((id) => graph.nodes[id])
        .filter((n): n is Extract<Node, { kind: "role" }> => !!n && n.kind === "role");
      const agents = node.agentRoleIds
        .map((id) => graph.nodes[id])
        .filter((n): n is Extract<Node, { kind: "role" }> => !!n && n.kind === "role");
      return (
        <section>
          <h2 style={h2Style}>{node.name}</h2>
          <p style={{ color: "#cbd5f5", marginTop: 0 }}>{node.purpose}</p>
          <Field label="Team Topologies type">{node.podType}</Field>
          <Field label="Cognitive load">
            {load} / {node.cognitiveLoadBudget}
            {load > node.cognitiveLoadBudget ? " ⚠ overload" : ""}
          </Field>
          <List
            label="Accountabilities"
            items={node.accountabilities.map(
              (a) => `${a.statement} (weight ${a.complexityWeight})`
            )}
          />
          <List label="Human roles" items={humans.map((r) => r.name)} />
          <List
            label="Agent roles"
            items={agents.map((r) => `${r.name} (${r.agentClass ?? "?"})`)}
          />
          <List label="Local decisions" items={node.localDecisions} />
          <List label="Escalated decisions" items={node.escalatedDecisions} />
        </section>
      );
    }
    case "role":
      return (
        <section>
          <h2 style={h2Style}>{node.name}</h2>
          <Field label="Class">
            {node.class}
            {node.agentClass ? ` / ${node.agentClass}` : ""}
          </Field>
          <p style={{ color: "#cbd5f5" }}>{node.purpose}</p>
          <List label="Accountabilities" items={node.accountabilities} />
          <List label="Decision rights" items={node.decisionRights} />
        </section>
      );
    case "delegation":
      return (
        <section>
          <h2 style={h2Style}>{node.mandate}</h2>
          <Field label="Autonomy">{node.autonomyLevel}</Field>
          <Field label="Supervisor">
            {roleName(graph, node.supervisingHumanRoleId)}
          </Field>
          <Field label="Agent">{roleName(graph, node.delegatedAgentRoleId)}</Field>
          {node.checkpointPolicyId && (
            <Field label="Checkpoint">
              {(graph.nodes[node.checkpointPolicyId] as Extract<Node, { kind: "checkpoint" }> | undefined)?.name ?? node.checkpointPolicyId}
            </Field>
          )}
          <List label="Allowed actions" items={node.allowedActions} />
          <List label="Forbidden actions" items={node.forbiddenActions} />
          <List
            label="Tool access"
            items={node.toolAccess.map((t) => `${t.tool} (${t.scope})`)}
          />
        </section>
      );
    case "checkpoint":
      return (
        <section>
          <h2 style={h2Style}>{node.name}</h2>
          <Field label="Action scope">{node.actionScope}</Field>
          <Field label="Reversibility">{node.reversibility}</Field>
          <Field label="Requires human approval">
            {node.requiresHumanApproval ? "yes" : "no"}
          </Field>
          {node.approverRoleId && (
            <Field label="Approver">{roleName(graph, node.approverRoleId)}</Field>
          )}
          <Field label="Audit required">{node.auditRequired ? "yes" : "no"}</Field>
        </section>
      );
    case "policy":
      return (
        <section>
          <h2 style={h2Style}>{node.name}</h2>
          <p style={{ color: "#cbd5f5", marginTop: 0 }}>{node.statement}</p>
          <Field label="Enforcement">{node.enforcement}</Field>
        </section>
      );
    default:
      return null;
  }
}

function roleName(graph: Graph, id: string): string {
  const n = graph.nodes[id];
  return n && n.kind === "role" ? n.name : id;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "0.5rem 0" }}>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ color: "#e6e8eb" }}>{children}</div>
    </div>
  );
}

function List({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ margin: "0.75rem 0" }}>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem", color: "#cbd5f5" }}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: "1rem",
  minWidth: 320,
  maxWidth: 420,
  height: "100%",
  overflow: "auto",
};

const h2Style: React.CSSProperties = {
  margin: "0 0 0.5rem",
  fontSize: "1.05rem",
  color: "#f8fafc",
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #334155",
  color: "#94a3b8",
  borderRadius: 6,
  padding: "0.2rem 0.55rem",
  cursor: "pointer",
  fontSize: 11,
};
