"use client";

import { useState } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import type { InvariantViolation } from "@ixo-studio/core/store";
import type { PassResult } from "@ixo-studio/core/compiler";

type CompileResponse = {
  graph: Graph;
  results: PassResult[];
  violations: InvariantViolation[];
};

type Props = {
  onResult: (r: CompileResponse) => void;
};

export function CompilePanel({ onResult }: Props) {
  const [prompt, setPrompt] = useState(
    "Build a climate-intent cooperative focused on smallholder carbon verification in East Africa. Values: scientific rigor, farmer sovereignty, regulatory trust. Horizon: 1 year."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PassResult[] | null>(null);

  async function compile() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = (await res.json()) as CompileResponse | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : `HTTP ${res.status}`);
        return;
      }
      setResults(json.results);
      onResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={panelStyle}>
      <label
        style={{ fontSize: 11, letterSpacing: 1, color: "#94a3b8", textTransform: "uppercase" }}
      >
        Intent prompt
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={6}
        style={textareaStyle}
      />
      <button onClick={compile} disabled={loading || !prompt.trim()} style={buttonStyle}>
        {loading ? "Compiling…" : "Compile intent"}
      </button>
      {error && <p style={{ color: "#f87171", fontSize: 12 }}>{error}</p>}
      {results && (
        <ul style={{ margin: "0.75rem 0 0", padding: 0, listStyle: "none" }}>
          {results.map((r) => (
            <li key={r.patch.id} style={{ padding: "0.4rem 0", borderTop: "1px solid #1f2937" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                {r.passId}
              </div>
              <div style={{ fontSize: 12, color: "#e6e8eb" }}>
                {r.patch.rationale || r.notes || "no-op"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  minWidth: 320,
  maxWidth: 420,
};

const textareaStyle: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 8,
  padding: "0.6rem",
  color: "#e6e8eb",
  fontFamily: "inherit",
  fontSize: 13,
  lineHeight: 1.4,
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  background: "#2563eb",
  border: "none",
  color: "white",
  padding: "0.6rem 0.8rem",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500,
};
