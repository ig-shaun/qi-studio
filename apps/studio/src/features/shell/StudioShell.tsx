"use client";

import { useState } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import type { InvariantViolation } from "@ixo-studio/core/store";
import { emptyGraph } from "@ixo-studio/core/schema";
import { Constellation } from "../constellation/Constellation";
import { Inspector } from "../inspector/Inspector";
import { CompilePanel } from "../compile/CompilePanel";

export function StudioShell() {
  const [graph, setGraph] = useState<Graph>(emptyGraph());
  const [violations, setViolations] = useState<InvariantViolation[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const hasGraph = Object.keys(graph.nodes).length > 0;

  return (
    <main style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>IXO Studio</h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
            Intent compiler and governance simulator — design-time only
          </p>
        </div>
        {hasGraph && (
          <ViolationBadge violations={violations} />
        )}
      </header>
      <div style={layoutStyle}>
        <CompilePanel
          onResult={({ graph, violations }) => {
            setGraph(graph);
            setViolations(violations);
            setSelectedId(undefined);
          }}
        />
        <div style={canvasStyle}>
          {hasGraph ? (
            <Constellation
              graph={graph}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <EmptyState />
          )}
        </div>
        <Inspector
          graph={graph}
          selectedId={selectedId}
          onClose={() => setSelectedId(undefined)}
        />
      </div>
    </main>
  );
}

function ViolationBadge({ violations }: { violations: InvariantViolation[] }) {
  const errors = violations.filter((v) => v.severity === "error").length;
  const warnings = violations.filter((v) => v.severity === "warning").length;
  if (errors === 0 && warnings === 0) {
    return (
      <span style={{ ...badgeStyle, background: "#064e3b", color: "#bbf7d0" }}>
        invariants clean
      </span>
    );
  }
  return (
    <span style={{ ...badgeStyle, background: errors ? "#450a0a" : "#422006", color: errors ? "#fecaca" : "#fde68a" }}>
      {errors} error{errors === 1 ? "" : "s"} · {warnings} warning
      {warnings === 1 ? "" : "s"}
    </span>
  );
}

function EmptyState() {
  return (
    <div style={emptyStyle}>
      <h2 style={{ fontSize: "1rem", margin: 0, color: "#cbd5f5" }}>
        No graph yet.
      </h2>
      <p style={{ color: "#94a3b8", fontSize: 13, maxWidth: 420, textAlign: "center" }}>
        Write an intent prompt on the left and hit Compile. Claude will parse it into an Intent Kernel and unfold value loops, PODs, roles, delegation contracts, and governance checkpoints onto the Living Constellation.
      </p>
    </div>
  );
}

const shellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  padding: "1rem",
  gap: "1rem",
  background: "#0b0d10",
  color: "#e6e8eb",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1fr) 3fr minmax(320px, 1fr)",
  gap: "1rem",
  flex: 1,
  minHeight: 0,
};

const canvasStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1f2937",
  borderRadius: 12,
  minHeight: 480,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.5rem",
  padding: "2rem",
};

const badgeStyle: React.CSSProperties = {
  padding: "0.25rem 0.6rem",
  borderRadius: 999,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
};
