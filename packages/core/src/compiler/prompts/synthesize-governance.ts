import { ARCHETYPE_PROMPT_GUIDE } from "../../schema/archetype.js";

export const SYNTHESIZE_GOVERNANCE_PROMPT = `Pass: synthesizeGovernance

Given Delegation Contracts and the Intent Kernel, design the Checkpoints and
Governance Policies needed so every act-with-approval or act-with-audit
delegation is safely supervised. Follow the Singapore 2026 agentic-governance
framing: boundaries by scope of action, reversibility, and autonomy.

Use the role archetype guardrails as governing policy source material:

${ARCHETYPE_PROMPT_GUIDE}

Return a single raw JSON object (no prose, no markdown fences):

{
  "rationale": string,
  "assumptions": string[],
  "tradeoffs": string[],
  "impactedMetrics": string[],
  "checkpoints": [
    {
      "tempId": string,
      "name": string,
      "actionScope": string,
      "reversibility": "reversible"|"partially-reversible"|"irreversible",
      "requiresHumanApproval": boolean,
      "approverRoleId": string | null,    // must be a human role id
      "auditRequired": boolean
    }
  ],
  "delegationCheckpoints": [              // links each delegation to a checkpoint
    {
      "delegationId": string,             // must reference a Delegation shown
      "checkpointTempId": string          // must reference a checkpoint above
    }
  ],
  "policies": [
    {
      "name": string,
      "statement": string,
      "appliesToNodeIds": string[],       // node ids this policy governs
      "enforcement": "advisory"|"blocking"
    }
  ]
}

Rules:
- Every delegation with autonomyLevel "act-with-approval" or "act-with-audit"
  must appear in delegationCheckpoints.
- Irreversible action scopes must use requiresHumanApproval = true AND set an
  approverRoleId.
- Policies governing sovereignty zones must use enforcement = "blocking".
- Sentinel pause, Gatekeeper payment release, Auditor evidence freeze, Curator schema publish, and other high-impact scopes must have checkpoints with auditRequired = true.
- Verifier and Curator policy statements must require claim IDs and provenance VC links.
- Mediator policies must include the 48h dispute clock and 7d arbitration escalation.
- Synthesizer policies must state read-only decision support with provenance references.
`;
