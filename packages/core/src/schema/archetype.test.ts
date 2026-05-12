import { describe, expect, it } from "vitest";
import {
  ARCHETYPE_POLICIES,
  capabilitiesForArchetype,
  coerceRoleShapeForArchetype,
  isAuthorityScopeAllowedForArchetype,
  materializeDelegationPolicy,
  matchesScopeTemplate,
  ROLE_ARCHETYPES,
} from "./archetype.js";

describe("archetype policy catalog", () => {
  it("defines all nine IXO/Qi archetypes", () => {
    expect(ROLE_ARCHETYPES).toEqual([
      "executor",
      "orchestrator",
      "verifier",
      "sentinel",
      "gatekeeper",
      "curator",
      "auditor",
      "mediator",
      "synthesizer",
    ]);
    for (const archetype of ROLE_ARCHETYPES) {
      expect(ARCHETYPE_POLICIES[archetype].authorityScopes.length).toBeGreaterThan(
        0
      );
      expect(ARCHETYPE_POLICIES[archetype].coreGuardrail).not.toBe("");
    }
  });

  it("coerces role class and agent class from archetype policy", () => {
    expect(coerceRoleShapeForArchetype("orchestrator", "human", null)).toEqual({
      class: "agent",
      agentClass: "orchestration",
    });
    expect(coerceRoleShapeForArchetype("gatekeeper", "agent", "service")).toEqual({
      class: "human",
    });
  });

  it("materializes delegation envelopes deterministically", () => {
    expect(materializeDelegationPolicy("sentinel")).toMatchObject({
      autonomyLevel: "act-with-audit",
      authorityScopes: ["monitor:subscribe", "flow:pause", "incident:create"],
      failureModes: ["Alert fatigue", "Noisy false positives"],
    });
    expect(capabilitiesForArchetype("synthesizer")).toEqual([
      { id: "synth:query", name: "synth:query" },
      { id: "model:invoke:read", name: "model:invoke:read" },
    ]);
  });

  it("matches templated authority scopes", () => {
    expect(matchesScopeTemplate("flow:execute:task-123", "flow:execute:<task-id>")).toBe(
      true
    );
    expect(isAuthorityScopeAllowedForArchetype("executor", "payment:release")).toBe(
      false
    );
  });
});
