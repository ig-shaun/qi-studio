"use client";

import { ChevronRight, icons } from "./icons";
import { VIEWS, type ViewId } from "./views";

type Props = {
  active: ViewId;
  onSelect: (id: ViewId) => void;
  expanded: boolean;
  onToggle: () => void;
};

export function NavRail({ active, onSelect, expanded, onToggle }: Props) {
  return (
    <nav className="nav-rail" aria-label="Primary">
      <button
        type="button"
        className="nav-toggle"
        aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <ChevronRight style={{ width: 12, height: 12 }} />
      </button>
      <div className="nav-rail__list">
        {VIEWS.map((v) => {
          const Icon = icons[v.id];
          return (
            <button
              key={v.id}
              type="button"
              className="nav-button"
              data-active={active === v.id}
              onClick={() => onSelect(v.id)}
              title={v.label}
            >
              <Icon className="nav-button__icon" />
              <span className="nav-button__label">{v.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
