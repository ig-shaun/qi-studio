import type { Graph, Node } from "../schema/index.js";

export type GraphDiff = {
  summary: string;
  bullets: string[];
};

// Produce a compact, human-readable delta between two graph snapshots so the
// migration prompt can focus Claude on the change rather than re-reading both
// full graphs. IDs are deliberately absent — we emit node names/purposes so
// the output prose can quote them back verbatim.
export const summarizeGraphDiff = (source: Graph, target: Graph): GraphDiff => {
  const sourceNodes = Object.values(source.nodes);
  const targetNodes = Object.values(target.nodes);
  const sourceIds = new Set(sourceNodes.map((n) => n.id));
  const targetIds = new Set(targetNodes.map((n) => n.id));

  const added = targetNodes.filter((n) => !sourceIds.has(n.id));
  const removed = sourceNodes.filter((n) => !targetIds.has(n.id));

  const byKind = (nodes: Node[]) => {
    const buckets: Record<string, Node[]> = {};
    for (const n of nodes) {
      buckets[n.kind] ??= [];
      buckets[n.kind]!.push(n);
    }
    return buckets;
  };

  const addedBuckets = byKind(added);
  const removedBuckets = byKind(removed);

  const bullets: string[] = [];
  for (const kind of KIND_ORDER) {
    const a = addedBuckets[kind] ?? [];
    const r = removedBuckets[kind] ?? [];
    if (!a.length && !r.length) continue;
    const label = KIND_LABEL_PLURAL[kind] ?? kind;
    const parts: string[] = [];
    if (a.length) parts.push(`added ${a.length} ${label}: ${a.map(labelFor).join(", ")}`);
    if (r.length) parts.push(`retired ${r.length} ${label}: ${r.map(labelFor).join(", ")}`);
    bullets.push(parts.join("; "));
  }

  const sourceEdges = Object.keys(source.edges).length;
  const targetEdges = Object.keys(target.edges).length;
  if (sourceEdges !== targetEdges) {
    bullets.push(
      `interaction edges: ${sourceEdges} → ${targetEdges} (${
        targetEdges - sourceEdges >= 0 ? "+" : ""
      }${targetEdges - sourceEdges})`
    );
  }

  const summary =
    bullets.length === 0
      ? "Source and target graphs have identical node sets; any changes are field-level edits."
      : `${added.length} node${added.length === 1 ? "" : "s"} added, ${removed.length} node${
          removed.length === 1 ? "" : "s"
        } retired across ${bullets.length} node kind${bullets.length === 1 ? "" : "s"}.`;

  return { summary, bullets };
};

const KIND_ORDER = [
  "intent",
  "valueLoop",
  "pod",
  "role",
  "delegation",
  "checkpoint",
  "policy",
] as const;

const KIND_LABEL_PLURAL: Record<string, string> = {
  intent: "intent kernels",
  valueLoop: "value loops",
  pod: "PODs",
  role: "roles",
  delegation: "delegations",
  checkpoint: "checkpoints",
  policy: "policies",
};

// Extract a human label for a node. Matches the dispatch used by the markdown
// renderer so prose stays consistent across exports.
const labelFor = (n: Node): string => {
  switch (n.kind) {
    case "intent":
      return `"${n.purpose}"`;
    case "valueLoop":
    case "pod":
    case "role":
    case "checkpoint":
    case "policy":
      return `"${n.name}"`;
    case "delegation":
      return `"${n.mandate}"`;
  }
};
