import { describe, expect, it } from "vitest";
import {
  IXO_PORTAL_APP_ID,
  IXO_PORTAL_IFRAME_PROTOCOL,
  IXO_PORTAL_IFRAME_VERSION,
  assertExactOrigin,
  buildIxoPortalManifest,
  buildPortalCorsHeaders,
  buildPortalFrameAncestorsCsp,
  createIxoPortalReadyMessage,
  parseExactOrigins,
  validatePortalHostMessage,
  type IxoPortalHostInitPayload,
} from "./contract";

const portalOrigin = "https://portal.example";

function initMessage(overrides: Partial<IxoPortalHostInitPayload> = {}) {
  const payload: IxoPortalHostInitPayload = {
    user: {
      did: "did:ixo:user:abc",
      walletAddress: "ixo1abc",
    },
    host: {
      origin: portalOrigin,
      relayerDid: "did:ixo:relayer:abc",
      locale: "en",
      theme: {
        mode: "light",
        tokens: {},
      },
      viewport: {
        width: 1280,
        height: 720,
        tier: "desktop",
      },
    },
    domain: {
      did: "did:ixo:entity:abc",
      appId: IXO_PORTAL_APP_ID,
      resourceId: "did:ixo:entity:abc#app-01",
      name: "Demo Domain",
    },
    chain: {
      network: "testnet",
      chainName: "ixo",
    },
    ...overrides,
  };

  return {
    protocol: IXO_PORTAL_IFRAME_PROTOCOL,
    version: IXO_PORTAL_IFRAME_VERSION,
    type: "INIT",
    payload,
  };
}

describe("Portal manifest", () => {
  it("builds the Qi Studio app-01 manifest", () => {
    const manifest = buildIxoPortalManifest("https://studio.example");

    expect(manifest.protocol).toBe(IXO_PORTAL_IFRAME_PROTOCOL);
    expect(manifest.appId).toBe("app-01");
    expect(manifest.iframe.src).toBe("https://studio.example/?portal=1");
    expect(manifest.view.defaultMode).toBe("fullscreen");
    expect(manifest.view.fullscreenReturnMode).toBe("domains-panel");
    expect(manifest.capabilities).toEqual([]);
    expect(manifest.features).toEqual({
      resize: false,
      navigate: false,
      transaction: false,
      assistantPrompt: false,
      actionBlock: false,
    });
  });

  it("requires exact HTTPS origins except localhost development", () => {
    expect(assertExactOrigin("https://portal.example")).toBe(
      "https://portal.example"
    );
    expect(assertExactOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
    expect(() => assertExactOrigin("*")).toThrow("Wildcard");
    expect(() => assertExactOrigin("https://portal.example/app")).toThrow(
      "paths"
    );
    expect(() => assertExactOrigin("http://portal.example")).toThrow("HTTPS");
  });

  it("builds CORS and frame-ancestor headers only for configured origins", () => {
    const origins = parseExactOrigins(
      "https://portal.example, http://localhost:3000"
    );

    expect(buildPortalCorsHeaders(portalOrigin, origins)).toMatchObject({
      "Access-Control-Allow-Origin": portalOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    expect(
      buildPortalCorsHeaders("https://unexpected.example", origins)
    ).not.toHaveProperty("Access-Control-Allow-Origin");
    expect(buildPortalFrameAncestorsCsp(origins)).toBe(
      "frame-ancestors 'self' https://portal.example http://localhost:3000;"
    );
  });
});

describe("Portal bridge contract", () => {
  it("creates the READY bootstrap message", () => {
    expect(createIxoPortalReadyMessage()).toEqual({
      protocol: IXO_PORTAL_IFRAME_PROTOCOL,
      version: IXO_PORTAL_IFRAME_VERSION,
      type: "READY",
      payload: {
        capabilities: [],
      },
    });
  });

  it("accepts a valid INIT from an allowed exact origin", () => {
    const result = validatePortalHostMessage({
      data: initMessage(),
      origin: portalOrigin,
      allowedOrigins: [portalOrigin],
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.value.type === "INIT") {
      expect(result.value.type).toBe("INIT");
      expect(result.value.payload.domain.resourceId).toBe(
        "did:ixo:entity:abc#app-01"
      );
    }
  });

  it("accepts duplicate INIT messages as valid updates", () => {
    const data = initMessage();
    const first = validatePortalHostMessage({
      data,
      origin: portalOrigin,
      allowedOrigins: [portalOrigin],
    });
    const second = validatePortalHostMessage({
      data,
      origin: portalOrigin,
      allowedOrigins: [portalOrigin],
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("rejects unexpected origins, malformed messages, and mismatched host origins", () => {
    expect(
      validatePortalHostMessage({
        data: initMessage(),
        origin: "https://unexpected.example",
        allowedOrigins: [portalOrigin],
      })
    ).toMatchObject({ ok: false });

    expect(
      validatePortalHostMessage({
        data: { type: "INIT" },
        origin: portalOrigin,
        allowedOrigins: [portalOrigin],
      })
    ).toMatchObject({ ok: false });

    expect(
      validatePortalHostMessage({
        data: initMessage({
          host: {
            ...initMessage().payload.host,
            origin: "https://other.example",
          },
        }),
        origin: portalOrigin,
        allowedOrigins: [portalOrigin],
      })
    ).toMatchObject({ ok: false });
  });
});
