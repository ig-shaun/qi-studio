import type {
  Graph,
  PodProtocol,
  RoleTemplate,
  ValueLoop,
} from "@ixo-studio/core/schema";

export type Ring = "mission" | "objective" | "pod" | "def";

export type SectorNode = {
  id: string;
  ring: Ring;
  parentId?: string;
  label: string;
  kind: string;
  weight: number; // relative size within its ring
  startAngle: number; // radians
  endAngle: number; // radians
  innerRadius: number;
  outerRadius: number;
  fill: string;
  stroke: string;
  accent?: string | undefined; // optional highlight color for outer edge (e.g. podType)
};

export type Sectors = {
  nodes: SectorNode[];
  size: number; // square viewBox
};

// Ring radii tuned to the 960×960 viewBox from the design.
const SIZE = 960;
const CENTER_R = 92;
const R1 = 230;
const R2 = 340;
const R3 = 456;

const POD_TYPE_STROKE: Record<PodProtocol["podType"], string> = {
  "stream-aligned": "oklch(0.52 0.09 210)",
  platform: "oklch(0.48 0.10 285)",
  enabling: "oklch(0.58 0.08 155)",
  "complicated-subsystem": "oklch(0.62 0.11 70)",
};

const CRITICALITY_FILL: Record<ValueLoop["criticality"], string> = {
  high: "oklch(0.92 0.05 30)",
  medium: "oklch(0.95 0.035 70)",
  low: "oklch(0.96 0.02 155)",
};

export function computeSectors(graph: Graph): Sectors {
  const nodes: SectorNode[] = [];

  const intent = Object.values(graph.nodes).find((n) => n.kind === "intent");
  const loops = Object.values(graph.nodes).filter(
    (n): n is ValueLoop => n.kind === "valueLoop"
  );
  const pods = Object.values(graph.nodes).filter(
    (n): n is PodProtocol => n.kind === "pod"
  );
  const roles = Object.values(graph.nodes).filter(
    (n): n is RoleTemplate => n.kind === "role"
  );

  if (!intent) return { nodes: [], size: SIZE };

  // Mission (center) — a filled circle drawn as a single 2π arc so it
  // participates in the same SVG structure and selection system.
  nodes.push({
    id: intent.id,
    ring: "mission",
    label: truncate(intent.purpose, 32),
    kind: "intent",
    weight: 1,
    startAngle: 0,
    endAngle: Math.PI * 2,
    innerRadius: 0,
    outerRadius: CENTER_R,
    fill: "oklch(0.92 0.04 70)",
    stroke: "oklch(0.78 0.05 70)",
  });

  if (loops.length === 0) return { nodes, size: SIZE };

  // Objective ring — weight is number of PODs primarily owned by the loop.
  const podsByLoop = new Map<string, PodProtocol[]>();
  for (const p of pods) {
    const b = podsByLoop.get(p.primaryLoopId) ?? [];
    b.push(p);
    podsByLoop.set(p.primaryLoopId, b);
  }

  const loopWeights = loops.map((l) => Math.max(podsByLoop.get(l.id)?.length ?? 0, 1));
  const totalLoopWeight = loopWeights.reduce((a, b) => a + b, 0) || loops.length;

  let cursor = -Math.PI / 2; // start at 12 o'clock
  loops.forEach((loop, i) => {
    const span = ((loopWeights[i] ?? 1) / totalLoopWeight) * Math.PI * 2;
    const startAngle = cursor;
    const endAngle = cursor + span;
    nodes.push({
      id: loop.id,
      ring: "objective",
      parentId: intent.id,
      label: loop.name,
      kind: "valueLoop",
      weight: loopWeights[i] ?? 1,
      startAngle,
      endAngle,
      innerRadius: CENTER_R,
      outerRadius: R1,
      fill: CRITICALITY_FILL[loop.criticality],
      stroke: "oklch(0.78 0.010 85)",
    });

    // POD ring — weight is accountability count (so dominant PODs feel heavier).
    const children = podsByLoop.get(loop.id) ?? [];
    const podWeights = children.map((p) => Math.max(p.accountabilities.length, 1));
    const totalPodWeight = podWeights.reduce((a, b) => a + b, 0) || children.length || 1;

    let podCursor = startAngle;
    children.forEach((pod, j) => {
      const podSpan = children.length
        ? ((podWeights[j] ?? 1) / totalPodWeight) * span
        : 0;
      if (podSpan === 0) return;

      nodes.push({
        id: pod.id,
        ring: "pod",
        parentId: loop.id,
        label: pod.name,
        kind: "pod",
        weight: podWeights[j] ?? 1,
        startAngle: podCursor,
        endAngle: podCursor + podSpan,
        innerRadius: R1,
        outerRadius: R2,
        fill: isOverloaded(pod)
          ? "oklch(0.93 0.06 30)"
          : "oklch(0.945 0.010 85)",
        stroke: "oklch(0.78 0.010 85)",
        accent: POD_TYPE_STROKE[pod.podType],
      });

      // Definition ring — roles attached to this POD (humans first, then agents).
      const roleIds = [...pod.humanRoleIds, ...pod.agentRoleIds];
      const defs = roleIds
        .map((id) => roles.find((r) => r.id === id))
        .filter((r): r is RoleTemplate => !!r);
      if (defs.length === 0) {
        podCursor += podSpan;
        return;
      }
      const defSpan = podSpan / defs.length;
      defs.forEach((role, k) => {
        nodes.push({
          id: role.id,
          ring: "def",
          parentId: pod.id,
          label: role.name,
          kind: "role",
          weight: 1,
          startAngle: podCursor + k * defSpan,
          endAngle: podCursor + (k + 1) * defSpan,
          innerRadius: R2,
          outerRadius: R3,
          fill:
            role.class === "human"
              ? "oklch(0.96 0.010 85)"
              : role.class === "agent"
              ? "oklch(0.94 0.018 285)"
              : "oklch(0.95 0.012 155)",
          stroke: "oklch(0.8 0.010 85)",
        });
      });

      podCursor += podSpan;
    });

    cursor = endAngle;
  });

  return { nodes, size: SIZE };
}

export function sectorPath(s: SectorNode): string {
  const { startAngle, endAngle, innerRadius, outerRadius } = s;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const large = endAngle - startAngle > Math.PI ? 1 : 0;

  // A mission sector spans a full circle; draw as two half-arcs to avoid
  // degenerate single-arc geometry that renders nothing.
  if (endAngle - startAngle >= Math.PI * 2 - 1e-3) {
    return `M ${cx - outerRadius} ${cy} A ${outerRadius} ${outerRadius} 0 1 1 ${
      cx + outerRadius
    } ${cy} A ${outerRadius} ${outerRadius} 0 1 1 ${cx - outerRadius} ${cy} Z`;
  }

  const x1 = cx + innerRadius * Math.cos(startAngle);
  const y1 = cy + innerRadius * Math.sin(startAngle);
  const x2 = cx + outerRadius * Math.cos(startAngle);
  const y2 = cy + outerRadius * Math.sin(startAngle);
  const x3 = cx + outerRadius * Math.cos(endAngle);
  const y3 = cy + outerRadius * Math.sin(endAngle);
  const x4 = cx + innerRadius * Math.cos(endAngle);
  const y4 = cy + innerRadius * Math.sin(endAngle);

  if (innerRadius === 0) {
    return `M ${cx} ${cy} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${x3} ${y3} Z`;
  }

  return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${x1} ${y1} Z`;
}

export function sectorLabelPosition(s: SectorNode): {
  x: number;
  y: number;
  rotate: number;
  flip: boolean;
} {
  const mid = (s.startAngle + s.endAngle) / 2;
  const r = (s.innerRadius + s.outerRadius) / 2;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const x = cx + r * Math.cos(mid);
  const y = cy + r * Math.sin(mid);

  // Rotate to the arc's tangent. Flip so the text reads left-to-right on the
  // lower half of the circle.
  let deg = (mid * 180) / Math.PI + 90;
  let flip = false;
  if (deg > 90 && deg < 270) {
    deg -= 180;
    flip = true;
  }
  return { x, y, rotate: deg, flip };
}

export function ringRadii() {
  return { CENTER_R, R1, R2, R3, SIZE };
}

function isOverloaded(p: PodProtocol): boolean {
  const load = p.accountabilities.reduce(
    (sum, a) => sum + (a.complexityWeight ?? 1),
    0
  );
  return load > p.cognitiveLoadBudget;
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
