import { ARCHETYPE_PROMPT_GUIDE } from "../../schema/archetype.js";

export const COMPOSE_ROLES_PROMPT = `Pass: composeRoles

Given PODs and the Intent Kernel, break each POD's work into role bundles.
Roles are capability-and-accountability clusters — NOT job titles. One person
can fill many roles; one role can have many people.

Each role MUST use one of the nine IXO/Qi archetypes. The compiler enforces
the class and capability envelope from this catalog:

${ARCHETYPE_PROMPT_GUIDE}

Return a single raw JSON object (no prose, no markdown fences):

{
  "rationale": string,
  "assumptions": string[],
  "tradeoffs": string[],
  "impactedMetrics": string[],
  "roles": [
    {
      "tempId": string,               // stable label you choose, used in assignments
      "name": string,                 // purpose-first
      "archetype": "executor"|"orchestrator"|"verifier"|"sentinel"|"gatekeeper"|"curator"|"auditor"|"mediator"|"synthesizer",
      "class": "human"|"agent"|"hybrid",
      "agentClass": "orchestration"|"service"|"copilot"|null,
      "purpose": string,
      "accountabilities": string[],
      "decisionRights": string[]
    }
  ],
  "assignments": [                    // one entry per POD, required for all pods shown
    {
      "podId": string,
      "humanRoleTempIds": string[],   // at least one required
      "agentRoleTempIds": string[]    // may be empty
    }
  ]
}

Rules:
- Every POD must be assigned at least one role with class "human" (or "hybrid").
- Every role must choose exactly one archetype from the catalog above.
- Class must be allowed by the archetype. If unsure, use the archetype default.
- If class is "agent", agentClass must be set. If class is "human", agentClass must be null.
- Do not invent authority scopes or capabilities in this pass; those come from the archetype policy catalog.
- Do not use legacy department or job titles. Name each role by what it
  produces or guards.
- Prefer role reuse across PODs — assign the same tempId to multiple PODs when
  the work is the same.
`;
