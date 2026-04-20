"use client";

import { useMemo } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import {
  computeSectors,
  ringRadii,
  sectorLabelPosition,
  sectorPath,
} from "./sectors";

type Props = {
  graph: Graph;
  selectedId?: string | undefined;
  onSelect?: (id: string | undefined) => void;
};

export function Organism({ graph, selectedId, onSelect }: Props) {
  const { nodes, size } = useMemo(() => computeSectors(graph), [graph]);
  const { SIZE, R1, R2, R3, CENTER_R } = ringRadii();

  const ancestors = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const out = new Set<string>([selectedId]);
    let cur = byId.get(selectedId);
    while (cur?.parentId) {
      out.add(cur.parentId);
      cur = byId.get(cur.parentId);
    }
    return out;
  }, [selectedId, nodes]);

  if (nodes.length === 0) return null;

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <div className="organism">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Organism — radial constellation"
        onClick={() => onSelect?.(undefined)}
      >
        {/* Faint ring guides */}
        <g stroke="oklch(0.88 0.006 85)" fill="none" strokeDasharray="2 6">
          <circle cx={cx} cy={cy} r={CENTER_R} />
          <circle cx={cx} cy={cy} r={R1} />
          <circle cx={cx} cy={cy} r={R2} />
          <circle cx={cx} cy={cy} r={R3} />
        </g>

        {/* Sectors — render inner-ring first so outer sectors draw on top */}
        <g>
          {nodes.map((n) => {
            const selected = n.id === selectedId;
            const isAncestor = ancestors.has(n.id);
            const faded = !!selectedId && !isAncestor;
            const fill = selected
              ? "oklch(0.42 0.10 215)"
              : n.fill;
            const stroke = selected
              ? "oklch(0.32 0.10 215)"
              : n.stroke;
            return (
              <path
                key={n.id}
                className={`sector${faded ? " sector--faded" : ""}`}
                d={sectorPath(n)}
                fill={fill}
                stroke={stroke}
                strokeWidth={selected ? 1.9 : 1.1}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(n.id);
                }}
              >
                <title>{n.label}</title>
              </path>
            );
          })}
        </g>

        {/* Accent arcs on outer edge of POD sectors to encode podType */}
        <g fill="none" strokeLinecap="butt">
          {nodes
            .filter((n) => n.ring === "pod" && n.accent)
            .map((n) => {
              const r = n.outerRadius - 1.2;
              const x1 = cx + r * Math.cos(n.startAngle);
              const y1 = cy + r * Math.sin(n.startAngle);
              const x2 = cx + r * Math.cos(n.endAngle);
              const y2 = cy + r * Math.sin(n.endAngle);
              const large = n.endAngle - n.startAngle > Math.PI ? 1 : 0;
              return (
                <path
                  key={`accent-${n.id}`}
                  d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                  stroke={n.accent}
                  strokeWidth={3}
                  opacity={n.id === selectedId ? 0 : 0.9}
                />
              );
            })}
        </g>

        {/* Labels */}
        <g>
          {nodes.map((n) => {
            if (n.ring === "mission") {
              return (
                <text
                  key={`label-${n.id}`}
                  className="sector-label sector-label--center"
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={14}
                >
                  {n.label}
                </text>
              );
            }
            const arc = n.endAngle - n.startAngle;
            const isSelected = n.id === selectedId;
            const faded = !!selectedId && !ancestors.has(n.id);
            if (faded) return null;
            const minArc = n.ring === "def" ? 0.11 : 0.06;
            if (arc < minArc) return null;
            const pos = sectorLabelPosition(n);
            const fontSize =
              n.ring === "objective" ? 14 : n.ring === "pod" ? 12 : 10;
            return (
              <text
                key={`label-${n.id}`}
                className={`sector-label${isSelected ? " sector-label--selected" : ""}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${pos.rotate} ${pos.x} ${pos.y})`}
                fontSize={fontSize}
              >
                {truncateForArc(n.label, arc, n.outerRadius - n.innerRadius)}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function truncateForArc(label: string, arc: number, radialDepth: number): string {
  // Rough character capacity estimate: arc length at mid radius / avg glyph width.
  const capacity = Math.max(6, Math.floor((arc * (radialDepth * 0.55)) / 7));
  return label.length <= capacity ? label : `${label.slice(0, capacity - 1)}…`;
}
