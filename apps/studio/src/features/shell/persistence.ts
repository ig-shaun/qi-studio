import {
  DEFAULT_SCENARIOS,
  ScenarioBundle,
  type ScenarioBundle as ScenarioBundleType,
} from "@ixo-studio/core/store";
import { VIEWS, type ViewId } from "./views";

const STORAGE_KEY = "qi.studioState.v1";

// The default the shell seeds on first load. Kept here (not in the shell) so
// the dirty-check can compare against it without a circular import.
export const DEFAULT_WORKSPACE_NAME = "AI-native operating model";

export type Modal = null | "generate" | "export";

export type PersistedState = {
  bundle: ScenarioBundleType;
  selectedId?: string;
  activeView: ViewId;
  modal: Modal;
  workspaceName: string;
};

const VALID_VIEW_IDS = new Set<ViewId>(VIEWS.map((v) => v.id));
const DEFAULT_SCENARIO_IDS = new Set(DEFAULT_SCENARIOS.map((s) => s.id));

const isModal = (v: unknown): v is Modal =>
  v === null || v === "generate" || v === "export";

const isViewId = (v: unknown): v is ViewId =>
  typeof v === "string" && VALID_VIEW_IDS.has(v as ViewId);

export const loadPersistedState = (): PersistedState | null => {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const bundleResult = ScenarioBundle.safeParse(obj["bundle"]);
  if (!bundleResult.success) return null;
  if (!isViewId(obj["activeView"])) return null;
  if (!isModal(obj["modal"])) return null;
  if (typeof obj["workspaceName"] !== "string") return null;
  const rawSelectedId = obj["selectedId"];
  if (
    rawSelectedId !== undefined &&
    rawSelectedId !== null &&
    typeof rawSelectedId !== "string"
  ) {
    return null;
  }

  const bundle = bundleResult.data;
  // Repair pointers that no longer resolve so the UI never opens in a broken
  // state: an active scenario that was removed, or a selectedId whose node
  // was deleted.
  const scenarioIds = new Set(bundle.scenarios.map((s) => s.id));
  if (!scenarioIds.has(bundle.activeScenarioId)) {
    bundle.activeScenarioId =
      bundle.scenarios[0]?.id ?? bundle.activeScenarioId;
  }
  const active = bundle.scenarios.find((s) => s.id === bundle.activeScenarioId);
  const selectedId =
    typeof rawSelectedId === "string" &&
    active &&
    active.graph.nodes[rawSelectedId]
      ? rawSelectedId
      : undefined;

  const state: PersistedState = {
    bundle,
    activeView: obj["activeView"],
    modal: obj["modal"],
    workspaceName: obj["workspaceName"],
    ...(selectedId !== undefined ? { selectedId } : {}),
  };
  return state;
};

export const savePersistedState = (state: PersistedState): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded, private browsing with storage disabled, etc. The
    // beforeunload prompt is the fallback safety net for users in this state.
  }
};

export const clearPersistedState = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

// True if the session has diverged from a brand-new workspace. Drives the
// beforeunload prompt — we don't nag users who haven't typed anything.
export const hasDirtyContent = (
  bundle: ScenarioBundleType,
  workspaceName: string
): boolean => {
  if (workspaceName !== DEFAULT_WORKSPACE_NAME) return true;
  for (const s of bundle.scenarios) {
    if (Object.keys(s.graph.nodes).length > 0) return true;
    if (Object.keys(s.graph.edges).length > 0) return true;
    if (s.changelog.length > 0) return true;
    if (!DEFAULT_SCENARIO_IDS.has(s.id)) return true;
  }
  return false;
};
