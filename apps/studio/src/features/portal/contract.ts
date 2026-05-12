export const IXO_PORTAL_IFRAME_PROTOCOL = "ixo.portal.iframe.v1" as const;
export const IXO_PORTAL_IFRAME_VERSION = "1.0" as const;
export const IXO_PORTAL_APP_ID = "app-01" as const;
export const IXO_PORTAL_APP_NAME = "Qi Studio" as const;

export type IxoPortalIframeViewMode =
  | "domains"
  | "domains-panel"
  | "fullscreen";

export type IxoPortalIframeReturnMode = Exclude<
  IxoPortalIframeViewMode,
  "fullscreen"
>;

export type IxoPortalCapability = {
  can: string;
  with: string;
};

export type IxoPortalAppManifest = {
  protocol: typeof IXO_PORTAL_IFRAME_PROTOCOL;
  appId: typeof IXO_PORTAL_APP_ID;
  name: typeof IXO_PORTAL_APP_NAME;
  iframe: {
    src: string;
    title: typeof IXO_PORTAL_APP_NAME;
    allowedOrigins?: string[];
  };
  view: {
    defaultMode: IxoPortalIframeViewMode;
    fullscreenReturnMode: IxoPortalIframeReturnMode;
  };
  capabilities: IxoPortalCapability[];
  features: {
    resize: false;
    navigate: false;
    transaction: false;
    assistantPrompt: false;
    actionBlock: false;
  };
};

export type IxoPortalHostInitPayload = {
  user: {
    did: string;
    walletAddress: string;
    workspaceAddress?: string;
    groupAddress?: string;
  };
  host: {
    origin: string;
    relayerDid: string;
    locale: string;
    theme: {
      mode: string;
      tokens: Record<string, string>;
    };
    viewport: {
      width: number;
      height: number;
      tier: "phone" | "tablet" | "laptop" | "desktop";
    };
  };
  domain: {
    did: string;
    appId: string;
    resourceId: string;
    type?: string;
    name?: string;
    image?: string;
  };
  chain: {
    network: string;
    chainName: string;
  };
  ucan?: {
    token: string;
    expiresAt: number;
    capabilities: IxoPortalCapability[];
  };
};

export type IxoPortalHostMessage =
  | {
      protocol: typeof IXO_PORTAL_IFRAME_PROTOCOL;
      version: typeof IXO_PORTAL_IFRAME_VERSION;
      type: "INIT";
      requestId?: string;
      payload: IxoPortalHostInitPayload;
    }
  | {
      protocol: typeof IXO_PORTAL_IFRAME_PROTOCOL;
      version: typeof IXO_PORTAL_IFRAME_VERSION;
      type: "ACTION" | "NAVIGATE" | "EVENT_ACK";
      requestId?: string;
      payload: unknown;
    };

export type IxoPortalReadyMessage = {
  protocol: typeof IXO_PORTAL_IFRAME_PROTOCOL;
  version: typeof IXO_PORTAL_IFRAME_VERSION;
  type: "READY";
  payload: {
    capabilities: [];
  };
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function buildIxoPortalManifest(origin: string): IxoPortalAppManifest {
  const normalizedOrigin = assertExactOrigin(origin);
  const iframeSrc = new URL("/?portal=1", normalizedOrigin).toString();

  return {
    protocol: IXO_PORTAL_IFRAME_PROTOCOL,
    appId: IXO_PORTAL_APP_ID,
    name: IXO_PORTAL_APP_NAME,
    iframe: {
      src: iframeSrc,
      title: IXO_PORTAL_APP_NAME,
    },
    view: {
      defaultMode: "fullscreen",
      fullscreenReturnMode: "domains-panel",
    },
    capabilities: [],
    features: {
      resize: false,
      navigate: false,
      transaction: false,
      assistantPrompt: false,
      actionBlock: false,
    },
  };
}

export function resolveIxoPortalManifestOrigin(
  requestUrl: string,
  configuredOrigin?: string | null
): string {
  const configured = configuredOrigin?.trim();
  if (configured) return assertExactOrigin(configured);
  return assertExactOrigin(new URL(requestUrl).origin);
}

export function createIxoPortalReadyMessage(): IxoPortalReadyMessage {
  return {
    protocol: IXO_PORTAL_IFRAME_PROTOCOL,
    version: IXO_PORTAL_IFRAME_VERSION,
    type: "READY",
    payload: {
      capabilities: [],
    },
  };
}

export function parseExactOrigins(value?: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(assertExactOrigin);
}

export function assertExactOrigin(value: string): string {
  if (value === "*") throw new Error("Wildcard Portal origins are not allowed");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Portal origins must be valid URL origins");
  }

  if (url.origin !== value.replace(/\/$/, "")) {
    throw new Error("Portal origins must not include paths, queries, or fragments");
  }

  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && isLocalDevelopmentHost(url.hostname))
  ) {
    throw new Error(
      "Portal origins must use HTTPS except localhost development origins"
    );
  }

  return url.origin;
}

export function buildPortalCorsHeaders(
  requestOrigin: string | null,
  allowedOrigins: readonly string[]
): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    Vary: "Origin",
  };

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
  }

  return headers;
}

export function buildPortalFrameAncestorsCsp(
  allowedOrigins: readonly string[]
): string | undefined {
  if (allowedOrigins.length === 0) return undefined;
  return `frame-ancestors 'self' ${allowedOrigins.join(" ")};`;
}

export function parseIxoPortalHostMessage(
  input: unknown
): ValidationResult<IxoPortalHostMessage> {
  if (!isRecord(input)) return invalid("Host message must be an object");

  if (input.protocol !== IXO_PORTAL_IFRAME_PROTOCOL) {
    return invalid("Host message protocol is not supported");
  }

  if (input.version !== IXO_PORTAL_IFRAME_VERSION) {
    return invalid("Host message version is not supported");
  }

  if (!isString(input.type)) {
    return invalid("Host message type is missing");
  }

  const requestId = isString(input.requestId) ? input.requestId : undefined;

  if (input.type === "INIT") {
    const payload = parseIxoPortalHostInitPayload(input.payload);
    if (!payload.ok) return payload;
    return valid(withRequestId({
      protocol: IXO_PORTAL_IFRAME_PROTOCOL,
      version: IXO_PORTAL_IFRAME_VERSION,
      type: "INIT",
      payload: payload.value,
    }, requestId));
  }

  if (
    input.type === "ACTION" ||
    input.type === "NAVIGATE" ||
    input.type === "EVENT_ACK"
  ) {
    return valid(withRequestId({
      protocol: IXO_PORTAL_IFRAME_PROTOCOL,
      version: IXO_PORTAL_IFRAME_VERSION,
      type: input.type,
      payload: input.payload,
    }, requestId));
  }

  return invalid("Host message type is not supported");
}

export function validatePortalHostMessage(args: {
  data: unknown;
  origin: string;
  allowedOrigins: readonly string[];
  source?: MessageEventSource | null;
  expectedSource?: MessageEventSource | null;
}): ValidationResult<IxoPortalHostMessage> {
  if (args.allowedOrigins.length === 0) {
    return invalid("No Portal origins are configured");
  }

  if (!args.allowedOrigins.includes(args.origin)) {
    return invalid("Rejected Portal message from unexpected origin");
  }

  if (
    args.expectedSource !== undefined &&
    args.source !== undefined &&
    args.source !== args.expectedSource
  ) {
    return invalid("Rejected Portal message from unexpected source");
  }

  const parsed = parseIxoPortalHostMessage(args.data);
  if (!parsed.ok) return parsed;

  if (
    parsed.value.type === "INIT" &&
    parsed.value.payload.host.origin !== args.origin
  ) {
    return invalid("INIT host origin does not match message origin");
  }

  return parsed;
}

function parseIxoPortalHostInitPayload(
  input: unknown
): ValidationResult<IxoPortalHostInitPayload> {
  if (!isRecord(input)) return invalid("INIT payload must be an object");

  const user = parseUser(input.user);
  if (!user.ok) return user;

  const host = parseHost(input.host);
  if (!host.ok) return host;

  const domain = parseDomain(input.domain);
  if (!domain.ok) return domain;

  const chain = parseChain(input.chain);
  if (!chain.ok) return chain;

  const ucan = input.ucan === undefined ? undefined : parseUcan(input.ucan);
  if (ucan && !ucan.ok) return ucan;

  return valid({
    user: user.value,
    host: host.value,
    domain: domain.value,
    chain: chain.value,
    ...(ucan?.ok ? { ucan: ucan.value } : {}),
  });
}

function parseUser(
  input: unknown
): ValidationResult<IxoPortalHostInitPayload["user"]> {
  if (!isRecord(input)) return invalid("INIT user must be an object");
  if (!isString(input.did)) return invalid("INIT user.did must be a string");
  if (!isString(input.walletAddress)) {
    return invalid("INIT user.walletAddress must be a string");
  }

  return valid({
    did: input.did,
    walletAddress: input.walletAddress,
    ...(isString(input.workspaceAddress)
      ? { workspaceAddress: input.workspaceAddress }
      : {}),
    ...(isString(input.groupAddress) ? { groupAddress: input.groupAddress } : {}),
  });
}

function parseHost(
  input: unknown
): ValidationResult<IxoPortalHostInitPayload["host"]> {
  if (!isRecord(input)) return invalid("INIT host must be an object");
  if (!isString(input.origin)) return invalid("INIT host.origin must be a string");
  if (!isString(input.relayerDid)) {
    return invalid("INIT host.relayerDid must be a string");
  }
  if (!isString(input.locale)) return invalid("INIT host.locale must be a string");

  const theme = parseTheme(input.theme);
  if (!theme.ok) return theme;

  const viewport = parseViewport(input.viewport);
  if (!viewport.ok) return viewport;

  return valid({
    origin: input.origin,
    relayerDid: input.relayerDid,
    locale: input.locale,
    theme: theme.value,
    viewport: viewport.value,
  });
}

function parseTheme(
  input: unknown
): ValidationResult<IxoPortalHostInitPayload["host"]["theme"]> {
  if (!isRecord(input)) return invalid("INIT host.theme must be an object");
  if (!isString(input.mode)) return invalid("INIT host.theme.mode must be a string");
  if (!isStringRecord(input.tokens)) {
    return invalid("INIT host.theme.tokens must be a string record");
  }

  return valid({
    mode: input.mode,
    tokens: input.tokens,
  });
}

function parseViewport(
  input: unknown
): ValidationResult<IxoPortalHostInitPayload["host"]["viewport"]> {
  if (!isRecord(input)) return invalid("INIT host.viewport must be an object");
  if (!isNonNegativeNumber(input.width)) {
    return invalid("INIT host.viewport.width must be a non-negative number");
  }
  if (!isNonNegativeNumber(input.height)) {
    return invalid("INIT host.viewport.height must be a non-negative number");
  }
  if (!isViewportTier(input.tier)) {
    return invalid("INIT host.viewport.tier is not supported");
  }

  return valid({
    width: input.width,
    height: input.height,
    tier: input.tier,
  });
}

function parseDomain(
  input: unknown
): ValidationResult<IxoPortalHostInitPayload["domain"]> {
  if (!isRecord(input)) return invalid("INIT domain must be an object");
  if (!isString(input.did)) return invalid("INIT domain.did must be a string");
  if (!isString(input.appId)) return invalid("INIT domain.appId must be a string");
  if (!isString(input.resourceId)) {
    return invalid("INIT domain.resourceId must be a string");
  }

  return valid({
    did: input.did,
    appId: input.appId,
    resourceId: input.resourceId,
    ...(isString(input.type) ? { type: input.type } : {}),
    ...(isString(input.name) ? { name: input.name } : {}),
    ...(isString(input.image) ? { image: input.image } : {}),
  });
}

function parseChain(
  input: unknown
): ValidationResult<IxoPortalHostInitPayload["chain"]> {
  if (!isRecord(input)) return invalid("INIT chain must be an object");
  if (!isString(input.network)) return invalid("INIT chain.network must be a string");
  if (!isString(input.chainName)) {
    return invalid("INIT chain.chainName must be a string");
  }

  return valid({
    network: input.network,
    chainName: input.chainName,
  });
}

function parseUcan(
  input: unknown
): ValidationResult<NonNullable<IxoPortalHostInitPayload["ucan"]>> {
  if (!isRecord(input)) return invalid("INIT ucan must be an object");
  if (!isString(input.token)) return invalid("INIT ucan.token must be a string");
  if (!isNumber(input.expiresAt)) {
    return invalid("INIT ucan.expiresAt must be a number");
  }

  const capabilities = parseCapabilities(input.capabilities);
  if (!capabilities.ok) return capabilities;

  return valid({
    token: input.token,
    expiresAt: input.expiresAt,
    capabilities: capabilities.value,
  });
}

function parseCapabilities(
  input: unknown
): ValidationResult<IxoPortalCapability[]> {
  if (!Array.isArray(input)) {
    return invalid("INIT ucan.capabilities must be an array");
  }

  const capabilities: IxoPortalCapability[] = [];
  for (const item of input) {
    if (!isRecord(item) || !isString(item.can) || !isString(item.with)) {
      return invalid("INIT capability entries must include can and with");
    }
    capabilities.push({ can: item.can, with: item.with });
  }

  return valid(capabilities);
}

function withRequestId<T extends { requestId?: string }>(
  value: Omit<T, "requestId">,
  requestId: string | undefined
): T {
  return {
    ...value,
    ...(requestId ? { requestId } : {}),
  } as T;
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every(isString);
}

function isViewportTier(
  value: unknown
): value is IxoPortalHostInitPayload["host"]["viewport"]["tier"] {
  return (
    value === "phone" ||
    value === "tablet" ||
    value === "laptop" ||
    value === "desktop"
  );
}

function valid<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function invalid<T = never>(error: string): ValidationResult<T> {
  return { ok: false, error };
}
