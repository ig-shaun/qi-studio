"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createIxoPortalReadyMessage,
  parseExactOrigins,
  validatePortalHostMessage,
  type IxoPortalHostInitPayload,
} from "./contract";

export type IxoPortalBridgeStatus =
  | "standalone"
  | "waiting"
  | "connected"
  | "error";

export type IxoPortalBridgeState = {
  isPortalMode: boolean;
  status: IxoPortalBridgeStatus;
  initPayload: IxoPortalHostInitPayload | null;
  targetOrigin: string | null;
  lastError: string | null;
};

const defaultState: IxoPortalBridgeState = {
  isPortalMode: false,
  status: "standalone",
  initPayload: null,
  targetOrigin: null,
  lastError: null,
};

const IxoPortalContext = createContext<IxoPortalBridgeState>(defaultState);

export function IxoPortalProvider({ children }: { children: ReactNode }) {
  const [isPortalMode, setIsPortalMode] = useState(false);
  const [bridgeState, setBridgeState] =
    useState<Omit<IxoPortalBridgeState, "isPortalMode">>({
      status: "standalone",
      initPayload: null,
      targetOrigin: null,
      lastError: null,
    });
  const parentRef = useRef<MessageEventSource | null>(null);

  const allowedOrigins = useMemo(() => {
    try {
      return parseExactOrigins(
        process.env.NEXT_PUBLIC_IXO_PORTAL_ALLOWED_ORIGINS ?? ""
      );
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsPortalMode(params.get("portal") === "1");
    parentRef.current = window.parent;
  }, []);

  useEffect(() => {
    if (!isPortalMode) {
      setBridgeState({
        status: "standalone",
        initPayload: null,
        targetOrigin: null,
        lastError: null,
      });
      return undefined;
    }

    if (typeof allowedOrigins === "string") {
      setBridgeState({
        status: "error",
        initPayload: null,
        targetOrigin: null,
        lastError: allowedOrigins,
      });
      return undefined;
    }

    if (allowedOrigins.length === 0) {
      setBridgeState({
        status: "error",
        initPayload: null,
        targetOrigin: null,
        lastError: "NEXT_PUBLIC_IXO_PORTAL_ALLOWED_ORIGINS is not configured.",
      });
      return undefined;
    }

    setBridgeState({
      status: "waiting",
      initPayload: null,
      targetOrigin: null,
      lastError: null,
    });

    const handleMessage = (event: MessageEvent) => {
      const parsed = validatePortalHostMessage({
        data: event.data,
        origin: event.origin,
        source: event.source,
        expectedSource: parentRef.current,
        allowedOrigins,
      });

      if (!parsed.ok) {
        setBridgeState((current) => ({
          ...current,
          lastError: parsed.error,
        }));
        return;
      }

      if (parsed.value.type !== "INIT") return;

      setBridgeState({
        status: "connected",
        initPayload: parsed.value.payload,
        targetOrigin: event.origin,
        lastError: null,
      });
    };

    window.addEventListener("message", handleMessage);
    window.parent.postMessage(createIxoPortalReadyMessage(), "*");

    return () => window.removeEventListener("message", handleMessage);
  }, [allowedOrigins, isPortalMode]);

  const value = useMemo<IxoPortalBridgeState>(
    () => ({
      isPortalMode,
      ...bridgeState,
    }),
    [bridgeState, isPortalMode]
  );

  return (
    <IxoPortalContext.Provider value={value}>
      {children}
    </IxoPortalContext.Provider>
  );
}

export function useIxoPortal(): IxoPortalBridgeState {
  return useContext(IxoPortalContext);
}
