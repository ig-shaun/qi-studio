import type {
  Node,
  IntentKernel,
  ValueLoop,
  PodProtocol,
  RoleTemplate,
  DelegationContract,
  Checkpoint,
  Graph,
} from "../schema/index.js";

const kindFilter = <K extends Node["kind"]>(
  graph: Graph,
  kind: K
): Extract<Node, { kind: K }>[] =>
  Object.values(graph.nodes).filter(
    (n): n is Extract<Node, { kind: K }> => n.kind === kind
  );

export const getIntent = (graph: Graph): IntentKernel | undefined =>
  kindFilter(graph, "intent")[0];

export const getValueLoops = (graph: Graph): ValueLoop[] =>
  kindFilter(graph, "valueLoop");

export const getPods = (graph: Graph): PodProtocol[] => kindFilter(graph, "pod");

export const getRoles = (graph: Graph): RoleTemplate[] => kindFilter(graph, "role");

export const getDelegations = (graph: Graph): DelegationContract[] =>
  kindFilter(graph, "delegation");

export const getCheckpoints = (graph: Graph): Checkpoint[] =>
  kindFilter(graph, "checkpoint");

export const summarizeIntent = (k: IntentKernel) => ({
  id: k.id,
  purpose: k.purpose,
  outcomes: k.outcomes.map((o) => ({ id: o.id, statement: o.statement })),
  constraints: k.constraints.map((c) => ({ statement: c.statement, kind: c.kind })),
  sovereigntyZones: k.sovereigntyZones.map((s) => ({
    name: s.name,
    description: s.description,
  })),
  principles: k.principles.map((p) => p.statement),
  horizon: k.horizon,
  adaptabilityTarget: k.adaptabilityTarget,
});

export const summarizeLoop = (l: ValueLoop) => ({
  id: l.id,
  name: l.name,
  purpose: l.purpose,
  criticality: l.criticality,
  outcomeRefs: l.outcomeRefs,
});

export const summarizePod = (p: PodProtocol) => ({
  id: p.id,
  name: p.name,
  purpose: p.purpose,
  podType: p.podType,
  primaryLoopId: p.primaryLoopId,
  humanRoleIds: p.humanRoleIds,
  agentRoleIds: p.agentRoleIds,
});

export const summarizeRole = (r: RoleTemplate) => ({
  id: r.id,
  name: r.name,
  class: r.class,
  agentClass: r.agentClass,
  purpose: r.purpose,
});

export const summarizeDelegation = (d: DelegationContract) => ({
  id: d.id,
  podId: d.podId,
  supervisingHumanRoleId: d.supervisingHumanRoleId,
  delegatedAgentRoleId: d.delegatedAgentRoleId,
  mandate: d.mandate,
  autonomyLevel: d.autonomyLevel,
  checkpointPolicyId: d.checkpointPolicyId,
});
