"use client";

import { useRef, useState } from "react";
import type { ScenarioBundle } from "@ixo-studio/core/store";
import { parseWorkspace } from "@ixo-studio/core";
import { readFileAsText } from "./file-utils";

type Props = {
  onImport: (args: {
    bundle: ScenarioBundle;
    workspaceName?: string;
    importedVersion: 1 | 2;
  }) => void;
};

export function ImportButton({ onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const text = await readFileAsText(file);
      const parsed = parseWorkspace(text);
      onImport({
        bundle: parsed.bundle,
        importedVersion: parsed.importedVersion,
        ...(parsed.workspaceName ? { workspaceName: parsed.workspaceName } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("[import] failed:", err);
    }
  };

  return (
    <>
      <button
        type="button"
        className="button button--ghost"
        onClick={() => inputRef.current?.click()}
        title="Import a Qi Studio workspace file (.qi.json)"
      >
        Import
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.qi.json,application/json"
        style={{ display: "none" }}
        onChange={onChange}
      />
      {error && (
        <div className="import-error" role="alert">
          Import failed: {error}
        </div>
      )}
    </>
  );
}
