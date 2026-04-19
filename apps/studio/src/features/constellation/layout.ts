import type { Graph, PodProtocol, ValueLoop } from "@ixo-studio/core/schema";

export type LayoutNode = {
  id: string;
  kind: "intent" | "valueLoop" | "pod";
  x: number;
  y: number;
  r: number;
  angle: number; // radians, for tooltip / arc labels
  ring: 0 | 1 | 2;
  label: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  badges: string[];
};

export type LayoutEdge = {
  id: string;
  kind: "loop-to-intent" | "pod-to-loop";
  fromId: string;
  toId: string;
};

export type LayoutResult = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
};

const CRITICALITY_FILL: Record<ValueLoop["criticality"], string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

const POD_TYPE_STROKE: Record<PodProtocol["podType"], string> = {
  "stream-aligned": "#3b82f6",
  platform: "#a855f7",
  enabling: "#22c55e",
  "complicated-subsystem": "#f97316",
};

type Options = {
  width: number;
  height: number;
  loopRingRadius: number;
  podRingRadius: number;
};

const defaults: Options = {
  width: 960,
  height: 720,
  loopRingRadius: 180,
  podRingRadius: 320,
};

export const computeLayout = (
  graph: Graph,
  opts: Partial<Options> = {}
): LayoutResult => {
  const o = { ...defaults, ...opts };
  const cx = o.width / 2;
  const cy = o.height / 2;

  const intent = Object.values(graph.nodes).find((n) => n.kind === "intent");
  const loops = Object.values(graph.nodes).filter(
    (n): n is ValueLoop => n.kind === "valueLoop"
  );
  const pods = Object.values(graph.nodes).filter(
    (n): n is PodProtocol => n.kind === "pod"
  );
  const roles = Object.values(graph.nodes).filter((n) => n.kind === "role");
  const delegations = Object.values(graph.nodes).filter(
    (n) => n.kind === "delegation"
  );
  const checkpoints = Object.values(graph.nodes).filter(
    (n) => n.kind === "checkpoint"
  );

  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  if (intent) {
    nodes.push({
      id: intent.id,
      kind: "intent",
      x: cx,
      y: cy,
      r: 56,
      angle: 0,
      ring: 0,
      label: intent.purpose.slice(0, 64),
      fill: "#0f172a",
      stroke: "#e2e8f0",
      strokeWidth: 2,
      badges: [],
    });
  }

  // Ring 1 — value loops, evenly distributed.
  loops.forEach((loop, i) => {
    const angle = (i / Math.max(loops.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * o.loopRingRadius;
    const y = cy + Math.sin(angle) * o.loopRingRadius;
    nodes.push({
      id: loop.id,
      kind: "valueLoop",
      x,
      y,
      r: 32,
      angle,
      ring: 1,
      label: loop.name,
      fill: CRITICALITY_FILL[loop.criticality],
      stroke: "#e2e8f0",
      strokeWidth: 1,
      badges: [loop.criticality],
    });
    if (intent) {
      edges.push({
        id: `e_loop_intent_${loop.id}`,
        kind: "loop-to-intent",
        fromId: intent.id,
        toId: loop.id,
      });
    }
  });

  // Ring 2 — PODs, grouped by primary loop so each POD sits near its loop.
  const podsByLoop = new Map<string, PodProtocol[]>();
  for (const p of pods) {
    const bucket = podsByLoop.get(p.primaryLoopId) ?? [];
    bucket.push(p);
    podsByLoop.set(p.primaryLoopId, bucket);
  }

  const loopAngleById = new Map<string, number>();
  for (const n of nodes) {
    if (n.kind === "valueLoop") loopAngleById.set(n.id, n.angle);
  }

  const rolesByPod = new Map<string, { humans: number; agents: number }>();
  for (const p of pods) {
    rolesByPod.set(p.id, {
      humans: p.humanRoleIds.filter((id) => roles.find((r) => r.id === id))
        .length,
      agents: p.agentRoleIds.filter((id) => roles.find((r) => r.id === id))
        .length,
    });
  }

  const checkpointsByPod = new Map<string, number>();
  for (const d of delegations) {
    if (d.kind !== "delegation") continue;
    if (d.checkpointPolicyId) {
      checkpointsByPod.set(d.podId, (checkpointsByPod.get(d.podId) ?? 0) + 1);
    }
  }

  for (const p of pods) {
    const centerAngle = loopAngleById.get(p.primaryLoopId) ?? 0;
    const siblings = podsByLoop.get(p.primaryLoopId) ?? [p];
    const index = siblings.indexOf(p);
    const spread = Math.PI / 10;
    const offset =
      siblings.length === 1
        ? 0
        : ((index - (siblings.length - 1) / 2) * spread) /
          Math.max(siblings.length - 1, 1);
    const angle = centerAngle + offset;
    const x = cx + Math.cos(angle) * o.podRingRadius;
    const y = cy + Math.sin(angle) * o.podRingRadius;

    const load = p.accountabilities.reduce(
      (sum, a) => sum + (a.complexityWeight ?? 1),
      0
    );
    const loadRatio = Math.min(load / Math.max(p.cognitiveLoadBudget, 1), 1.5);
    const r = 22 + Math.min(loadRatio, 1) * 18; // size grows with load up to budget
    const overloaded = load > p.cognitiveLoadBudget;
    const counts = rolesByPod.get(p.id) ?? { humans: 0, agents: 0 };
    const cpCount = checkpointsByPod.get(p.id) ?? 0;

    const badges: string[] = [p.podType];
    if (counts.humans > 0) badges.push(`${counts.humans}H`);
    if (counts.agents > 0) badges.push(`${counts.agents}A`);
    if (cpCount > 0) badges.push(`${cpCount}✓`);
    if (overloaded) badges.push("overload");

    nodes.push({
      id: p.id,
      kind: "pod",
      x,
      y,
      r,
      angle,
      ring: 2,
      label: p.name,
      fill: "#111827",
      stroke: overloaded ? "#ef4444" : POD_TYPE_STROKE[p.podType],
      strokeWidth: overloaded ? 3 : 2,
      badges,
    });

    edges.push({
      id: `e_pod_loop_${p.id}`,
      kind: "pod-to-loop",
      fromId: p.primaryLoopId,
      toId: p.id,
    });
  }

  // checkpoints and roles contribute only to badge counts in v1.
  void checkpoints;

  return { nodes, edges, width: o.width, height: o.height };
};
