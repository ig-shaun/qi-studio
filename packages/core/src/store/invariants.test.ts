import { describe, expect, it } from "vitest";
import type { Graph } from "../schema/index.js";
import { validateGraph } from "./invariants.js";

const baseGraph = (): Graph => ({
  intentId: "intent_1",
  nodes: {
    intent_1: {
      id: "intent_1",
      kind: "intent",
      purpose: "Verify smallholder carbon",
      stakeholders: [],
      outcomes: [{ id: "o1", statement: "Verified tonnes issued" }],
      constraints: [],
      sovereigntyZones: [],
      principles: [],
      horizon: "1y",
      adaptabilityTarget: "adaptive",
    },
    loop_1: {
      id: "loop_1",
      kind: "valueLoop",
      name: "Verification loop",
      purpose: "",
      intentId: "intent_1",
      outcomeRefs: ["o1"],
      triggerSignals: [],
      outputs: [],
      criticality: "high",
    },
    role_human: {
      id: "role_human",
      kind: "role",
      name: "Verification Lead",
      class: "human",
      purpose: "",
      capabilities: [],
      accountabilities: [],
      decisionRights: [],
      incumbentCount: 1,
    },
    role_agent: {
      id: "role_agent",
      kind: "role",
      name: "Remote Sensing Agent",
      class: "agent",
      agentClass: "service",
      purpose: "",
      capabilities: [],
      accountabilities: [],
      decisionRights: [],
      incumbentCount: 0,
    },
    pod_1: {
      id: "pod_1",
      kind: "pod",
      name: "Verification POD",
      purpose: "",
      primaryLoopId: "loop_1",
      podType: "stream-aligned",
      accountabilities: [{ id: "a1", statement: "Verify claims", complexityWeight: 2 }],
      humanRoleIds: ["role_human"],
      agentRoleIds: ["role_agent"],
      localDecisions: [],
      escalatedDecisions: [],
      metrics: [],
      cognitiveLoadBudget: 10,
    },
    cp_1: {
      id: "cp_1",
      kind: "checkpoint",
      name: "Issue tonnes",
      actionScope: "registry.issue",
      reversibility: "irreversible",
      requiresHumanApproval: true,
      auditRequired: true,
    },
  },
  edges: {},
});

describe("validateGraph", () => {
  it("passes on a well-formed graph", () => {
    const g = baseGraph();
    // add a compliant delegation
    g.nodes.deleg_1 = {
      id: "deleg_1",
      kind: "delegation",
      podId: "pod_1",
      supervisingHumanRoleId: "role_human",
      delegatedAgentRoleId: "role_agent",
      mandate: "Classify parcel imagery",
      autonomyLevel: "act-with-approval",
      allowedActions: [],
      forbiddenActions: [],
      toolAccess: [],
      checkpointPolicyId: "cp_1",
    };
    expect(validateGraph(g)).toEqual([]);
  });

  it("flags an agent delegation with no human supervisor", () => {
    const g = baseGraph();
    g.nodes.deleg_bad = {
      id: "deleg_bad",
      kind: "delegation",
      podId: "pod_1",
      supervisingHumanRoleId: "role_agent", // wrong: points at an agent
      delegatedAgentRoleId: "role_agent",
      mandate: "Rogue mandate",
      autonomyLevel: "assist",
      allowedActions: [],
      forbiddenActions: [],
      toolAccess: [],
    };
    const v = validateGraph(g);
    expect(v.map((x) => x.code)).toContain("delegation.missing-human-supervisor");
  });

  it("flags act-with-audit autonomy missing a checkpoint", () => {
    const g = baseGraph();
    g.nodes.deleg_unsafe = {
      id: "deleg_unsafe",
      kind: "delegation",
      podId: "pod_1",
      supervisingHumanRoleId: "role_human",
      delegatedAgentRoleId: "role_agent",
      mandate: "Auto-issue",
      autonomyLevel: "act-with-audit",
      allowedActions: [],
      forbiddenActions: [],
      toolAccess: [],
    };
    const v = validateGraph(g);
    expect(v.map((x) => x.code)).toContain("delegation.autonomy-without-checkpoint");
  });

  it("flags cognitive overload", () => {
    const g = baseGraph();
    const pod = g.nodes.pod_1;
    if (!pod || pod.kind !== "pod") throw new Error("fixture broken");
    pod.cognitiveLoadBudget = 1;
    pod.accountabilities = [
      { id: "a1", statement: "x", complexityWeight: 3 },
      { id: "a2", statement: "y", complexityWeight: 4 },
    ];
    const v = validateGraph(g);
    expect(v.map((x) => x.code)).toContain("pod.cognitive-overload");
  });
});
