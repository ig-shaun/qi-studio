"use client";

import { useState } from "react";
import type { IntentKernel } from "@ixo-studio/core/schema";
import type { GraphPatch, NodePatch } from "@ixo-studio/core/store";
import { Modal } from "../shell/Modal";

type Props = {
  intent: IntentKernel;
  onPatch: (patch: GraphPatch) => void;
  onClose: () => void;
};

const patchId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function ReparseModal({ intent, onPatch, onClose }: Props) {
  const [prompt, setPrompt] = useState(intent.purpose);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reparse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compile/parse-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = (await res.json()) as
        | { passId: string; patch: { ops: Array<{ op: string; node?: IntentKernel }> } }
        | { error: string };
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : `HTTP ${res.status}`);
        return;
      }
      const addOp = json.patch.ops.find((o) => o.op === "add-node" && o.node?.kind === "intent");
      const newKernel = addOp?.node;
      if (!newKernel) {
        setError("Re-parse returned no intent kernel.");
        return;
      }

      // Map AI's freshly-minted ID back onto our existing intent so downstream
      // references (value loops → intent, etc.) stay valid.
      const merged: Partial<IntentKernel> = {
        purpose: newKernel.purpose,
        stakeholders: newKernel.stakeholders,
        outcomes: newKernel.outcomes,
        constraints: newKernel.constraints,
        sovereigntyZones: newKernel.sovereigntyZones,
        principles: newKernel.principles,
        horizon: newKernel.horizon,
        adaptabilityTarget: newKernel.adaptabilityTarget,
      };

      const op: NodePatch = { op: "update-node", id: intent.id, patch: merged };
      onPatch({
        id: patchId(),
        source: "copilot",
        rationale: "Re-parsed intent from prompt",
        ops: [op],
      });
      onClose();
    } catch (err) {
      console.error("[reparse] failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Re-parse intent with AI" onClose={onClose}>
      <p className="inspector-lead" style={{ margin: 0 }}>
        Replace the intent kernel from a fresh prompt. Downstream value loops,
        PODs, roles, and governance stay attached — but their references to
        outcomes may no longer match if you change them substantially.
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
          onClick={reparse}
          disabled={loading || !prompt.trim()}
        >
          <span className="button__dot" />
          {loading ? "Re-parsing…" : "Re-parse"}
        </button>
      </div>
      {error && (
        <p style={{ color: "oklch(0.55 0.15 30)", fontSize: 12, margin: 0 }}>
          {error}
        </p>
      )}
    </Modal>
  );
}
