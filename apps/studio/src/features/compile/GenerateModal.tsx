"use client";

import { useState } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import type { InvariantViolation } from "@ixo-studio/core/store";
import type { PassResult } from "@ixo-studio/core/compiler";
import { Modal } from "../shell/Modal";

type CompileResponse = {
  graph: Graph;
  results: PassResult[];
  violations: InvariantViolation[];
};

type Props = {
  onResult: (r: CompileResponse) => void;
  onClose: () => void;
};

const DEFAULT_PROMPT =
  "Build a climate-intent cooperative focused on smallholder carbon verification in East Africa. Values: scientific rigor, farmer sovereignty, regulatory trust. Horizon: 1 year.";

export function GenerateModal({ onResult, onClose }: Props) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Generate with AI" onClose={onClose}>
      <p className="inspector-lead" style={{ margin: 0 }}>
        Describe the organization's intent. Claude will parse it into an Intent
        Kernel and unfold value loops, PODs, roles, delegation contracts, and
        governance checkpoints.
      </p>
      <textarea
        className="textarea"
        rows={7}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="button button--ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="button button--primary"
          onClick={compile}
          disabled={loading || !prompt.trim()}
        >
          <span className="button__dot" />
          {loading ? "Compiling…" : "Compile intent"}
        </button>
      </div>
      {error && (
        <p style={{ color: "oklch(0.55 0.15 30)", fontSize: 12, margin: 0 }}>
          {error}
        </p>
      )}
      {results && (
        <ul className="compile-log">
          {results.map((r) => (
            <li key={r.patch.id} className="compile-log__item">
              <div className="compile-log__pass">{r.passId}</div>
              <div className="compile-log__rationale">
                {r.patch.rationale || r.notes || "no-op"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
