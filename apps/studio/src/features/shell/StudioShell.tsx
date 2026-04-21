"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Graph } from "@ixo-studio/core/schema";
import type {
  ChangelogEntry,
  GraphPatch,
  InvariantViolation,
  Scenario,
  ScenarioBundle,
} from "@ixo-studio/core/store";
import {
  activeScenario as selectActiveScenario,
  changelogEntryFromPatch,
  emptyScenarioBundle,
  TARGET_SCENARIO_ID,
} from "@ixo-studio/core/store";
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
import { FitnessView } from "../fitness/FitnessView";
import { ChangelogView } from "../changelog/ChangelogView";
import { ViewStub } from "../views/ViewStub";
import { CommandBar } from "./CommandBar";
import { NavRail } from "./NavRail";
import { ScenarioSwitcher } from "./ScenarioSwitcher";
import { VIEWS, type ViewId } from "./views";

const NAV_STATE_KEY = "qi.navExpanded";
const DEFAULT_WORKSPACE_NAME = "AI-native operating model";

const randomId = (prefix: string): string => {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${suffix}`;
};

export function StudioShell() {
  const [bundle, setBundle] = useState<ScenarioBundle>(() => emptyScenarioBundle());
  const [violations, setViolations] = useState<InvariantViolation[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [activeView, setActiveView] = useState<ViewId>("organism");
  const [navExpanded, setNavExpanded] = useState<boolean>(false);
  const [modal, setModal] = useState<null | "generate" | "export">(null);
  const [workspaceName, setWorkspaceName] = useState<string>(
    DEFAULT_WORKSPACE_NAME
  );

  const active = useMemo(() => selectActiveScenario(bundle), [bundle]);
  const graph: Graph = active.graph;

  const applyPatch = useCallback((patch: GraphPatch) => {
    setBundle((cur) => {
      const entry = changelogEntryFromPatch(patch);
      return {
        ...cur,
        scenarios: cur.scenarios.map((s) =>
          s.id === cur.activeScenarioId
            ? {
                ...s,
                graph: applyPatchTo(s.graph, patch),
                changelog: [...s.changelog, entry],
                updatedAt: entry.timestamp,
              }
            : s
        ),
      };
    });
  }, []);

  const setActiveScenario = useCallback((id: string) => {
    setBundle((cur) =>
      cur.activeScenarioId === id ? cur : { ...cur, activeScenarioId: id }
    );
    setSelectedId(undefined);
  }, []);

  const renameScenario = useCallback((id: string, name: string) => {
    setBundle((cur) => ({
      ...cur,
      scenarios: cur.scenarios.map((s) =>
        s.id === id ? { ...s, name, updatedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const addScenario = useCallback(({ name }: { name: string }) => {
    setBundle((cur) => {
      const now = new Date().toISOString();
      const maxOrder = cur.scenarios.reduce((m, s) => Math.max(m, s.order), -1);
      const id = randomId("scn");
      const slug = slugify(name) || "custom";
      const newScenario: Scenario = {
        id,
        name,
        slug,
        kind: "custom",
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
        graph: emptyGraph(),
        changelog: [],
      };
      return {
        ...cur,
        scenarios: [...cur.scenarios, newScenario],
        activeScenarioId: id,
      };
    });
    setSelectedId(undefined);
  }, []);

  const duplicateActiveScenario = useCallback(() => {
    setBundle((cur) => {
      const source = cur.scenarios.find((s) => s.id === cur.activeScenarioId);
      if (!source) return cur;
      const now = new Date().toISOString();
      const maxOrder = cur.scenarios.reduce((m, s) => Math.max(m, s.order), -1);
      const id = randomId("scn");
      const name = `${source.name} (copy)`;
      const slug = slugify(name);
      const newScenario: Scenario = {
        id,
        name,
        slug,
        kind: "custom",
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
        graph: structuredCloneSafe(source.graph),
        changelog: [],
      };
      return {
        ...cur,
        scenarios: [...cur.scenarios, newScenario],
        activeScenarioId: id,
      };
    });
    setSelectedId(undefined);
  }, []);

  const removeScenario = useCallback((id: string) => {
    setBundle((cur) => {
      const target = cur.scenarios.find((s) => s.id === id);
      if (!target || target.kind !== "custom") return cur;
      const remaining = cur.scenarios.filter((s) => s.id !== id);
      const nextActive =
        cur.activeScenarioId === id
          ? remaining.find((s) => s.id === TARGET_SCENARIO_ID)?.id ??
            remaining[0]?.id ??
            cur.activeScenarioId
          : cur.activeScenarioId;
      return { ...cur, scenarios: remaining, activeScenarioId: nextActive };
    });
    setSelectedId(undefined);
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
        scenarioSlot={
          <ScenarioSwitcher
            bundle={bundle}
            onSelect={setActiveScenario}
            onAdd={addScenario}
            onDuplicate={duplicateActiveScenario}
            onRename={renameScenario}
            onRemove={removeScenario}
          />
        }
        importSlot={
          <ImportButton
            onImport={({ bundle: importedBundle, workspaceName: name }) => {
              setBundle(importedBundle);
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
            {activeView === "changelog" ? (
              <ChangelogView scenario={active} />
            ) : !hasGraph ? (
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
            ) : activeView === "fitness" ? (
              <FitnessView graph={graph} />
            ) : (
              <ViewStub title={view.title} />
            )}
          </section>
        </main>

        <Inspector graph={graph} selectedId={selectedId} />
      </div>

      {modal === "generate" && (
        <GenerateModal
          bundle={bundle}
          onResult={({ graph: generatedGraph, targetScenarioId }) => {
            setBundle((cur) => ({
              ...cur,
              activeScenarioId: targetScenarioId,
              scenarios: cur.scenarios.map((s) =>
                s.id === targetScenarioId
                  ? {
                      ...s,
                      graph: generatedGraph,
                      changelog: [
                        ...s.changelog,
                        buildCompilerChangelogEntry(generatedGraph),
                      ],
                      updatedAt: new Date().toISOString(),
                    }
                  : s
              ),
            }));
            setSelectedId(undefined);
            setActiveView("organism");
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "export" && (
        <ExportModal
          bundle={bundle}
          workspaceName={workspaceName}
          violationsByScenario={Object.fromEntries(
            bundle.scenarios.map((s) => [s.id, validateGraph(s.graph)])
          )}
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

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

// Deep-clone the graph so edits to the copied scenario don't mutate the source
// scenario's nodes. structuredClone is widely supported; fall back to JSON
// for unlikely legacy environments.
const structuredCloneSafe = <T,>(value: T): T => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const buildCompilerChangelogEntry = (g: Graph): ChangelogEntry => {
  const nodeCount = Object.keys(g.nodes).length;
  const edgeCount = Object.keys(g.edges).length;
  return {
    id: randomId("entry"),
    timestamp: new Date().toISOString(),
    source: "compiler",
    rationale: "Generated from prompt",
    summary: `added ${nodeCount} node${nodeCount === 1 ? "" : "s"} · ${edgeCount} edge${edgeCount === 1 ? "" : "s"}`,
    opsCount: nodeCount + edgeCount,
    opCounts: {
      addNode: nodeCount,
      updateNode: 0,
      removeNode: 0,
      addEdge: edgeCount,
      removeEdge: 0,
    },
  };
};
