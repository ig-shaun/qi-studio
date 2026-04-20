import type { Graph, Node } from "../schema/index.js";
import type { NodeId } from "../schema/ids.js";

export type AntiPatternSeverity = "error" | "warning";

export type AntiPattern = {
  id: string;
  name: string;
  description: string;
  severity: AntiPatternSeverity;
  nodeIds: NodeId[];
};

const isPod = (n: Node): n is Extract<Node, { kind: "pod" }> => n.kind === "pod";
const isRole = (n: Node): n is Extract<Node, { kind: "role" }> => n.kind === "role";
const isLoop = (n: Node): n is Extract<Node, { kind: "valueLoop" }> =>
  n.kind === "valueLoop";
const isDelegation = (n: Node): n is Extract<Node, { kind: "delegation" }> =>
  n.kind === "delegation";
const isIntent = (n: Node): n is Extract<Node, { kind: "intent" }> =>
  n.kind === "intent";

export const detectAntiPatterns = (graph: Graph): AntiPattern[] => {
  const out: AntiPattern[] = [];
  const nodes = Object.values(graph.nodes);
  const pods = nodes.filter(isPod);
  const roles = nodes.filter(isRole);
  const loops = nodes.filter(isLoop);
  const delegations = nodes.filter(isDelegation);
  const intent = nodes.find(isIntent);

  // 1. Orphan value loop — no POD owns this loop.
  const ownedLoopIds = new Set(pods.map((p) => p.primaryLoopId));
  const orphans = loops.filter((l) => !ownedLoopIds.has(l.id));
  if (orphans.length > 0) {
    out.push({
      id: "orphan-value-loop",
      name: "Orphan value loop",
      description:
        "Every value loop should be owned by at least one POD. These loops have no owner.",
      severity: "warning",
      nodeIds: orphans.map((l) => l.id),
    });
  }

  // 2. POD with no human owner.
  const roleById = new Map(roles.map((r) => [r.id, r]));
  const noHuman = pods.filter((p) => {
    const humans = p.humanRoleIds
      .map((id) => roleById.get(id))
      .filter((r): r is (typeof roles)[number] => !!r)
      .filter((r) => r.class === "human" || r.class === "hybrid");
    return humans.length === 0;
  });
  if (noHuman.length > 0) {
    out.push({
      id: "pod-no-human",
      name: "POD with no human owner",
      description:
        "Every POD needs at least one human (or hybrid) role so judgment and escalation have an anchor.",
      severity: "error",
      nodeIds: noHuman.map((p) => p.id),
    });
  }

  // 3. Agent with authority but no checkpoint.
  const openAuthority = delegations.filter(
    (d) =>
      (d.autonomyLevel === "act-with-approval" ||
        d.autonomyLevel === "act-with-audit") &&
      !d.checkpointPolicyId
  );
  if (openAuthority.length > 0) {
    out.push({
      id: "agent-unchecked-authority",
      name: "Agent with authority but no checkpoint",
      description:
        "Delegations with act-with-approval or act-with-audit autonomy must link a checkpoint policy.",
      severity: "error",
      nodeIds: openAuthority.map((d) => d.id),
    });
  }

  // 4. Circular escalation.
  const cycles: NodeId[] = [];
  for (const r of roles) {
    const seen = new Set<NodeId>();
    let cur: NodeId | undefined = r.id;
    while (cur) {
      if (seen.has(cur)) {
        cycles.push(r.id);
        break;
      }
      seen.add(cur);
      const next: Node | undefined = graph.nodes[cur];
      cur = next && isRole(next) ? next.escalationToRoleId : undefined;
    }
  }
  if (cycles.length > 0) {
    out.push({
      id: "escalation-cycle",
      name: "Circular escalation",
      description:
        "Escalation chains must terminate — a cycle means nobody is ultimately accountable.",
      severity: "error",
      nodeIds: cycles,
    });
  }

  // 5. Open-ended coordination — collaboration/facilitation edge lacking
  //    review date or exit criteria (matches invariant #5 but surfaces as
  //    an anti-pattern, not just a rule violation).
  const openEdges: NodeId[] = [];
  for (const edge of Object.values(graph.edges)) {
    if (edge.kind !== "interaction") continue;
    if (edge.mode === "collaboration" || edge.mode === "facilitation") {
      if (!edge.reviewDate || !edge.exitCriteria) {
        openEdges.push(edge.from);
      }
    }
  }
  if (openEdges.length > 0) {
    out.push({
      id: "permanent-coordination",
      name: "Permanent coordination",
      description:
        "Collaboration and facilitation edges need a review date and exit criteria. Without them, coordination becomes structural.",
      severity: "error",
      nodeIds: openEdges,
    });
  }

  // 6. Overloaded POD (cognitive load > budget).
  const overloaded = pods.filter((p) => {
    const load = p.accountabilities.reduce(
      (s, a) => s + (a.complexityWeight ?? 1),
      0
    );
    return load > p.cognitiveLoadBudget;
  });
  if (overloaded.length > 0) {
    out.push({
      id: "pod-overloaded",
      name: "POD cognitive overload",
      description:
        "Sum of weighted accountabilities exceeds the POD's cognitive load budget.",
      severity: "error",
      nodeIds: overloaded.map((p) => p.id),
    });
  }

  // 7. Intent with no sovereignty zones — every operating model needs at
  //    least one non-delegable human judgment.
  if (intent && intent.sovereigntyZones.length === 0) {
    out.push({
      id: "intent-no-sovereignty",
      name: "Intent without sovereignty zones",
      description:
        "At least one zone of non-delegable human judgment is required.",
      severity: "warning",
      nodeIds: [intent.id],
    });
  }

  return out;
};
