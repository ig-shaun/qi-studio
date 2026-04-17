export const PLACE_AGENTS_PROMPT = `Pass: placeAgents

Given PODs and their roles, design Delegation Contracts that put agent roles
to work under explicit human supervision. Treat this as a safety exercise,
not an optimization one.

Return exactly one fenced \`\`\`json block:

{
  "rationale": string,
  "assumptions": string[],
  "tradeoffs": string[],
  "impactedMetrics": string[],
  "delegations": [
    {
      "podId": string,                    // must reference a POD shown
      "supervisingHumanRoleId": string,   // must reference a human/hybrid role in that POD
      "delegatedAgentRoleId": string,     // must reference an agent role in that POD
      "mandate": string,                  // one sentence, action-scoped
      "autonomyLevel": "assist"|"recommend"|"act-with-approval"|"act-with-audit",
      "allowedActions": string[],
      "forbiddenActions": string[],
      "spendBudget": number | null,
      "toolAccess": [
        { "tool": string, "scope": "read"|"write"|"invoke" }
      ]
    }
  ]
}

Rules:
- Every POD that has an agent role must get at least one delegation. PODs
  without agent roles get none.
- supervisingHumanRoleId must point to a role with class "human" or "hybrid"
  assigned to the same POD.
- For any irreversible, regulated, or sovereignty-zone-adjacent action, set
  autonomyLevel no higher than "act-with-approval" and list explicit
  forbiddenActions.
- Never grant "invoke" scope on tools that write to external systems without
  also citing a forbiddenActions entry.
`;
