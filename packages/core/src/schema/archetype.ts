import { z } from "zod";
import type { AgentClass, AutonomyLevel, RoleClass } from "./primitives.js";

export const RoleArchetype = z.enum([
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
export type RoleArchetype = z.infer<typeof RoleArchetype>;

export type ArchetypePolicy = {
  id: RoleArchetype;
  label: string;
  summary: string;
  allowedClasses: readonly RoleClass[];
  defaultClass: RoleClass;
  defaultAgentClass?: AgentClass;
  authorityScopes: readonly string[];
  evidenceBoundary: readonly string[];
  escalationTriggers: readonly string[];
  failureModes: readonly string[];
  defaultAutonomy: AutonomyLevel;
  coreGuardrail: string;
};

export const ARCHETYPE_POLICIES: Record<RoleArchetype, ArchetypePolicy> = {
  executor: {
    id: "executor",
    label: "Executor",
    summary: "Task doer for bounded human or agent work.",
    allowedClasses: ["human", "agent", "hybrid"],
    defaultClass: "agent",
    defaultAgentClass: "service",
    authorityScopes: ["flow:execute:<task-id>", "claim:append:task-log"],
    evidenceBoundary: [
      "Read task inputs",
      "Read prior outcome claims",
      "No raw PII",
      "No vault secrets",
    ],
    escalationTriggers: [
      "confidence < 0.8",
      "economic impact > threshold",
      "approval request created before continuing",
    ],
    failureModes: ["Automation drift", "Credential replay with stale UCANs"],
    defaultAutonomy: "act-with-approval",
    coreGuardrail:
      "Confidence below 0.8 or economic impact over threshold requires approval.",
  },
  orchestrator: {
    id: "orchestrator",
    label: "Orchestrator",
    summary: "Workflow coordinator agent.",
    allowedClasses: ["agent"],
    defaultClass: "agent",
    defaultAgentClass: "orchestration",
    authorityScopes: ["flow:orchestrate", "subflow:create", "entity:read:meta"],
    evidenceBoundary: ["Metadata and scheduling only", "No raw sensor streams"],
    escalationTriggers: [
      "contention detected",
      "dependency cycle detected",
      "failed subtasks > threshold",
      "escalate to POD Host with conflict snapshot",
    ],
    failureModes: [
      "Cascade errors from bad dependency graphs",
      "Concurrency races",
    ],
    defaultAutonomy: "act-with-audit",
    coreGuardrail: "No wallet or payment authority.",
  },
  verifier: {
    id: "verifier",
    label: "Verifier",
    summary: "Evidence attester for agent or human oracle work.",
    allowedClasses: ["human", "agent", "hybrid"],
    defaultClass: "agent",
    defaultAgentClass: "service",
    authorityScopes: ["claims:verify", "oracle:fetch:<source>"],
    evidenceBoundary: [
      "May fetch and cache attestations",
      "Must not alter sources",
    ],
    escalationTriggers: [
      "score < policy threshold",
      "schema mismatch",
      "mark unverified and assign human review within T hours",
    ],
    failureModes: ["Oracle poisoning", "Staleness causing false positives"],
    defaultAutonomy: "act-with-audit",
    coreGuardrail:
      "Low score or schema mismatch becomes unverified and human-reviewed.",
  },
  sentinel: {
    id: "sentinel",
    label: "Sentinel",
    summary: "Safety and monitoring role.",
    allowedClasses: ["human", "agent", "hybrid"],
    defaultClass: "agent",
    defaultAgentClass: "service",
    authorityScopes: ["monitor:subscribe", "flow:pause", "incident:create"],
    evidenceBoundary: [
      "Privileged logs and telemetry",
      "Writes limited to incident records",
    ],
    escalationTriggers: [
      "threshold breach",
      "auto-pause implicated flows",
      "notify on-call via Matrix and Incident POD",
    ],
    failureModes: ["Alert fatigue", "Noisy false positives"],
    defaultAutonomy: "act-with-audit",
    coreGuardrail:
      "Threshold breaches pause implicated flows and create incidents.",
  },
  gatekeeper: {
    id: "gatekeeper",
    label: "Gatekeeper",
    summary: "Access, onboarding, and payment release role.",
    allowedClasses: ["human"],
    defaultClass: "human",
    authorityScopes: ["access:grant:<role>", "payment:release"],
    evidenceBoundary: ["KYC VCs", "Balance proofs", "Claim receipts"],
    escalationTriggers: [
      "payment release > threshold",
      "multisig UCAN or CFO sign-off required",
      "time-bound hold",
    ],
    failureModes: [
      "Social engineering",
      "Delayed approvals blocking flow",
    ],
    defaultAutonomy: "act-with-approval",
    coreGuardrail:
      "Payment release over threshold requires a cosigner checkpoint.",
  },
  curator: {
    id: "curator",
    label: "Curator",
    summary: "Knowledge steward.",
    allowedClasses: ["human"],
    defaultClass: "human",
    authorityScopes: ["kb:update:<namespace>", "schema:publish"],
    evidenceBoundary: [
      "Provenance VCs required",
      "Prior versions must remain visible",
    ],
    escalationTriggers: [
      "conflict between authoritative sources",
      "governance vote or quorum review",
    ],
    failureModes: [
      "Confirmation bias",
      "Over-pruning valid minority evidence",
    ],
    defaultAutonomy: "act-with-approval",
    coreGuardrail: "Signed changes must include provenance VC links.",
  },
  auditor: {
    id: "auditor",
    label: "Auditor",
    summary: "Compliance and forensic review role.",
    allowedClasses: ["human"],
    defaultClass: "human",
    authorityScopes: ["audit:read:all", "evidence:freeze"],
    evidenceBoundary: [
      "Full read under audit token",
      "PII extraction requires legal justification claim",
    ],
    escalationTriggers: [
      "suspected malpractice",
      "immediate freeze",
      "cross-region notices and legal ops",
    ],
    failureModes: [
      "Data overload",
      "Chain-of-custody gaps if UCANs are not logged",
    ],
    defaultAutonomy: "act-with-approval",
    coreGuardrail: "PII extraction requires a legal justification claim.",
  },
  mediator: {
    id: "mediator",
    label: "Mediator",
    summary: "Dispute resolver.",
    allowedClasses: ["human"],
    defaultClass: "human",
    authorityScopes: ["dispute:open", "resolution:propose"],
    evidenceBoundary: [
      "May request re-verification",
      "Access redacted dispute views",
    ],
    escalationTriggers: [
      "unresolved after 48h",
      "arbitration at 7d if unresolved",
    ],
    failureModes: [
      "Capture by powerful parties",
      "Delays blocking payments",
    ],
    defaultAutonomy: "act-with-approval",
    coreGuardrail:
      "Disputes escalate at 48h and then to arbitration at 7d if unresolved.",
  },
  synthesizer: {
    id: "synthesizer",
    label: "Synthesizer",
    summary: "Analytics and decision support.",
    allowedClasses: ["human", "agent", "hybrid"],
    defaultClass: "agent",
    defaultAgentClass: "copilot",
    authorityScopes: ["synth:query", "model:invoke:read"],
    evidenceBoundary: [
      "Outputs reference input claim IDs",
      "Outputs reference provenance VC links",
    ],
    escalationTriggers: [
      "low confidence",
      "policy-conflicting recommendation",
      "spawn human review ticket",
    ],
    failureModes: ["Hallucination", "Proxy manipulation of inputs"],
    defaultAutonomy: "recommend",
    coreGuardrail:
      "Read-only recommendations with provenance and confidence boundaries.",
  },
};

export const ROLE_ARCHETYPES = RoleArchetype.options;

export const getArchetypePolicy = (
  archetype?: RoleArchetype
): ArchetypePolicy | undefined =>
  archetype ? ARCHETYPE_POLICIES[archetype] : undefined;

export const isRoleClassAllowedForArchetype = (
  archetype: RoleArchetype,
  roleClass: RoleClass
): boolean => ARCHETYPE_POLICIES[archetype].allowedClasses.includes(roleClass);

export const coerceRoleShapeForArchetype = (
  archetype: RoleArchetype,
  requestedClass?: RoleClass,
  requestedAgentClass?: AgentClass | null
): { class: RoleClass; agentClass?: AgentClass } => {
  const policy = ARCHETYPE_POLICIES[archetype];
  const roleClass =
    requestedClass && policy.allowedClasses.includes(requestedClass)
      ? requestedClass
      : policy.defaultClass;
  if (roleClass === "human") return { class: roleClass };
  return {
    class: roleClass,
    agentClass: requestedAgentClass ?? policy.defaultAgentClass ?? "service",
  };
};

export const capabilitiesForArchetype = (archetype?: RoleArchetype) => {
  const policy = getArchetypePolicy(archetype);
  return policy
    ? policy.authorityScopes.map((scope) => ({ id: scope, name: scope }))
    : [];
};

export const materializeDelegationPolicy = (archetype?: RoleArchetype) => {
  const policy = getArchetypePolicy(archetype);
  return {
    autonomyLevel: policy?.defaultAutonomy ?? ("assist" as AutonomyLevel),
    authorityScopes: policy?.authorityScopes.slice() ?? [],
    evidenceBoundary: policy?.evidenceBoundary.slice() ?? [],
    escalationTriggers: policy?.escalationTriggers.slice() ?? [],
    failureModes: policy?.failureModes.slice() ?? [],
  };
};

export const isAuthorityScopeAllowedForArchetype = (
  archetype: RoleArchetype,
  scope: string
): boolean =>
  ARCHETYPE_POLICIES[archetype].authorityScopes.some((template) =>
    matchesScopeTemplate(scope, template)
  );

export const matchesScopeTemplate = (scope: string, template: string): boolean => {
  if (scope === template) return true;
  const escaped = template
    .split(/(<[^>]+>)/g)
    .map((part) =>
      part.startsWith("<") && part.endsWith(">") ? "[^:]+" : escapeRegExp(part)
    )
    .join("");
  return new RegExp(`^${escaped}$`).test(scope);
};

export const hasWalletOrPaymentAuthority = (values: string[]): boolean =>
  values.some((value) => /\b(wallet|payment|pay|treasury|bank)\b/i.test(value));

export const isToolAccessAllowedForArchetype = (
  archetype: RoleArchetype,
  tool: { tool: string; scope: "read" | "write" | "invoke" }
): boolean => {
  const joined = `${tool.tool}:${tool.scope}`;
  if (archetype === "orchestrator" && hasWalletOrPaymentAuthority([joined])) {
    return false;
  }
  if (archetype === "synthesizer" && tool.scope !== "read") return false;
  return true;
};

export const requiresCheckpointForDelegation = (args: {
  authorityScopes: string[];
  spendBudget?: number;
  autonomyLevel: AutonomyLevel;
}): boolean =>
  args.autonomyLevel === "act-with-approval" ||
  args.autonomyLevel === "act-with-audit" ||
  (args.spendBudget ?? 0) > 0 ||
  args.authorityScopes.some((scope) =>
    [
      "payment:release",
      "flow:pause",
      "incident:create",
      "access:grant",
      "evidence:freeze",
      "schema:publish",
    ].some((prefix) => scope.startsWith(prefix))
  );

export const ARCHETYPE_PROMPT_GUIDE = ROLE_ARCHETYPES.map((id) => {
  const p = ARCHETYPE_POLICIES[id];
  const allowed = p.allowedClasses.join("|");
  const agent =
    p.defaultAgentClass && p.defaultClass !== "human"
      ? `, default agentClass=${p.defaultAgentClass}`
      : "";
  return `- ${id}: ${p.label}; allowed class=${allowed}; default class=${p.defaultClass}${agent}; authority=${p.authorityScopes.join(", ")}; guardrail=${p.coreGuardrail}`;
}).join("\n");

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
