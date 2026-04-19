"use client";

import type { Graph } from "@ixo-studio/core/schema";
import { useMemo } from "react";
import { computeLayout, type LayoutNode } from "./layout";

type Props = {
  graph: Graph;
  selectedId?: string | undefined;
  onSelect?: (id: string | undefined) => void;
};

export function Constellation({ graph, selectedId, onSelect }: Props) {
  const layout = useMemo(() => computeLayout(graph), [graph]);
  const nodeById = useMemo(() => {
    const m = new Map<string, LayoutNode>();
    for (const n of layout.nodes) m.set(n.id, n);
    return m;
  }, [layout]);

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Living Constellation"
      onClick={() => onSelect?.(undefined)}
      style={{ background: "#0b0d10", borderRadius: 12 }}
    >
      {/* Ring guides */}
      <circle
        cx={layout.width / 2}
        cy={layout.height / 2}
        r={180}
        fill="none"
        stroke="#1f2937"
        strokeDasharray="2 6"
      />
      <circle
        cx={layout.width / 2}
        cy={layout.height / 2}
        r={320}
        fill="none"
        stroke="#1f2937"
        strokeDasharray="2 6"
      />

      {/* Edges first so they render under nodes */}
      <g>
        {layout.edges.map((e) => {
          const a = nodeById.get(e.fromId);
          const b = nodeById.get(e.toId);
          if (!a || !b) return null;
          const stroke = e.kind === "loop-to-intent" ? "#334155" : "#475569";
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })}
      </g>

      {/* Nodes */}
      <g>
        {layout.nodes.map((n) => {
          const selected = n.id === selectedId;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              style={{ cursor: "pointer" }}
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect?.(n.id);
              }}
            >
              <circle
                r={n.r}
                fill={n.fill}
                stroke={selected ? "#fbbf24" : n.stroke}
                strokeWidth={selected ? 3 : n.strokeWidth}
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#e6e8eb"
                fontSize={n.kind === "intent" ? 12 : 10}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {truncate(n.label, n.kind === "intent" ? 32 : 20)}
              </text>
              {n.badges.length > 0 && (
                <text
                  y={n.r + 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={9}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {n.badges.join(" · ")}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const truncate = (s: string, n: number): string =>
  s.length <= n ? s : `${s.slice(0, n - 1)}…`;
