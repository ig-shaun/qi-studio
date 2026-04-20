export const SYNTHESIZE_VALUE_LOOPS_PROMPT = `Pass: synthesizeValueLoops

Given an Intent Kernel, propose the minimum set of value-creation loops that
must exist for the intent to stay alive. A value loop is a repeating cycle of
sense -> decide -> act -> learn that produces a specific outcome.

Return a single raw JSON object (no prose, no markdown fences):

{
  "rationale": string,
  "assumptions": string[],
  "tradeoffs": string[],
  "impactedMetrics": string[],
  "loops": [                        // 2-5 items
    {
      "name": string,               // purpose-first, e.g. "Verify smallholder claims"
      "purpose": string,            // one sentence
      "outcomeRefs": string[],      // must cite outcome ids from the Intent Kernel
      "triggerSignals": string[],   // what starts this loop
      "outputs": string[],           // what this loop produces
      "criticality": "low"|"medium"|"high",
      "requiredLatency": string     // e.g. "hours", "days", "weeks"
    }
  ]
}

Rules:
- Each loop must cite at least one outcomeId from the Intent Kernel.
- Do not invent outcomes. If coverage is insufficient, surface the gap in
  \`assumptions\`.
- Prefer fewer, sharper loops over many shallow ones.
`;
