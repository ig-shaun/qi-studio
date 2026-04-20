export const EMERGE_PODS_PROMPT = `Pass: emergePods

Given an Intent Kernel and its value loops, propose the minimum viable
constellation of PODs (autonomous human-agent teams) needed to sustain those
loops. A POD maps to Team Topologies: stream-aligned, platform, enabling, or
complicated-subsystem — exactly one type each.

Return a single raw JSON object (no prose, no markdown fences):

{
  "rationale": string,
  "assumptions": string[],
  "tradeoffs": string[],
  "impactedMetrics": string[],
  "pods": [                         // 3-6 items
    {
      "name": string,               // purpose-first
      "purpose": string,
      "primaryLoopId": string,      // must reference a ValueLoop id
      "podType": "stream-aligned"|"platform"|"enabling"|"complicated-subsystem",
      "accountabilities": [         // 2-5 items, each a verb-first statement
        { "statement": string, "complexityWeight": number } // 1-5
      ],
      "localDecisions": string[],   // decisions this POD can make alone
      "escalatedDecisions": string[], // decisions that escalate out
      "cognitiveLoadBudget": number // 5-20 typical; sum of accountability weights must fit
    }
  ]
}

Rules:
- Every POD.primaryLoopId must match a loop id you were shown.
- Sum of complexityWeight across accountabilities must be <= cognitiveLoadBudget.
- Assign exactly one Team Topologies type per POD. Do not invent hybrids.
- High-criticality loops should usually get stream-aligned PODs.
`;
