"use client";

import { useMemo, useState } from "react";
import type { ChangelogEntry, Scenario } from "@ixo-studio/core/store";

type Props = {
  scenario: Scenario;
};

type Grouped = {
  day: string;
  entries: ChangelogEntry[];
};

export function ChangelogView({ scenario }: Props) {
  const groups = useMemo(() => groupByDay(scenario.changelog), [scenario]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (scenario.changelog.length === 0) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__card">
          <div className="eyebrow">No activity yet</div>
          <h3 className="canvas-empty__title">This scenario is untouched.</h3>
          <p className="canvas-empty__body">
            Every patch applied to <strong>{scenario.name}</strong> — by you, a
            copilot, or the AI compiler — will appear here with a rationale and
            an ops breakdown.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-surface">
      <header className="form-toolbar">
        <div>
          <div className="eyebrow">Changelog</div>
          <p className="form-toolbar__lead">
            {scenario.changelog.length} patch
            {scenario.changelog.length === 1 ? "" : "es"} applied to{" "}
            <strong>{scenario.name}</strong>.
          </p>
        </div>
      </header>

      <div className="changelog">
        {groups.map((g) => (
          <section key={g.day} className="changelog__day">
            <h3 className="changelog__day-header">{formatDayHeader(g.day)}</h3>
            <ol className="changelog__list">
              {[...g.entries]
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .map((entry) => {
                  const isOpen = expanded[entry.id] ?? false;
                  return (
                    <li key={entry.id} className="changelog__entry">
                      <button
                        type="button"
                        className="changelog__row"
                        onClick={() =>
                          setExpanded((cur) => ({ ...cur, [entry.id]: !isOpen }))
                        }
                      >
                        <span className="changelog__time">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span
                          className={`changelog__source changelog__source--${entry.source}`}
                        >
                          {entry.source}
                        </span>
                        <span className="changelog__summary">
                          {entry.summary}
                        </span>
                        {entry.rationale && (
                          <span className="changelog__rationale">
                            — {entry.rationale}
                          </span>
                        )}
                        <span className="changelog__caret" aria-hidden>
                          {isOpen ? "▾" : "▸"}
                        </span>
                      </button>
                      {isOpen && (
                        <dl className="changelog__details">
                          {entry.opCounts.addNode > 0 && (
                            <>
                              <dt>Add node</dt>
                              <dd>{entry.opCounts.addNode}</dd>
                            </>
                          )}
                          {entry.opCounts.updateNode > 0 && (
                            <>
                              <dt>Update node</dt>
                              <dd>{entry.opCounts.updateNode}</dd>
                            </>
                          )}
                          {entry.opCounts.removeNode > 0 && (
                            <>
                              <dt>Remove node</dt>
                              <dd>{entry.opCounts.removeNode}</dd>
                            </>
                          )}
                          {entry.opCounts.addEdge > 0 && (
                            <>
                              <dt>Add edge</dt>
                              <dd>{entry.opCounts.addEdge}</dd>
                            </>
                          )}
                          {entry.opCounts.removeEdge > 0 && (
                            <>
                              <dt>Remove edge</dt>
                              <dd>{entry.opCounts.removeEdge}</dd>
                            </>
                          )}
                          <dt>Total ops</dt>
                          <dd>{entry.opsCount}</dd>
                          <dt>Entry ID</dt>
                          <dd className="changelog__mono">{entry.id}</dd>
                        </dl>
                      )}
                    </li>
                  );
                })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

const groupByDay = (entries: ChangelogEntry[]): Grouped[] => {
  const map = new Map<string, ChangelogEntry[]>();
  for (const e of entries) {
    const day = e.timestamp.slice(0, 10);
    const list = map.get(day);
    if (list) list.push(e);
    else map.set(day, [e]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, entries]) => ({ day, entries }));
};

const formatDayHeader = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};
