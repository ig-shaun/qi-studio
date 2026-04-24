import type { Graph, Node } from "../schema/index.js";
import type { NodeId } from "../schema/ids.js";

export type FitnessMetric = {
  id: string;
  name: string;
  description: string;
  value: number; // normalized 0..1
  display: string; // human-readable e.g. "3 / 5"
  direction: "higher-better" | "lower-better";
};

const loops = (g: Graph) =>
  Object.values(g.nodes).filter(
    (n): n is Extract<Node, { kind: "valueLoop" }> => n.kind === "valueLoop"
  );
const pods = (g: Graph) =>
  Object.values(g.nodes).filter(
    (n): n is Extract<Node, { kind: "pod" }> => n.kind === "pod"
  );
const roles = (g: Graph) =>
  Object.values(g.nodes).filter(
    (n): n is Extract<Node, { kind: "role" }> => n.kind === "role"
  );
const delegations = (g: Graph) =>
  Object.values(g.nodes).filter(
    (n): n is Extract<Node, { kind: "delegation" }> => n.kind === "delegation"
  );
const checkpoints = (g: Graph) =>
  Object.values(g.nodes).filter(
    (n): n is Extract<Node, { kind: "checkpoint" }> => n.kind === "checkpoint"
  );
const intent = (g: Graph) =>
  Object.values(g.nodes).find(
    (n): n is Extract<Node, { kind: "intent" }> => n.kind === "intent"
  );

export const intentCoherence = (g: Graph): FitnessMetric => {
  const k = intent(g);
  const ls = loops(g);
  const outcomes = new Set((k?.outcomes ?? []).map((o) => o.id));
  const coherent = ls.filter(
    (l) => l.outcomeRefs.length > 0 && l.outcomeRefs.every((o) => outcomes.has(o))
  ).length;
  const value = ls.length === 0 ? 0 : coherent / ls.length;
  return {
    id: "intent-coherence",
    name: "Intent Coherence",
    description:
      "Share of value loops whose outcomeRefs point at outcomes actually declared on the Intent Kernel.",
    value,
    display: ls.length === 0 ? "—" : `${coherent} / ${ls.length}`,
    direction: "higher-better",
  };
};

export const delegationSafetyScore = (g: Graph): FitnessMetric => {
  const ds = delegations(g);
  const rs = roles(g);
  const roleById = new Map<NodeId, (typeof rs)[number]>(
    rs.map((r) => [r.id, r])
  );

  if (ds.length === 0) {
    return {
      id: "delegation-safety",
      name: "Delegation Safety Score",
      description:
        "Share of agent delegations that carry a named human supervisor, and for actions with autonomy — a linked checkpoint.",
      value: 1,
      display: "no delegations",
      direction: "higher-better",
    };
  }

  let safe = 0;
  for (const d of ds) {
    const sup = roleById.get(d.supervisingHumanRoleId);
    const hasSupervisor =
      !!sup && (sup.class === "human" || sup.class === "hybrid");
    const needsCheckpoint =
      d.autonomyLevel === "act-with-approval" ||
      d.autonomyLevel === "act-with-audit";
    const hasCheckpoint = !needsCheckpoint || !!d.checkpointPolicyId;
    if (hasSupervisor && hasCheckpoint) safe++;
  }
  return {
    id: "delegation-safety",
    name: "Delegation Safety Score",
    description:
      "Share of agent delegations that carry a named human supervisor and — for act-* autonomy — a linked checkpoint.",
    value: safe / ds.length,
    display: `${safe} / ${ds.length}`,
    direction: "higher-better",
  };
};

export const humanJudgmentClarity = (g: Graph): FitnessMetric => {
  const k = intent(g);
  const zones = k?.sovereigntyZones ?? [];
  if (zones.length === 0) {
    return {
      id: "judgment-clarity",
      name: "Human Judgment Clarity",
      description:
        "Share of sovereignty zones that name an accountable human (or hybrid) role.",
      value: 0,
      display: "no zones declared",
      direction: "higher-better",
    };
  }
  const rolesById = new Map<NodeId, (typeof g.nodes)[string]>(
    Object.entries(g.nodes).map(([, n]) => [n.id, n])
  );
  let clear = 0;
  for (const z of zones) {
    if (!z.accountableRoleId) continue;
    const r = rolesById.get(z.accountableRoleId);
    if (
      r &&
      r.kind === "role" &&
      (r.class === "human" || r.class === "hybrid")
    ) {
      clear++;
    }
  }
  return {
    id: "judgment-clarity",
    name: "Human Judgment Clarity",
    description:
      "Share of sovereignty zones that name an accountable human (or hybrid) role.",
    value: clear / zones.length,
    display: `${clear} / ${zones.length}`,
    direction: "higher-better",
  };
};

export const roleLiquidity = (g: Graph): FitnessMetric => {
  const ps = pods(g);
  if (ps.length === 0) {
    return {
      id: "role-liquidity",
      name: "Role Liquidity",
      description:
        "Share of role slots on PODs that are filled by more than one incumbent — lower is brittle.",
      value: 0,
      display: "no PODs",
      direction: "higher-better",
    };
  }

  const rolesById = new Map<NodeId, (typeof g.nodes)[string]>(
    Object.entries(g.nodes).map(([, n]) => [n.id, n])
  );
  let totalSlots = 0;
  let liquidSlots = 0;
  for (const p of ps) {
    for (const rid of [...p.humanRoleIds, ...p.agentRoleIds]) {
      const r = rolesById.get(rid);
      if (!r || r.kind !== "role") continue;
      totalSlots++;
      if ((r.incumbentCount ?? 0) > 1) liquidSlots++;
    }
  }
  const value = totalSlots === 0 ? 0 : liquidSlots / totalSlots;
  return {
    id: "role-liquidity",
    name: "Role Liquidity",
    description:
      "Share of role slots on PODs that are filled by more than one incumbent — lower is brittle.",
    value,
    display: totalSlots === 0 ? "—" : `${liquidSlots} / ${totalSlots}`,
    direction: "higher-better",
  };
};

export const computeMetrics = (g: Graph): FitnessMetric[] => [
  intentCoherence(g),
  delegationSafetyScore(g),
  humanJudgmentClarity(g),
  roleLiquidity(g),
];

// Unused import suppressor — keeps types ergonomic without re-exporting helpers.
void checkpoints;
