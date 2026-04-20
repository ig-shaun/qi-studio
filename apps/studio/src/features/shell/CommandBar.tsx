"use client";

import { BrandMark, SearchIcon } from "./icons";

type Props = {
  workspaceName: string;
  onGenerate: () => void;
  onStressTest?: () => void;
  onExport?: () => void;
};

export function CommandBar({
  workspaceName,
  onGenerate,
  onStressTest,
  onExport,
}: Props) {
  return (
    <header className="command-bar">
      <div className="brand-cluster">
        <BrandMark className="brand-mark" />
        <div className="brand-copy">
          <div className="brand-wordmark">Qi Studio</div>
          <div className="eyebrow">Intent-first operating model</div>
        </div>
      </div>

      <div className="workspace-chip">
        <span className="workspace-chip__label">Workspace</span>
        <span className="workspace-chip__value">{workspaceName}</span>
        <span className="workspace-chip__dot" aria-hidden />
      </div>

      <label className="search-field" aria-label="Search">
        <SearchIcon className="search-field__icon" />
        <input
          type="search"
          placeholder="Search PODs, roles, agents, flows…"
          autoComplete="off"
        />
        <kbd className="search-field__kbd">⌘K</kbd>
      </label>

      <div className="command-actions">
        <button className="button button--primary" onClick={onGenerate}>
          <span className="button__dot" />
          Generate with AI
        </button>
        <button
          className="button button--secondary"
          onClick={onStressTest}
          disabled={!onStressTest}
        >
          Stress test
        </button>
        <button
          className="button button--ghost"
          onClick={onExport}
          disabled={!onExport}
        >
          Export
        </button>
      </div>
    </header>
  );
}
