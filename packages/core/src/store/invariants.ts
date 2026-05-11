import type { Graph, Node } from "../schema/index.js";
import type { NodeId } from "../schema/ids.js";
import {
  hasWalletOrPaymentAuthority,
  isAuthorityScopeAllowedForArchetype,
  isRoleClassAllowedForArchetype,
  isToolAccessAllowedForArchetype,
} from "../schema/archetype.js";

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
    if (
      !supervisor ||
      !isRole(supervisor) ||
      (supervisor.class !== "human" && supervisor.class !== "hybrid")
    ) {
      violations.push({
        code: "delegation.missing-human-supervisor",
        severity: "error",
        message: `Delegation "${d.mandate}" has no human supervising role.`,
        nodeIds: [d.id],
      });
    }
  }

  // 1b. Role archetypes are the authority envelope source of truth.
  for (const r of nodes.filter(isRole)) {
    if (!r.archetype) {
      violations.push({
        code: "role.missing-archetype",
        severity: "warning",
        message: `Role "${r.name}" has no IXO/Qi archetype.`,
        nodeIds: [r.id],
      });
      continue;
    }
    if (!isRoleClassAllowedForArchetype(r.archetype, r.class)) {
      violations.push({
        code: "role.archetype-class-mismatch",
        severity: "error",
        message: `Role "${r.name}" uses class ${r.class}, which is not allowed for archetype ${r.archetype}.`,
        nodeIds: [r.id],
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

  // 2b. Delegation envelopes must stay inside the delegated role archetype.
  for (const d of nodes.filter(isDelegation)) {
    const agent = graph.nodes[d.delegatedAgentRoleId];
    if (!agent || !isRole(agent) || !agent.archetype) continue;

    const illegalScopes = d.authorityScopes.filter(
      (scope) => !isAuthorityScopeAllowedForArchetype(agent.archetype!, scope)
    );
    if (illegalScopes.length > 0) {
      violations.push({
        code: "delegation.scope-outside-archetype",
        severity: "error",
        message: `Delegation "${d.mandate}" grants scopes outside ${agent.archetype}: ${illegalScopes.join(", ")}.`,
        nodeIds: [d.id, agent.id],
      });
    }

    const illegalTools = d.toolAccess.filter(
      (tool) => !isToolAccessAllowedForArchetype(agent.archetype!, tool)
    );
    if (illegalTools.length > 0) {
      violations.push({
        code:
          agent.archetype === "orchestrator"
            ? "delegation.orchestrator-wallet-rights"
            : "delegation.tool-outside-archetype",
        severity: "error",
        message: `Delegation "${d.mandate}" has tool access outside ${agent.archetype}: ${illegalTools
          .map((t) => `${t.tool}:${t.scope}`)
          .join(", ")}.`,
        nodeIds: [d.id, agent.id],
      });
    }

    if (
      agent.archetype === "orchestrator" &&
      hasWalletOrPaymentAuthority([...d.authorityScopes, ...d.allowedActions])
    ) {
      violations.push({
        code: "delegation.orchestrator-wallet-rights",
        severity: "error",
        message: `Orchestrator delegation "${d.mandate}" includes wallet or payment authority.`,
        nodeIds: [d.id, agent.id],
      });
    }

    const hasPayment = hasWalletOrPaymentAuthority([
        ...d.authorityScopes,
        ...d.allowedActions,
      ]);
    const hasHighImpactScope =
      hasPayment ||
      (d.spendBudget ?? 0) > 0 ||
      d.authorityScopes.some((scope) =>
        [
          "flow:pause",
          "incident:create",
          "access:grant",
          "evidence:freeze",
          "schema:publish",
        ].some((prefix) => scope.startsWith(prefix))
      );
    if (hasHighImpactScope && !d.checkpointPolicyId) {
      violations.push({
        code: hasPayment
          ? "delegation.payment-without-checkpoint"
          : "delegation.high-impact-without-checkpoint",
        severity: "error",
        message: `Delegation "${d.mandate}" has high-impact authority but no checkpoint policy.`,
        nodeIds: [d.id, agent.id],
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
        const fromName = nodeLabel(graph, edge.from);
        const toName = nodeLabel(graph, edge.to);
        violations.push({
          code: "edge.open-ended-coordination",
          severity: "error",
          message: `Interaction edge (${edge.mode}) between "${fromName}" and "${toName}" lacks review date or exit criteria.`,
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

// Resolve a node ID to its human-readable label, matching the convention used
// elsewhere (intent purpose, POD/role/loop name, delegation mandate). Falls
// back to the raw ID when the node is missing or has no obvious label.
const nodeLabel = (graph: Graph, id: NodeId): string => {
  const n = graph.nodes[id];
  if (!n) return id;
  switch (n.kind) {
    case "intent":
      return n.purpose;
    case "valueLoop":
    case "pod":
    case "role":
    case "checkpoint":
    case "policy":
      return n.name;
    case "delegation":
      return n.mandate || id;
  }
};
