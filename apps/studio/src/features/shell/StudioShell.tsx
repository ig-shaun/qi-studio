"use client";

import { useCallback, useEffect, useState } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import type { GraphPatch, InvariantViolation } from "@ixo-studio/core/store";
import { emptyGraph } from "@ixo-studio/core/schema";
import { applyPatchTo } from "@ixo-studio/core/compiler";
import { validateGraph } from "@ixo-studio/core/store";
import { Organism } from "../organism/Organism";
import { Inspector } from "../inspector/Inspector";
import { GenerateModal } from "../compile/GenerateModal";
import { ExportModal } from "../io/ExportModal";
import { ImportButton } from "../io/ImportButton";
import { IntentKernelView } from "../intent/IntentKernelView";
import { ValueLoopsView } from "../loops/ValueLoopsView";
import { PodsView } from "../pods/PodsView";
import { RolesView } from "../roles/RolesView";
import { DelegationsView } from "../delegations/DelegationsView";
import { QiFlowView } from "../flow/QiFlowView";
import { GovernanceView } from "../governance/GovernanceView";
import { ViewStub } from "../views/ViewStub";
import { CommandBar } from "./CommandBar";
import { NavRail } from "./NavRail";
import { VIEWS, type ViewId } from "./views";

const NAV_STATE_KEY = "qi.navExpanded";
const DEFAULT_WORKSPACE_NAME = "AI-native operating model";

export function StudioShell() {
  const [graph, setGraph] = useState<Graph>(emptyGraph());
  const [violations, setViolations] = useState<InvariantViolation[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [activeView, setActiveView] = useState<ViewId>("organism");
  const [navExpanded, setNavExpanded] = useState<boolean>(false);
  const [modal, setModal] = useState<null | "generate" | "export">(null);
  const [workspaceName, setWorkspaceName] = useState<string>(
    DEFAULT_WORKSPACE_NAME
  );

  const applyPatch = useCallback((patch: GraphPatch) => {
    setGraph((g) => applyPatchTo(g, patch));
  }, []);

  useEffect(() => {
    setViolations(validateGraph(graph));
  }, [graph]);

  useEffect(() => {
    const stored = window.localStorage.getItem(NAV_STATE_KEY);
    if (stored === "1") setNavExpanded(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(NAV_STATE_KEY, navExpanded ? "1" : "0");
  }, [navExpanded]);

  const hasGraph = Object.keys(graph.nodes).length > 0;
  const view = VIEWS.find((v) => v.id === activeView) ?? VIEWS[1]!;
  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;

  return (
    <div className="app-shell">
      <CommandBar
        workspaceName={workspaceName}
        onGenerate={() => setModal("generate")}
        {...(hasGraph ? { onExport: () => setModal("export") } : {})}
        importSlot={
          <ImportButton
            onImport={({ graph, violations, workspaceName: name }) => {
              setGraph(graph);
              setViolations(violations);
              setSelectedId(undefined);
              setActiveView("organism");
              if (name) setWorkspaceName(name);
            }}
          />
        }
      />

      <div className="app-grid" data-nav={navExpanded ? "expanded" : "collapsed"}>
        <NavRail
          active={activeView}
          onSelect={(id) => {
            setActiveView(id);
            setSelectedId(undefined);
          }}
          expanded={navExpanded}
          onToggle={() => setNavExpanded((x) => !x)}
        />

        <main className="canvas-panel">
          <header className="canvas-panel__header">
            <div className="canvas-panel__headline">
              <div className="eyebrow">{view.eyebrow}</div>
              <h2>{view.title}</h2>
              <p className="canvas-panel__subtitle">{view.subtitle}</p>
            </div>
            <div className="view-meta">
              {hasGraph && (
                <span
                  className={`meta-pill ${
                    errorCount
                      ? "meta-pill--status-alert"
                      : warningCount
                      ? ""
                      : "meta-pill--status-ok"
                  }`}
                >
                  <span className="meta-pill__label">Invariants</span>
                  <span className="meta-pill__value">
                    {errorCount === 0 && warningCount === 0
                      ? "clean"
                      : `${errorCount} err · ${warningCount} warn`}
                  </span>
                </span>
              )}
              {hasGraph && (
                <span className="meta-pill">
                  <span className="meta-pill__label">Nodes</span>
                  <span className="meta-pill__value">
                    {Object.keys(graph.nodes).length}
                  </span>
                </span>
              )}
            </div>
          </header>

          <section className="canvas-panel__content">
            {!hasGraph ? (
              <EmptyState onGenerate={() => setModal("generate")} />
            ) : activeView === "organism" ? (
              <Organism
                graph={graph}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : activeView === "intent" ? (
              <IntentKernelView graph={graph} onPatch={applyPatch} />
            ) : activeView === "loops" ? (
              <ValueLoopsView graph={graph} onPatch={applyPatch} />
            ) : activeView === "pods" ? (
              <PodsView graph={graph} onPatch={applyPatch} />
            ) : activeView === "roles" ? (
              <RolesView graph={graph} onPatch={applyPatch} />
            ) : activeView === "agents" ? (
              <DelegationsView graph={graph} onPatch={applyPatch} />
            ) : activeView === "flow" ? (
              <QiFlowView graph={graph} onPatch={applyPatch} />
            ) : activeView === "governance" ? (
              <GovernanceView graph={graph} onPatch={applyPatch} />
            ) : (
              <ViewStub title={view.title} />
            )}
          </section>
        </main>

        <Inspector graph={graph} selectedId={selectedId} />
      </div>

      {modal === "generate" && (
        <GenerateModal
          onResult={({ graph, violations }) => {
            setGraph(graph);
            setViolations(violations);
            setSelectedId(undefined);
            setActiveView("organism");
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "export" && (
        <ExportModal
          graph={graph}
          workspaceName={workspaceName}
          violations={violations}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="canvas-empty">
      <div className="canvas-empty__card">
        <div className="eyebrow">No organism yet</div>
        <h3 className="canvas-empty__title">Start from intent.</h3>
        <p className="canvas-empty__body">
          Describe the purpose, outcomes, and sovereignty zones of the
          organization. Claude will unfold the operating model onto the
          canvas.
        </p>
        <button
          type="button"
          className="button button--primary"
          onClick={onGenerate}
          style={{ marginTop: 8 }}
        >
          <span className="button__dot" />
          Generate with AI
        </button>
      </div>
    </div>
  );
}
