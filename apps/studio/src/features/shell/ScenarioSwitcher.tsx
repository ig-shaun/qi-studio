"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Scenario, ScenarioBundle } from "@ixo-studio/core/store";
import { activeScenario as selectActiveScenario } from "@ixo-studio/core/store";

type Props = {
  bundle: ScenarioBundle;
  onSelect: (scenarioId: string) => void;
  onAdd: (args: { name: string }) => void;
  onDuplicate: () => void;
  onRename: (scenarioId: string, name: string) => void;
  onRemove: (scenarioId: string) => void;
};

export function ScenarioSwitcher({
  bundle,
  onSelect,
  onAdd,
  onDuplicate,
  onRename,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useMemo(() => selectActiveScenario(bundle), [bundle]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setRenamingId(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sorted = useMemo(
    () => [...bundle.scenarios].sort((a, b) => a.order - b.order),
    [bundle.scenarios]
  );

  const startRename = (scenario: Scenario) => {
    setRenamingId(scenario.id);
    setRenameDraft(scenario.name);
  };

  const commitRename = () => {
    if (!renamingId) return;
    const trimmed = renameDraft.trim();
    if (trimmed) onRename(renamingId, trimmed);
    setRenamingId(null);
  };

  const addCustom = () => {
    const name = window.prompt("New scenario name", "Custom scenario");
    if (name && name.trim()) onAdd({ name: name.trim() });
  };

  return (
    <div className="scenario-switcher" ref={rootRef}>
      <button
        type="button"
        className="workspace-chip scenario-switcher__trigger"
        onClick={() => setOpen((x) => !x)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="workspace-chip__label">Scenario</span>
        <span className="workspace-chip__value">{active.name}</span>
        <span
          className={`workspace-chip__dot${
            Object.keys(active.graph.nodes).length === 0
              ? " workspace-chip__dot--muted"
              : ""
          }`}
          aria-hidden
        />
        <span className="scenario-switcher__chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="scenario-switcher__popover" role="listbox">
          <ul className="scenario-switcher__list">
            {sorted.map((s) => {
              const nodeCount = Object.keys(s.graph.nodes).length;
              const isActive = s.id === bundle.activeScenarioId;
              const canModify = s.kind === "custom";
              const isRenaming = renamingId === s.id;
              return (
                <li
                  key={s.id}
                  className={`scenario-switcher__item${
                    isActive ? " scenario-switcher__item--active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="scenario-switcher__row"
                    onClick={() => {
                      if (isRenaming) return;
                      onSelect(s.id);
                      setOpen(false);
                    }}
                    onDoubleClick={() => startRename(s)}
                  >
                    <span
                      className={`scenario-switcher__dot${
                        nodeCount === 0 ? " scenario-switcher__dot--muted" : ""
                      }`}
                      aria-hidden
                    />
                    <div className="scenario-switcher__meta">
                      {isRenaming ? (
                        <input
                          autoFocus
                          className="scenario-switcher__rename"
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="scenario-switcher__name">{s.name}</div>
                      )}
                      <div className="scenario-switcher__sub">
                        {nodeCount} node{nodeCount === 1 ? "" : "s"} ·{" "}
                        {formatRelative(s.updatedAt)}
                      </div>
                    </div>
                  </button>
                  <div className="scenario-switcher__actions">
                    <button
                      type="button"
                      className="scenario-switcher__icon"
                      title="Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(s);
                      }}
                    >
                      ✎
                    </button>
                    {canModify && (
                      <button
                        type="button"
                        className="scenario-switcher__icon"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete scenario "${s.name}"?`)) {
                            onRemove(s.id);
                          }
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="scenario-switcher__footer">
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => {
                addCustom();
                setOpen(false);
              }}
            >
              + New scenario
            </button>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => {
                onDuplicate();
                setOpen(false);
              }}
            >
              Duplicate current
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const formatRelative = (iso: string): string => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const ms = Date.now() - t;
  const m = Math.round(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};
