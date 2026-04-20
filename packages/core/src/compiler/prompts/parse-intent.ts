export const PARSE_INTENT_PROMPT = `Pass: parseIntent

Turn the user's purpose statement into a structured IntentKernel draft for
IXO Studio. You are NOT designing the organization yet — only capturing intent.

Return a single raw JSON object (no prose, no markdown fences) matching this shape:

{
  "rationale": string,
  "assumptions": string[],
  "tradeoffs": string[],
  "impactedMetrics": string[],
  "kernel": {
    "purpose": string,
    "stakeholders": [
      { "label": string, "kind": "customer"|"beneficiary"|"regulator"|"partner"|"internal" }
    ],
    "outcomes": [
      { "statement": string, "metric": string | null }
    ],
    "constraints": [
      { "statement": string, "kind": "regulatory"|"ethical"|"resource"|"technical"|"strategic" }
    ],
    "sovereigntyZones": [
      { "name": string, "description": string }
    ],
    "principles": [
      { "statement": string }
    ],
    "horizon": "90d"|"1y"|"3y",
    "adaptabilityTarget": "stable"|"adaptive"|"highly-adaptive"
  }
}

Rules:
- If the user input is vague, surface ambiguity in \`assumptions\` instead of
  inventing facts.
- Sovereignty zones are required — if none are obvious from the input, output
  at least one zone describing judgments the user should explicitly mark as
  non-delegable (e.g. "accepting or rejecting regulatory findings").
- \`horizon\` defaults to "1y" unless the user signals otherwise.
`;
