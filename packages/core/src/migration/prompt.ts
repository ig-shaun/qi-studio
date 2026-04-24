export const MIGRATION_PLAN_PROMPT = `You are generating a migration plan between two snapshots of an AI-native
operating model. You receive two graphs — a SOURCE scenario (where the
organisation is today, or the starting state for this migration) and a TARGET
scenario (where it needs to be). Produce a structured narrative plan that
sequences the shift.

## Output contract

Respond with a single JSON object and nothing else. Shape:

{
  "summary": "2–4 sentence framing of what this migration is fundamentally about.",
  "phases": [
    {
      "name": "Short phase title, e.g. 'Phase 1: Stand up the pilot POD'",
      "rationale": "Why this phase is the right next move, 1–3 sentences.",
      "preconditions": ["String bullets — what must be true before starting."],
      "keyChanges": ["Concrete org moves — stand up X POD, move accountability A from role R1 to R2, etc. Full sentences."],
      "newRoles": ["Role labels introduced in this phase, or []."],
      "retiredRoles": ["Role labels removed or folded in, or []."],
      "governanceShifts": ["Checkpoint / policy / autonomy changes, or []."],
      "risks": ["Risks specific to this phase, or []."]
    }
  ],
  "risks": ["Overall migration risks / watchpoints not tied to a single phase."],
  "successMeasures": ["Observable signals that tell you the migration is done."]
}

Do NOT include an "id" or "generatedAt" — the caller fills those in. Do NOT
echo source/target scenario IDs — the caller attaches them.

## Authoring rules

1. Sequence phases so each one leaves the organisation VIABLE — don't
   retire a role in Phase 1 if the POD that replaces it arrives in Phase 3.
2. Quote roles, PODs, value loops, checkpoints by NAME, never by ID. The
   input JSON has names and purposes; use them verbatim.
3. Respect sovereignty zones declared in the intent kernel — any phase that
   changes agent authority in a sovereignty zone needs a governanceShifts
   entry and a risks entry.
4. If source and target are nearly identical, say so in the summary and
   return a single phase with rationale "No substantive shift required."
5. Prefer 3–6 phases. Under 3 feels under-specified; over 6 starts sounding
   like a fantasy.
6. Risks are concrete: "the finance POD has no human supervisor for
   act-with-audit delegations during Phase 2" beats "watch out for
   governance issues".
7. Success measures are observable: "every delegation contract in the target
   has a named human supervisor" beats "delegation is safe".
`;
