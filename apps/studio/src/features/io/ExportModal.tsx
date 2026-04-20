"use client";

import type { Graph } from "@ixo-studio/core/schema";
import type { InvariantViolation } from "@ixo-studio/core/store";
import {
  renderWorkspaceMarkdown,
  serializeWorkspace,
} from "@ixo-studio/core/export";
import { Modal } from "../shell/Modal";
import { downloadBlob, slugify } from "./file-utils";

type Props = {
  graph: Graph;
  workspaceName: string;
  violations: InvariantViolation[];
  onClose: () => void;
};

export function ExportModal({ graph, workspaceName, violations, onClose }: Props) {
  const intent = Object.values(graph.nodes).find((n) => n.kind === "intent");
  const baseName = slugify(intent?.purpose ?? workspaceName);
  const stamp = new Date().toISOString().slice(0, 10);

  const exportWorkspace = () => {
    const file = serializeWorkspace({ graph, workspaceName });
    downloadBlob(
      `${baseName}-${stamp}.qi.json`,
      JSON.stringify(file, null, 2),
      "application/json"
    );
    onClose();
  };

  const exportMarkdown = () => {
    const md = renderWorkspaceMarkdown({ graph, workspaceName, violations });
    downloadBlob(`${baseName}-${stamp}.md`, md, "text/markdown");
    onClose();
  };

  const nodeCount = Object.keys(graph.nodes).length;

  return (
    <Modal title="Export workspace" onClose={onClose}>
      <p className="inspector-lead" style={{ margin: 0 }}>
        {nodeCount === 0
          ? "Nothing to export yet — generate a workspace first."
          : `Export the current ${nodeCount}-node operating model.`}
      </p>

      <ul className="export-options">
        <li>
          <button
            type="button"
            className="export-option"
            onClick={exportWorkspace}
            disabled={nodeCount === 0}
          >
            <div className="export-option__title">Workspace file (.qi.json)</div>
            <div className="export-option__desc">
              Full graph + edges, re-importable into Qi Studio. Use this to
              save your work or share it with another studio session.
            </div>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="export-option"
            onClick={exportMarkdown}
            disabled={nodeCount === 0}
          >
            <div className="export-option__title">Report (.md)</div>
            <div className="export-option__desc">
              Human-readable Markdown summarising intent, value loops, PODs,
              roles, delegations, and governance — including any invariant
              violations.
            </div>
          </button>
        </li>
      </ul>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="button button--ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
