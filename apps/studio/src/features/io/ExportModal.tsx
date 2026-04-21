"use client";

import type {
  InvariantViolation,
  ScenarioBundle,
} from "@ixo-studio/core/store";
import {
  renderWorkspaceMarkdown,
  serializeWorkspace,
} from "@ixo-studio/core/export";
import { Modal } from "../shell/Modal";
import { downloadBlob, slugify } from "./file-utils";

type Props = {
  bundle: ScenarioBundle;
  workspaceName: string;
  violationsByScenario: Record<string, InvariantViolation[]>;
  onClose: () => void;
};

export function ExportModal({
  bundle,
  workspaceName,
  violationsByScenario,
  onClose,
}: Props) {
  const totalNodes = bundle.scenarios.reduce(
    (sum, s) => sum + Object.keys(s.graph.nodes).length,
    0
  );

  // Prefer the active scenario's intent purpose, else the workspace name.
  const active = bundle.scenarios.find((s) => s.id === bundle.activeScenarioId);
  const activeIntent = active
    ? Object.values(active.graph.nodes).find((n) => n.kind === "intent")
    : undefined;
  const baseName = slugify(
    (activeIntent && activeIntent.kind === "intent" ? activeIntent.purpose : null) ??
      workspaceName
  );
  const stamp = timestampForFilename();
  const populatedScenarios = bundle.scenarios.filter(
    (s) => Object.keys(s.graph.nodes).length > 0
  ).length;

  const exportWorkspace = () => {
    const file = serializeWorkspace({ bundle, workspaceName });
    downloadBlob(
      `${baseName}-${stamp}.qi.json`,
      JSON.stringify(file, null, 2),
      "application/json"
    );
    onClose();
  };

  const exportMarkdown = () => {
    const md = renderWorkspaceMarkdown({
      bundle,
      workspaceName,
      violationsByScenario,
    });
    downloadBlob(`${baseName}-${stamp}.md`, md, "text/markdown");
    onClose();
  };

  return (
    <Modal title="Export workspace" onClose={onClose}>
      <p className="inspector-lead" style={{ margin: 0 }}>
        {totalNodes === 0
          ? "Nothing to export yet — generate a workspace first."
          : `Exporting ${populatedScenarios} populated scenario${
              populatedScenarios === 1 ? "" : "s"
            } across ${bundle.scenarios.length} total (${totalNodes} node${
              totalNodes === 1 ? "" : "s"
            }).`}
      </p>

      <ul className="export-options">
        <li>
          <button
            type="button"
            className="export-option"
            onClick={exportWorkspace}
            disabled={totalNodes === 0}
          >
            <div className="export-option__title">Workspace file (.qi.json)</div>
            <div className="export-option__desc">
              All scenarios with their graphs, edges, and changelogs.
              Re-importable into Qi Studio. Use this to save your work or
              share it with another studio session.
            </div>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="export-option"
            onClick={exportMarkdown}
            disabled={totalNodes === 0}
          >
            <div className="export-option__title">Report (.md)</div>
            <div className="export-option__desc">
              Human-readable Markdown emitting each scenario in order with its
              intent, value loops, PODs, roles, delegations, governance,
              invariant violations, and per-scenario changelog.
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

// YYYY-MM-DD-HHmm in local time, for filenames.
const timestampForFilename = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`;
};
