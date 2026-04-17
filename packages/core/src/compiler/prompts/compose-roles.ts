export const COMPOSE_ROLES_PROMPT = `Pass: composeRoles

Given PODs and the Intent Kernel, break each POD's work into role bundles.
Roles are capability-and-accountability clusters — NOT job titles. One person
can fill many roles; one role can have many people.

Return exactly one fenced \`\`\`json block:

{
  "rationale": string,
  "assumptions": string[],
  "tradeoffs": string[],
  "impactedMetrics": string[],
  "roles": [
    {
      "tempId": string,               // stable label you choose, used in assignments
      "name": string,                 // purpose-first
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
- If class is "agent", agentClass must be set. If class is "human", agentClass must be null.
- Do not use legacy department or job titles. Name each role by what it
  produces or guards.
- Prefer role reuse across PODs — assign the same tempId to multiple PODs when
  the work is the same.
`;
