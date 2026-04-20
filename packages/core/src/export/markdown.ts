import type { Graph, Node } from "../schema/index.js";
import type { InvariantViolation } from "../store/invariants.js";

export type MarkdownReportArgs = {
  graph: Graph;
  workspaceName?: string;
  prompt?: string;
  violations?: InvariantViolation[];
};

export const renderWorkspaceMarkdown = ({
  graph,
  workspaceName,
  prompt,
  violations = [],
}: MarkdownReportArgs): string => {
  const intent = Object.values(graph.nodes).find(
    (n): n is Extract<Node, { kind: "intent" }> => n.kind === "intent"
  );
  const loops = Object.values(graph.nodes).filter(
    (n): n is Extract<Node, { kind: "valueLoop" }> => n.kind === "valueLoop"
  );
  const pods = Object.values(graph.nodes).filter(
    (n): n is Extract<Node, { kind: "pod" }> => n.kind === "pod"
  );
  const roles = Object.values(graph.nodes).filter(
    (n): n is Extract<Node, { kind: "role" }> => n.kind === "role"
  );
  const delegations = Object.values(graph.nodes).filter(
    (n): n is Extract<Node, { kind: "delegation" }> => n.kind === "delegation"
  );
  const checkpoints = Object.values(graph.nodes).filter(
    (n): n is Extract<Node, { kind: "checkpoint" }> => n.kind === "checkpoint"
  );
  const policies = Object.values(graph.nodes).filter(
    (n): n is Extract<Node, { kind: "policy" }> => n.kind === "policy"
  );

  const out: string[] = [];
  const title = intent?.purpose ?? workspaceName ?? "Qi Studio Workspace";
  out.push(`# ${title}`, "");
  out.push(
    `_Exported ${new Date().toISOString()} from Qi Studio — intent-first operating model._`,
    ""
  );

  if (workspaceName && workspaceName !== title) {
    out.push(`**Workspace:** ${workspaceName}`, "");
  }
  if (prompt) {
    out.push(`**Generation prompt:**`, "", `> ${prompt.replace(/\n/g, "\n> ")}`, "");
  }

  out.push(
    `**Composition:** ${loops.length} value loop${plural(loops.length)} · ${pods.length} POD${plural(pods.length)} · ${roles.length} role${plural(roles.length)} · ${delegations.length} delegation${plural(delegations.length)} · ${checkpoints.length} checkpoint${plural(checkpoints.length)}`,
    ""
  );

  if (violations.length) {
    out.push(`## Invariant violations`, "");
    for (const v of violations) {
      out.push(`- **[${v.severity.toUpperCase()}] ${v.code}** — ${v.message}`);
    }
    out.push("");
  }

  if (intent) {
    out.push(`## Intent Kernel`, "");
    out.push(`- **Purpose:** ${intent.purpose}`);
    out.push(`- **Horizon:** ${intent.horizon}`);
    out.push(`- **Adaptability target:** ${intent.adaptabilityTarget}`);
    out.push("");

    if (intent.outcomes.length) {
      out.push(`### Outcomes`, "");
      for (const o of intent.outcomes) {
        out.push(`- ${o.statement}${o.metric ? ` _(metric: ${o.metric})_` : ""}`);
      }
      out.push("");
    }

    if (intent.sovereigntyZones.length) {
      out.push(`### Sovereignty zones`, "");
      for (const z of intent.sovereigntyZones) {
        out.push(`- **${z.name}** — ${z.description}`);
      }
      out.push("");
    }

    if (intent.constraints.length) {
      out.push(`### Constraints`, "");
      for (const c of intent.constraints) {
        out.push(`- _(${c.kind})_ ${c.statement}`);
      }
      out.push("");
    }

    if (intent.principles.length) {
      out.push(`### Principles`, "");
      for (const p of intent.principles) out.push(`- ${p.statement}`);
      out.push("");
    }

    if (intent.stakeholders.length) {
      out.push(`### Stakeholders`, "");
      for (const s of intent.stakeholders) out.push(`- _(${s.kind})_ ${s.label}`);
      out.push("");
    }
  }

  if (loops.length) {
    out.push(`## Value loops`, "");
    for (const l of loops) {
      out.push(`### ${l.name}`, "");
      out.push(`- **Purpose:** ${l.purpose}`);
      out.push(`- **Criticality:** ${l.criticality}`);
      if (l.requiredLatency) out.push(`- **Latency:** ${l.requiredLatency}`);
      if (l.triggerSignals.length) {
        out.push(`- **Triggers:** ${l.triggerSignals.join(" · ")}`);
      }
      if (l.outputs.length) {
        out.push(`- **Outputs:** ${l.outputs.join(" · ")}`);
      }
      out.push("");
    }
  }

  if (pods.length) {
    out.push(`## PODs`, "");
    for (const p of pods) {
      const load = p.accountabilities.reduce(
        (sum, a) => sum + (a.complexityWeight ?? 1),
        0
      );
      const overloaded = load > p.cognitiveLoadBudget;
      const loop = loops.find((l) => l.id === p.primaryLoopId);
      out.push(`### ${p.name}`, "");
      out.push(`- **Type:** ${p.podType}`);
      if (loop) out.push(`- **Primary loop:** ${loop.name}`);
      out.push(`- **Purpose:** ${p.purpose}`);
      out.push(
        `- **Cognitive load:** ${load} / ${p.cognitiveLoadBudget}${
          overloaded ? " — **OVERLOAD**" : ""
        }`
      );

      if (p.accountabilities.length) {
        out.push("", `**Accountabilities**`);
        for (const a of p.accountabilities) {
          out.push(`- (w${a.complexityWeight}) ${a.statement}`);
        }
      }

      const humans = p.humanRoleIds
        .map((id) => roles.find((r) => r.id === id))
        .filter(Boolean);
      const agents = p.agentRoleIds
        .map((id) => roles.find((r) => r.id === id))
        .filter(Boolean);
      if (humans.length) {
        out.push("", `**Human roles:** ${humans.map((r) => r!.name).join(", ")}`);
      }
      if (agents.length) {
        out.push(
          "",
          `**Agent roles:** ${agents
            .map((r) => `${r!.name}${r!.agentClass ? ` (${r!.agentClass})` : ""}`)
            .join(", ")}`
        );
      }
      if (p.localDecisions.length) {
        out.push("", `**Local decisions**`);
        for (const d of p.localDecisions) out.push(`- ${d}`);
      }
      if (p.escalatedDecisions.length) {
        out.push("", `**Escalated decisions**`);
        for (const d of p.escalatedDecisions) out.push(`- ${d}`);
      }
      out.push("");
    }
  }

  if (roles.length) {
    out.push(`## Roles`, "");
    for (const r of roles) {
      const tag = r.agentClass ? `${r.class} · ${r.agentClass}` : r.class;
      out.push(`### ${r.name} _(${tag})_`, "");
      out.push(`- **Purpose:** ${r.purpose}`);
      if (r.accountabilities.length) {
        out.push("", `**Accountabilities**`);
        for (const a of r.accountabilities) out.push(`- ${a}`);
      }
      if (r.decisionRights.length) {
        out.push("", `**Decision rights**`);
        for (const d of r.decisionRights) out.push(`- ${d}`);
      }
      out.push("");
    }
  }

  if (delegations.length) {
    out.push(`## Delegation contracts`, "");
    for (const d of delegations) {
      const supervisor = roles.find((r) => r.id === d.supervisingHumanRoleId);
      const agent = roles.find((r) => r.id === d.delegatedAgentRoleId);
      const checkpoint = checkpoints.find((c) => c.id === d.checkpointPolicyId);
      out.push(`### ${d.mandate}`, "");
      out.push(`- **Autonomy:** ${d.autonomyLevel}`);
      if (supervisor) out.push(`- **Supervising human:** ${supervisor.name}`);
      if (agent) out.push(`- **Delegated agent:** ${agent.name}`);
      if (checkpoint) out.push(`- **Checkpoint:** ${checkpoint.name}`);
      if (d.allowedActions.length) {
        out.push("", `**Allowed actions**`);
        for (const a of d.allowedActions) out.push(`- ${a}`);
      }
      if (d.forbiddenActions.length) {
        out.push("", `**Forbidden actions**`);
        for (const a of d.forbiddenActions) out.push(`- ${a}`);
      }
      out.push("");
    }
  }

  if (checkpoints.length) {
    out.push(`## Checkpoints`, "");
    for (const c of checkpoints) {
      const approver = c.approverRoleId
        ? roles.find((r) => r.id === c.approverRoleId)
        : null;
      out.push(`### ${c.name}`, "");
      out.push(`- **Action scope:** ${c.actionScope}`);
      out.push(`- **Reversibility:** ${c.reversibility}`);
      out.push(
        `- **Human approval:** ${c.requiresHumanApproval ? "required" : "not required"}`
      );
      if (approver) out.push(`- **Approver:** ${approver.name}`);
      out.push(`- **Audit:** ${c.auditRequired ? "required" : "—"}`);
      out.push("");
    }
  }

  if (policies.length) {
    out.push(`## Policies`, "");
    for (const p of policies) {
      out.push(`### ${p.name}`, "");
      out.push(`- **Enforcement:** ${p.enforcement}`);
      out.push(`- ${p.statement}`);
      out.push("");
    }
  }

  return out.join("\n").trimEnd() + "\n";
};

const plural = (n: number) => (n === 1 ? "" : "s");
