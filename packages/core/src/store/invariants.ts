import type { Graph, Node } from "../schema/index.js";
import type { NodeId } from "../schema/ids.js";

export type InvariantSeverity = "error" | "warning";

export type InvariantViolation = {
  code: string;
  severity: InvariantSeverity;
  message: string;
  nodeIds: NodeId[];
};

const isRole = (n: Node): n is Extract<Node, { kind: "role" }> => n.kind === "role";
const isDelegation = (n: Node): n is Extract<Node, { kind: "delegation" }> =>
  n.kind === "delegation";
const isPod = (n: Node): n is Extract<Node, { kind: "pod" }> => n.kind === "pod";
const isValueLoop = (n: Node): n is Extract<Node, { kind: "valueLoop" }> =>
  n.kind === "valueLoop";
const isIntent = (n: Node): n is Extract<Node, { kind: "intent" }> =>
  n.kind === "intent";

export const validateGraph = (graph: Graph): InvariantViolation[] => {
  const violations: InvariantViolation[] = [];
  const nodes = Object.values(graph.nodes);

  // 1. Every DelegationContract must have a supervisingHumanRoleId pointing at a human role.
  for (const d of nodes.filter(isDelegation)) {
    const supervisor = graph.nodes[d.supervisingHumanRoleId];
    if (!supervisor || !isRole(supervisor) || supervisor.class !== "human") {
      violations.push({
        code: "delegation.missing-human-supervisor",
        severity: "error",
        message: `Delegation "${d.mandate}" has no human supervising role.`,
        nodeIds: [d.id],
      });
    }
  }

  // 2. Delegations with act-* autonomy require a checkpoint policy reference.
  for (const d of nodes.filter(isDelegation)) {
    const needsCheckpoint =
      d.autonomyLevel === "act-with-approval" || d.autonomyLevel === "act-with-audit";
    if (needsCheckpoint && !d.checkpointPolicyId) {
      violations.push({
        code: "delegation.autonomy-without-checkpoint",
        severity: "error",
        message: `Delegation "${d.mandate}" has autonomy ${d.autonomyLevel} but no checkpoint policy.`,
        nodeIds: [d.id],
      });
    }
  }

  // 3. Every POD must include at least one human role.
  for (const p of nodes.filter(isPod)) {
    const humanRoles = p.humanRoleIds
      .map((id) => graph.nodes[id])
      .filter((n): n is Extract<Node, { kind: "role" }> => !!n && isRole(n))
      .filter((r) => r.class === "human" || r.class === "hybrid");
    if (humanRoles.length === 0) {
      violations.push({
        code: "pod.no-human-owner",
        severity: "error",
        message: `POD "${p.name}" has no human (or hybrid) role.`,
        nodeIds: [p.id],
      });
    }
  }

  // 4. Each ValueLoop should reference at least one outcome defined on the Intent.
  const intent = nodes.find(isIntent);
  if (intent) {
    const outcomeIds = new Set(intent.outcomes.map((o) => o.id));
    for (const l of nodes.filter(isValueLoop)) {
      if (l.outcomeRefs.length === 0) {
        violations.push({
          code: "loop.no-outcome",
          severity: "warning",
          message: `Value loop "${l.name}" references no outcome.`,
          nodeIds: [l.id],
        });
      } else if (!l.outcomeRefs.every((r) => outcomeIds.has(r))) {
        violations.push({
          code: "loop.dangling-outcome",
          severity: "error",
          message: `Value loop "${l.name}" references an outcome not on the Intent Kernel.`,
          nodeIds: [l.id],
        });
      }
    }
  }

  // 5. Interaction edges in collaboration/facilitation must have reviewDate + exitCriteria.
  for (const edge of Object.values(graph.edges)) {
    if (edge.kind !== "interaction") continue;
    if (edge.mode === "collaboration" || edge.mode === "facilitation") {
      if (!edge.reviewDate || !edge.exitCriteria) {
        violations.push({
          code: "edge.open-ended-coordination",
          severity: "error",
          message: `Interaction edge (${edge.mode}) between ${edge.from} and ${edge.to} lacks review date or exit criteria.`,
          nodeIds: [edge.from, edge.to],
        });
      }
    }
  }

  // 6. Cognitive load: sum of accountabilities.complexityWeight <= cognitiveLoadBudget.
  for (const p of nodes.filter(isPod)) {
    const load = p.accountabilities.reduce(
      (sum, a) => sum + (a.complexityWeight ?? 1),
      0
    );
    if (load > p.cognitiveLoadBudget) {
      violations.push({
        code: "pod.cognitive-overload",
        severity: "error",
        message: `POD "${p.name}" cognitive load ${load} exceeds budget ${p.cognitiveLoadBudget}.`,
        nodeIds: [p.id],
      });
    }
  }

  // 7. Role escalation chains must terminate (no cycles).
  for (const r of nodes.filter(isRole)) {
    const seen = new Set<NodeId>();
    let cur: NodeId | undefined = r.id;
    while (cur) {
      if (seen.has(cur)) {
        violations.push({
          code: "role.escalation-cycle",
          severity: "error",
          message: `Role "${r.name}" escalation chain is circular.`,
          nodeIds: [r.id],
        });
        break;
      }
      seen.add(cur);
      const next: Node | undefined = graph.nodes[cur];
      cur = next && isRole(next) ? next.escalationToRoleId : undefined;
    }
  }

  return violations;
};

export const hasBlockingViolations = (violations: InvariantViolation[]): boolean =>
  violations.some((v) => v.severity === "error");
