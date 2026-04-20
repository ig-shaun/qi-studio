"use client";

import { useState } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import type { InvariantViolation } from "@ixo-studio/core/store";
import type { PassResult } from "@ixo-studio/core/compiler";
import { Modal } from "../shell/Modal";

type CompileResult = {
  graph: Graph;
  results: PassResult[];
  violations: InvariantViolation[];
};

type Props = {
  onResult: (r: CompileResult) => void;
  onClose: () => void;
};

const DEFAULT_PROMPT =
  "Build a climate-intent cooperative focused on smallholder carbon verification in East Africa. Values: scientific rigor, farmer sovereignty, regulatory trust. Horizon: 1 year.";

const PASS_LABELS: Record<string, string> = {
  parseIntent: "Parsing intent kernel",
  synthesizeValueLoops: "Synthesizing value loops",
  emergePods: "Emerging PODs",
  composeRoles: "Composing roles",
  placeAgents: "Placing agents",
  synthesizeGovernance: "Synthesizing governance",
  wireFlows: "Wiring flows",
  evaluateFitness: "Evaluating fitness",
  generatePath: "Generating path",
};

type PassStatus = "pending" | "running" | "done";
type PassRow = {
  passId: string;
  status: PassStatus;
  rationale?: string;
  opCount?: number;
};

type StreamEvent =
  | { type: "plan"; passes: string[] }
  | { type: "pass-start"; passId: string }
  | { type: "pass-done"; passId: string; rationale?: string; opCount?: number }
  | { type: "done"; graph: Graph; results: PassResult[]; violations: InvariantViolation[] }
  | { type: "error"; message: string };

export function GenerateModal({ onResult, onClose }: Props) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passes, setPasses] = useState<PassRow[]>([]);

  async function compile() {
    setLoading(true);
    setError(null);
    setPasses([]);

    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          handleEvent(event);
        }
      }
    } catch (err) {
      console.error("[compile] request failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }

    function handleEvent(event: StreamEvent) {
      if (event.type === "plan") {
        setPasses(event.passes.map((p) => ({ passId: p, status: "pending" })));
        return;
      }
      if (event.type === "pass-start") {
        setPasses((cur) =>
          cur.map((p) =>
            p.passId === event.passId ? { ...p, status: "running" } : p
          )
        );
        return;
      }
      if (event.type === "pass-done") {
        setPasses((cur) =>
          cur.map((p) => {
            if (p.passId !== event.passId) return p;
            const next: PassRow = { ...p, status: "done" };
            if (event.rationale !== undefined) next.rationale = event.rationale;
            if (event.opCount !== undefined) next.opCount = event.opCount;
            return next;
          })
        );
        return;
      }
      if (event.type === "done") {
        onResult({
          graph: event.graph,
          results: event.results,
          violations: event.violations,
        });
        onClose();
        return;
      }
      if (event.type === "error") {
        setError(event.message);
      }
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
        disabled={loading}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="button button--ghost"
          onClick={onClose}
          disabled={loading}
        >
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
      {passes.length > 0 && (
        <ul className="compile-log">
          {passes.map((p) => (
            <li
              key={p.passId}
              className={`compile-log__item compile-log__item--${p.status}`}
            >
              <div className="compile-log__status" aria-hidden>
                {p.status === "done" ? "✓" : p.status === "running" ? "…" : "·"}
              </div>
              <div className="compile-log__body">
                <div className="compile-log__pass">
                  {PASS_LABELS[p.passId] ?? p.passId}
                </div>
                {p.rationale && (
                  <div className="compile-log__rationale">{p.rationale}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
