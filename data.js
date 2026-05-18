window.QI_STUDIO_DATA = {
  productName: "Qi Studio",
  workspaceName: "AI-native Operating Model",
  navigation: [
    { id: "intent", label: "Intent" },
    { id: "organism", label: "Organism" },
    { id: "value-loops", label: "Value Loops" },
    { id: "pod-protocols", label: "POD Protocols" },
    { id: "role-lattice", label: "Role Lattice" },
    { id: "agent-delegation", label: "Agent Delegation" },
    { id: "qi-flow", label: "Qi Flow" },
    { id: "governance", label: "Governance" },
    { id: "fitness-lab", label: "Fitness Lab" },
    { id: "plan", label: "Plan" }
  ],
  roleArchetypes: [
    {
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
        "No vault secrets"
      ],
      escalationTriggers: [
        "confidence < 0.8",
        "economic impact > threshold",
        "approval request created before continuing"
      ],
      failureModes: ["Automation drift", "Credential replay with stale UCANs"],
      defaultAutonomy: "act-with-approval",
      coreGuardrail:
        "Confidence below 0.8 or economic impact over threshold requires approval."
    },
    {
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
        "escalate to POD Host with conflict snapshot"
      ],
      failureModes: ["Cascade errors from bad dependency graphs", "Concurrency races"],
      defaultAutonomy: "act-with-audit",
      coreGuardrail: "No wallet or payment authority."
    },
    {
      id: "verifier",
      label: "Verifier",
      summary: "Evidence attester for agent or human oracle work.",
      allowedClasses: ["human", "agent", "hybrid"],
      defaultClass: "agent",
      defaultAgentClass: "service",
      authorityScopes: ["claims:verify", "oracle:fetch:<source>"],
      evidenceBoundary: ["May fetch and cache attestations", "Must not alter sources"],
      escalationTriggers: [
        "score < policy threshold",
        "schema mismatch",
        "mark unverified and assign human review within T hours"
      ],
      failureModes: ["Oracle poisoning", "Staleness causing false positives"],
      defaultAutonomy: "act-with-audit",
      coreGuardrail:
        "Low score or schema mismatch becomes unverified and human-reviewed."
    },
    {
      id: "sentinel",
      label: "Sentinel",
      summary: "Safety and monitoring role.",
      allowedClasses: ["human", "agent", "hybrid"],
      defaultClass: "agent",
      defaultAgentClass: "service",
      authorityScopes: ["monitor:subscribe", "flow:pause", "incident:create"],
      evidenceBoundary: [
        "Privileged logs and telemetry",
        "Writes limited to incident records"
      ],
      escalationTriggers: [
        "threshold breach",
        "auto-pause implicated flows",
        "notify on-call via Matrix and Incident POD"
      ],
      failureModes: ["Alert fatigue", "Noisy false positives"],
      defaultAutonomy: "act-with-audit",
      coreGuardrail:
        "Threshold breaches pause implicated flows and create incidents."
    },
    {
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
        "time-bound hold"
      ],
      failureModes: ["Social engineering", "Delayed approvals blocking flow"],
      defaultAutonomy: "act-with-approval",
      coreGuardrail:
        "Payment release over threshold requires a cosigner checkpoint."
    },
    {
      id: "curator",
      label: "Curator",
      summary: "Knowledge steward.",
      allowedClasses: ["human"],
      defaultClass: "human",
      authorityScopes: ["kb:update:<namespace>", "schema:publish"],
      evidenceBoundary: [
        "Provenance VCs required",
        "Prior versions must remain visible"
      ],
      escalationTriggers: [
        "conflict between authoritative sources",
        "governance vote or quorum review"
      ],
      failureModes: ["Confirmation bias", "Over-pruning valid minority evidence"],
      defaultAutonomy: "act-with-approval",
      coreGuardrail: "Signed changes must include provenance VC links."
    },
    {
      id: "auditor",
      label: "Auditor",
      summary: "Compliance and forensic review role.",
      allowedClasses: ["human"],
      defaultClass: "human",
      authorityScopes: ["audit:read:all", "evidence:freeze"],
      evidenceBoundary: [
        "Full read under audit token",
        "PII extraction requires legal justification claim"
      ],
      escalationTriggers: [
        "suspected malpractice",
        "immediate freeze",
        "cross-region notices and legal ops"
      ],
      failureModes: ["Data overload", "Chain-of-custody gaps if UCANs are not logged"],
      defaultAutonomy: "act-with-approval",
      coreGuardrail: "PII extraction requires a legal justification claim."
    },
    {
      id: "mediator",
      label: "Mediator",
      summary: "Dispute resolver.",
      allowedClasses: ["human"],
      defaultClass: "human",
      authorityScopes: ["dispute:open", "resolution:propose"],
      evidenceBoundary: ["May request re-verification", "Access redacted dispute views"],
      escalationTriggers: [
        "unresolved after 48h",
        "arbitration at 7d if unresolved"
      ],
      failureModes: ["Capture by powerful parties", "Delays blocking payments"],
      defaultAutonomy: "act-with-approval",
      coreGuardrail:
        "Disputes escalate at 48h and then to arbitration at 7d if unresolved."
    },
    {
      id: "synthesizer",
      label: "Synthesizer",
      summary: "Analytics and decision support.",
      allowedClasses: ["human", "agent", "hybrid"],
      defaultClass: "agent",
      defaultAgentClass: "copilot",
      authorityScopes: ["synth:query", "model:invoke:read"],
      evidenceBoundary: [
        "Outputs reference input claim IDs",
        "Outputs reference provenance VC links"
      ],
      escalationTriggers: [
        "low confidence",
        "policy-conflicting recommendation",
        "spawn human review ticket"
      ],
      failureModes: ["Hallucination", "Proxy manipulation of inputs"],
      defaultAutonomy: "recommend",
      coreGuardrail:
        "Read-only recommendations with provenance and confidence boundaries."
    }
  ],
  intentKernel: {
    id: "intent-kernel",
    name: "Intent Kernel",
    summary:
      "Intent anchors the operating model around trusted value creation, not departments or fixed reporting lines.",
    purpose:
      "Increase trusted customer value through adaptive human-agent cooperation.",
    stakeholdersServed: [
      "Customers who need reliable service and low-friction support",
      "Frontline teams responsible for trust and outcomes",
      "Risk and governance leaders accountable for controlled autonomy",
      "Platform teams stewarding knowledge, tooling, and learning reuse"
    ],
    outcomesToOptimize: [
      "Higher customer trust per interaction",
      "Shorter path from signal to service response",
      "Lower governance debt as autonomy increases",
      "Higher learning closure across pods"
    ],
    constraints: [
      "Regulated trust decisions require traceable human accountability",
      "Irreversible actions need explicit checkpoint design",
      "Agent autonomy must increase only where observability is mature"
    ],
    nonNegotiables: [
      "No opaque delegation for customer-impacting irreversible actions",
      "Human judgment sovereignty remains explicit in every critical loop",
      "Learning obligations are designed into every POD Protocol"
    ],
    sovereigntyZones: [
      "Boundary decisions affecting customer trust or policy interpretation",
      "Escalations involving exceptions to service promises",
      "Changes to autonomy level, checkpoint policy, or irreversible action scope"
    ],
    ethicalPrinciples: [
      "Trust before speed",
      "Reversible experimentation where possible",
      "Visible accountability for every delegated mandate",
      "Learning should compound across pods, not remain local"
    ],
    adaptabilityTarget:
      "Shift structure within a quarter without losing trust, traceability, or role clarity."
  },
  valueLoops: [
    {
      id: "loop-sense",
      name: "Sense Customer Needs",
      summary: "Capture customer signals early and convert them into action-ready context.",
      purpose: "Sense changes in customer need before service demand turns into avoidable friction.",
      triggerSignals: [
        "Inbound customer messages",
        "Product usage shifts",
        "Escalation themes from service channels"
      ],
      outcomes: [
        "Signal quality improves",
        "Early warnings reach the right POD"
      ],
      criticality: "High",
      requiredLatency: "Near-real-time",
      owningPodId: "pod-customer-signal",
      learningFeedback: "Compare sensed signals with final resolved need and update signal prompts.",
      metrics: ["Signal freshness", "False positive rate"],
      risks: ["Weak signal routing can overload downstream reviewers."]
    },
    {
      id: "loop-trust",
      name: "Build Trust",
      summary: "Translate intent into controlled, confidence-building customer actions.",
      purpose: "Ensure every interaction protects trust even as more work is delegated to agents.",
      triggerSignals: ["Low confidence cases", "Exception patterns", "Promise-risk mismatches"],
      outcomes: ["Clearer guardrails", "Higher customer trust score"],
      criticality: "High",
      requiredLatency: "Hours",
      owningPodId: "pod-trust-boundary",
      learningFeedback: "Review trust exceptions and adjust boundary rules and reviewer capacity.",
      metrics: ["Trust score delta", "Boundary adherence"],
      risks: ["Poorly tuned guardrails create hidden governance debt."]
    },
    {
      id: "loop-service",
      name: "Deliver Service",
      summary: "Convert qualified context into fast, reliable execution.",
      purpose: "Route, decide, and execute service work with minimal handoff waste.",
      triggerSignals: ["Qualified cases", "Service queue thresholds", "Workflow exceptions"],
      outcomes: ["Lower handoff count", "Faster completion time"],
      criticality: "High",
      requiredLatency: "Minutes",
      owningPodId: "pod-workflow-orchestration",
      learningFeedback: "Track where orchestration stalls and redesign the contract surface.",
      metrics: ["Cycle time", "Handoff count"],
      risks: ["Workflow sprawl can hide authority confusion."]
    },
    {
      id: "loop-risk",
      name: "Govern Risk",
      summary: "Keep delegation safe as autonomy scales.",
      purpose: "Apply checkpoint logic, audit requirements, and sovereignty zones to live work.",
      triggerSignals: ["Policy updates", "Low confidence actions", "Irreversible requests"],
      outcomes: ["Safer delegation", "Clearer escalation paths"],
      criticality: "High",
      requiredLatency: "Hours",
      owningPodId: "pod-intent-stewardship",
      learningFeedback: "Close audit findings into policy and operating model updates.",
      metrics: ["Audit closure time", "Escalation latency"],
      risks: ["Risk controls become performative when they are detached from flows."]
    },
    {
      id: "loop-learn",
      name: "Learn from Outcomes",
      summary: "Turn execution and exception patterns into design change.",
      purpose: "Ensure the organisation learns from outcomes rather than only measuring them.",
      triggerSignals: ["Resolved cases", "Quality review outputs", "Model drift indicators"],
      outcomes: ["Higher learning closure", "Updated prompts and protocols"],
      criticality: "Medium",
      requiredLatency: "Weekly",
      owningPodId: "pod-learning-loop",
      learningFeedback: "Close the loop between outcomes, role design, and delegation settings.",
      metrics: ["Learning closure", "Protocol refresh cadence"],
      risks: ["Insights die in dashboards if no POD owns redesign."]
    },
    {
      id: "loop-ecosystem",
      name: "Grow Ecosystem",
      summary: "Expand trust and capability through partners and shared knowledge.",
      purpose: "Increase leverage by extending the operating model into the wider ecosystem.",
      triggerSignals: ["Partner demand", "Platform adoption patterns", "New market opportunities"],
      outcomes: ["Faster partner onboarding", "Higher ecosystem contribution"],
      criticality: "Medium",
      requiredLatency: "Monthly",
      owningPodId: "pod-ecosystem-growth",
      learningFeedback: "Feed ecosystem outcomes back into platform and role design.",
      metrics: ["Partner activation", "Knowledge reuse"],
      risks: ["Growth can outpace governance if interfaces remain implicit."]
    }
  ],
  pods: [
    {
      id: "pod-customer-signal",
      name: "Customer Signal POD",
      podType: "Sensing POD",
      purpose: "Sense, enrich, and route emerging customer signals before they become operational drag.",
      summary: "Front door for signal quality and early interpretation.",
      ownedValueLoopId: "loop-sense",
      inputs: ["Customer messages", "Usage anomalies", "Escalation patterns"],
      outputs: ["Priority signals", "Context packets", "Escalation suggestions"],
      peopleRoleIds: ["role-intent-steward", "role-relationship-designer"],
      agentRoleIds: ["agent-signal-sensing", "agent-retrieval"],
      skillIds: ["skill-signal-triage", "skill-context-packet-design"],
      decisionRights: ["Prioritise inbound signals", "Route signals to service or trust layers"],
      guardrails: [
        "Do not classify a trust exception as resolved",
        "Escalate ambiguous customer harm signals within one hour"
      ],
      interfaces: ["Workflow Orchestration POD", "Trust & Boundary POD"],
      learningObligations: [
        "Review signal misses weekly",
        "Update signal taxonomy with emerging patterns"
      ],
      costProfile: "Moderate variable compute, light human review",
      fitnessScore: 81,
      autonomyScore: 68,
      delegationSafety: 78,
      cognitiveLoad: 63,
      governanceDebt: 24,
      accountabilities: [
        "Preserve signal fidelity",
        "Reduce avoidable routing noise",
        "Create reusable context packets"
      ],
      metrics: ["Signal freshness", "Routing precision", "Escalation quality"],
      risks: ["Overconfidence in weak signals can flood the system with false urgency."],
      suggestedMoves: [
        "Tighten retrieval prompts around exception signals",
        "Improve handoff contracts with Workflow Orchestration POD"
      ],
      governanceCheckpoints: ["Confidence threshold review", "Sensitive case routing audit"],
      delegationBoundaries: ["No customer promise changes", "No policy interpretation"],
      scenarioNotes: "Strong candidate for early pilot because it exposes signal quality quickly."
    },
    {
      id: "pod-trust-boundary",
      name: "Trust & Boundary POD",
      podType: "Governance POD",
      purpose: "Translate trust commitments into live delegation boundaries, checkpoint rules, and exception handling.",
      summary: "Protects trust as the organisation increases machine leverage.",
      ownedValueLoopId: "loop-trust",
      inputs: ["Exception signals", "Customer promises", "Policy guidance"],
      outputs: ["Boundary rules", "Checkpoint policies", "Escalation decisions"],
      peopleRoleIds: ["role-trust-architect", "role-human-judgment-reviewer"],
      agentRoleIds: ["agent-compliance-monitor", "agent-scenario-comparison"],
      skillIds: ["skill-risk-controls-analysis", "skill-checkpoint-design"],
      decisionRights: ["Set reversible vs irreversible bands", "Approve autonomy changes"],
      guardrails: [
        "All irreversible trust-affecting actions require a checkpoint",
        "Boundary changes need named human accountability"
      ],
      interfaces: ["Intent Stewardship POD", "Workflow Orchestration POD"],
      learningObligations: [
        "Review delegation drift bi-weekly",
        "Translate audit findings into contract changes"
      ],
      costProfile: "High judgment density, low volume, high leverage",
      fitnessScore: 89,
      autonomyScore: 42,
      delegationSafety: 92,
      cognitiveLoad: 58,
      governanceDebt: 12,
      accountabilities: [
        "Keep sovereignty zones explicit",
        "Prevent trust erosion from unsafe delegation",
        "Clarify checkpoint logic for irreversible actions"
      ],
      metrics: ["Delegation safety", "Boundary adherence", "Exception closure"],
      risks: ["Reviewer overload slows trusted action if boundaries are too broad."],
      suggestedMoves: [
        "Create a dedicated trust exception pattern library",
        "Add a pre-checkpoint signal quality gate before irreversible review"
      ],
      governanceCheckpoints: ["Irreversible action approval", "Autonomy band change review"],
      delegationBoundaries: [
        "No silent boundary changes by agents",
        "No unsupervised policy interpretation"
      ],
      scenarioNotes: "Must mature before broadening agent autonomy in service operations."
    },
    {
      id: "pod-workflow-orchestration",
      name: "Workflow Orchestration POD",
      podType: "Execution POD",
      purpose: "Coordinate case movement, execution logic, and handoffs across humans and agents.",
      summary: "Operational spine that turns qualified context into action.",
      ownedValueLoopId: "loop-service",
      inputs: ["Qualified signals", "Policy checks", "Execution requests"],
      outputs: ["Completed service actions", "Escalations", "Execution traces"],
      peopleRoleIds: ["role-agent-conductor", "role-workflow-composer"],
      agentRoleIds: ["agent-workflow-orchestration", "agent-compliance-monitor"],
      skillIds: ["skill-workflow-automation-design", "skill-exception-routing"],
      decisionRights: ["Route work to automation bands", "Escalate blocked flows"],
      guardrails: [
        "Do not execute irreversible actions without checkpoint confirmation",
        "Surface handoff bottlenecks instead of masking them"
      ],
      interfaces: ["Customer Signal POD", "Trust & Boundary POD", "Platform & Knowledge POD"],
      learningObligations: [
        "Measure handoff waste weekly",
        "Redesign repeated escalation paths into clearer contracts"
      ],
      costProfile: "Moderate human coordination plus scalable automation cost",
      fitnessScore: 84,
      autonomyScore: 74,
      delegationSafety: 76,
      cognitiveLoad: 71,
      governanceDebt: 31,
      accountabilities: [
        "Reduce operational friction",
        "Keep authority flows visible",
        "Sustain high-quality execution under load"
      ],
      metrics: ["Cycle time", "Handoff count", "Escalation latency"],
      risks: ["Hidden authority ambiguity can turn speed into brittleness."],
      suggestedMoves: [
        "Separate reversible and irreversible workflow lanes more clearly",
        "Raise observability around orchestration edge cases"
      ],
      governanceCheckpoints: ["Irreversible workflow gate", "Low confidence escalation"],
      delegationBoundaries: [
        "No workflow can bypass trust checkpoint policy",
        "No budget overruns without human acknowledgement"
      ],
      scenarioNotes: "High leverage POD for pilot scale, but vulnerable under stress."
    },
    {
      id: "pod-platform-knowledge",
      name: "Platform & Knowledge POD",
      podType: "Platform POD",
      purpose: "Provide shared tools, knowledge infrastructure, retrieval quality, and observability for all pods.",
      summary: "Common substrate for context reuse and system reliability.",
      ownedValueLoopId: "loop-service",
      inputs: ["Tool telemetry", "Knowledge updates", "Platform incidents"],
      outputs: ["Knowledge assets", "Retrieval quality improvements", "Reliability fixes"],
      peopleRoleIds: ["role-system-boundary-custodian", "role-learning-curator"],
      agentRoleIds: ["agent-retrieval", "agent-drift-detection"],
      skillIds: ["skill-retrieval-grounding", "skill-tool-boundary-stewardship"],
      decisionRights: ["Prioritise platform resilience work", "Publish reusable knowledge assets"],
      guardrails: [
        "No hidden tool access expansion",
        "All retrieval changes require quality review"
      ],
      interfaces: ["Workflow Orchestration POD", "Learning Loop POD", "Ecosystem Growth POD"],
      learningObligations: [
        "Review retrieval misses weekly",
        "Track context reuse across pods"
      ],
      costProfile: "High fixed platform cost, strong reuse leverage",
      fitnessScore: 80,
      autonomyScore: 64,
      delegationSafety: 83,
      cognitiveLoad: 66,
      governanceDebt: 20,
      accountabilities: [
        "Raise context reuse",
        "Increase retrieval trust",
        "Protect tooling boundaries"
      ],
      metrics: ["Context reuse", "Platform resilience", "Retrieval precision"],
      risks: ["Platform dependency can become a single point of failure."],
      suggestedMoves: [
        "Create fallbacks for core orchestration dependencies",
        "Expose tool access tiers more clearly in delegation contracts"
      ],
      governanceCheckpoints: ["Tool access review", "Knowledge release approval"],
      delegationBoundaries: ["No direct policy overrides", "No unaudited write access expansion"],
      scenarioNotes: "Platform maturity determines how far autonomy can safely scale."
    },
    {
      id: "pod-learning-loop",
      name: "Learning Loop POD",
      podType: "Learning POD",
      purpose: "Close the loop between outcomes, quality signals, and operating-model redesign.",
      summary: "Makes learning a designed obligation, not an afterthought.",
      ownedValueLoopId: "loop-learn",
      inputs: ["Outcome data", "Reviewer notes", "Drift signals"],
      outputs: ["Protocol updates", "Prompt changes", "Role redesign proposals"],
      peopleRoleIds: ["role-learning-curator", "role-decision-quality-reviewer"],
      agentRoleIds: ["agent-drift-detection", "agent-scenario-comparison"],
      skillIds: ["skill-drift-pattern-analysis", "skill-learning-closure-design"],
      decisionRights: ["Recommend protocol redesign", "Prioritise learning backlog"],
      guardrails: [
        "No production policy change without governance review",
        "Learning metrics must trace to outcome evidence"
      ],
      interfaces: ["All PODs", "Intent Stewardship POD"],
      learningObligations: [
        "Publish learning closure score",
        "Track redesign acceptance rate"
      ],
      costProfile: "Moderate analysis cost with high systemic leverage",
      fitnessScore: 86,
      autonomyScore: 59,
      delegationSafety: 84,
      cognitiveLoad: 54,
      governanceDebt: 18,
      accountabilities: [
        "Measure learning closure",
        "Turn drift into redesign",
        "Keep quality signals interpretable"
      ],
      metrics: ["Learning closure", "Drift response time", "Redesign acceptance"],
      risks: ["Learning decays when redesign ownership is unclear."],
      suggestedMoves: [
        "Link learning backlog directly to quarterly plan milestones",
        "Create stronger POD-level redesign feedback loops"
      ],
      governanceCheckpoints: ["Protocol change review", "Metric interpretation review"],
      delegationBoundaries: ["No direct production changes by learning agents"],
      scenarioNotes: "Critical for preventing prototype logic from hardening into drift."
    },
    {
      id: "pod-intent-stewardship",
      name: "Intent Stewardship POD",
      podType: "Stewardship POD",
      purpose: "Keep the operating model aligned to intent as priorities, constraints, and risk context evolve.",
      summary: "Strategic control layer for intent coherence and governance direction.",
      ownedValueLoopId: "loop-risk",
      inputs: ["Scenario analysis", "Policy changes", "Outcome drift"],
      outputs: ["Intent updates", "Governance direction", "Plan adjustments"],
      peopleRoleIds: ["role-intent-steward", "role-trust-architect"],
      agentRoleIds: ["agent-scenario-comparison"],
      skillIds: ["skill-scenario-synthesis", "skill-intent-trade-off-framing"],
      decisionRights: ["Adjust operating-model direction", "Approve major redesign moves"],
      guardrails: [
        "Intent changes require explicit trade-off narrative",
        "Governance and role impacts must be visible"
      ],
      interfaces: ["Trust & Boundary POD", "Learning Loop POD", "Ecosystem Growth POD"],
      learningObligations: [
        "Review intent coherence monthly",
        "Reflect policy shifts into quarterly plan"
      ],
      costProfile: "Low throughput, high leverage strategic review",
      fitnessScore: 88,
      autonomyScore: 38,
      delegationSafety: 90,
      cognitiveLoad: 49,
      governanceDebt: 14,
      accountabilities: [
        "Keep purpose legible in structure",
        "Prevent governance drift",
        "Translate strategic change into design change"
      ],
      metrics: ["Intent coherence", "Governance debt", "Plan confidence"],
      risks: ["If intent stewardship is passive, local optimisations fragment the system."],
      suggestedMoves: [
        "Tie scenario planning more tightly to POD redesign cadence",
        "Expose intent trade-offs directly in the workspace shell"
      ],
      governanceCheckpoints: ["Intent change review", "Quarterly structural review"],
      delegationBoundaries: ["No agent can redefine strategic intent"],
      scenarioNotes: "Provides the language and authority for migration path decisions."
    },
    {
      id: "pod-ecosystem-growth",
      name: "Ecosystem Growth POD",
      podType: "Growth POD",
      purpose: "Extend the operating model into partner channels, new markets, and shared capability loops.",
      summary: "Growth layer for external leverage without trust dilution.",
      ownedValueLoopId: "loop-ecosystem",
      inputs: ["Partner demand", "Knowledge assets", "Market signals"],
      outputs: ["Partner pathways", "Growth experiments", "Interface agreements"],
      peopleRoleIds: ["role-relationship-designer", "role-agent-conductor"],
      agentRoleIds: ["agent-signal-sensing", "agent-retrieval"],
      skillIds: ["skill-partner-pathway-design", "skill-ecosystem-sensing"],
      decisionRights: ["Recommend new interface patterns", "Prioritise partner enablement work"],
      guardrails: [
        "No external autonomy expansion without trust review",
        "Partner-facing knowledge must meet audit requirements"
      ],
      interfaces: ["Platform & Knowledge POD", "Intent Stewardship POD"],
      learningObligations: [
        "Capture external interface failures",
        "Feed growth friction back into role design"
      ],
      costProfile: "Moderate growth investment with high optionality",
      fitnessScore: 77,
      autonomyScore: 57,
      delegationSafety: 73,
      cognitiveLoad: 61,
      governanceDebt: 28,
      accountabilities: [
        "Translate internal capability into ecosystem value",
        "Protect trust at interfaces",
        "Expand partner leverage responsibly"
      ],
      metrics: ["Partner activation", "Interface quality", "Knowledge reuse"],
      risks: ["External scale can magnify unresolved internal contract issues."],
      suggestedMoves: [
        "Pilot one partner pathway before broad market expansion",
        "Use Trust & Boundary POD review before new autonomy exposure"
      ],
      governanceCheckpoints: ["Partner policy review", "External action reversibility review"],
      delegationBoundaries: ["No external commitment changes by agents"],
      scenarioNotes: "Best sequenced after service and trust layers stabilise."
    }
  ],
  humanRoles: [
    {
      id: "role-intent-steward",
      name: "Intent Steward",
      roleClass: "human",
      archetypeId: "gatekeeper",
      archetypeRationale: "Owns permission to change strategic intent, scope, and migration direction.",
      purpose: "Keeps organisational design choices anchored to purpose, trade-offs, and strategic coherence.",
      summary: "Primary human owner of intent coherence.",
      accountabilities: [
        "Approve meaningful shifts in purpose or scope",
        "Resolve trade-offs between speed, trust, and adaptability"
      ],
      podIds: ["pod-customer-signal", "pod-intent-stewardship"],
      metrics: ["Intent coherence", "Plan confidence"]
    },
    {
      id: "role-trust-architect",
      name: "Trust Architect",
      roleClass: "human",
      archetypeId: "sentinel",
      archetypeRationale: "Maintains the live safety envelope for trust boundaries and checkpoint design.",
      purpose: "Designs and maintains the trust boundary between human judgment and delegated action.",
      summary: "Shapes confidence thresholds and checkpoint policy.",
      accountabilities: [
        "Define delegation boundaries",
        "Translate policy into live trust controls"
      ],
      podIds: ["pod-trust-boundary", "pod-intent-stewardship"],
      metrics: ["Delegation safety", "Boundary adherence"]
    },
    {
      id: "role-human-judgment-reviewer",
      name: "Human Judgment Reviewer",
      roleClass: "human",
      archetypeId: "verifier",
      archetypeRationale: "Attests high-stakes evidence before irreversible trust-affecting decisions proceed.",
      purpose: "Exercises sovereign judgment where context, harm, or irreversibility demand human review.",
      summary: "Named reviewer for high-stakes cases.",
      accountabilities: [
        "Review irreversible trust-affecting actions",
        "Escalate ambiguous cases into policy learning"
      ],
      podIds: ["pod-trust-boundary"],
      metrics: ["Review latency", "Decision quality"]
    },
    {
      id: "role-relationship-designer",
      name: "Relationship Designer",
      roleClass: "human",
      archetypeId: "mediator",
      archetypeRationale: "Resolves customer and ecosystem tension through explicit relationship agreements.",
      purpose: "Shapes service and ecosystem interactions so trust scales with clarity.",
      summary: "Designs high-trust interfaces with customers and partners.",
      accountabilities: [
        "Refine partner and customer interaction models",
        "Reduce interface friction"
      ],
      podIds: ["pod-customer-signal", "pod-ecosystem-growth"],
      metrics: ["Trust score", "Interface quality"]
    },
    {
      id: "role-learning-curator",
      name: "Learning Curator",
      roleClass: "human",
      archetypeId: "curator",
      archetypeRationale: "Stewards outcome knowledge, provenance, and reusable redesign insight.",
      purpose: "Owns the discipline of learning closure across protocols, prompts, and roles.",
      summary: "Converts outcomes into reusable redesign insight.",
      accountabilities: [
        "Maintain learning backlog",
        "Ensure outcomes become design changes"
      ],
      podIds: ["pod-platform-knowledge", "pod-learning-loop"],
      metrics: ["Learning closure", "Redesign acceptance"]
    },
    {
      id: "role-system-boundary-custodian",
      name: "System Boundary Custodian",
      roleClass: "human",
      archetypeId: "auditor",
      archetypeRationale: "Reviews platform boundaries, auditability, and access evidence across tooling.",
      purpose: "Maintains clear technical and operational boundaries for tools, data, and platform trust.",
      summary: "Protects platform interfaces and access limits.",
      accountabilities: [
        "Own tool access clarity",
        "Reduce hidden platform dependencies"
      ],
      podIds: ["pod-platform-knowledge"],
      metrics: ["Platform resilience", "Access clarity"]
    }
  ],
  agentRoles: [
    {
      id: "agent-signal-sensing",
      name: "Signal Sensing Agent",
      roleClass: "agent",
      agentClass: "copilot",
      archetypeId: "synthesizer",
      archetypeRationale: "Turns weak signals into decision-support context without acting on customers directly.",
      purpose: "Classifies and prioritises incoming customer and ecosystem signals.",
      summary: "Fast sensing layer for emerging demand and risk patterns.",
      accountabilities: ["Classify signals", "Raise low-confidence exceptions"],
      podIds: ["pod-customer-signal", "pod-ecosystem-growth"]
    },
    {
      id: "agent-workflow-orchestration",
      name: "Workflow Orchestration Agent",
      roleClass: "agent",
      agentClass: "orchestration",
      archetypeId: "orchestrator",
      archetypeRationale: "Coordinates approved workflow lanes and dependency handoffs without wallet authority.",
      purpose: "Coordinates service actions, task routing, and execution bands.",
      summary: "Execution coordinator across reversible service flows.",
      accountabilities: ["Route workflows", "Track blocked work"],
      podIds: ["pod-workflow-orchestration"]
    },
    {
      id: "agent-compliance-monitor",
      name: "Compliance Monitor Agent",
      roleClass: "agent",
      agentClass: "service",
      archetypeId: "sentinel",
      archetypeRationale: "Monitors live delegation and can interrupt implicated flows when thresholds break.",
      purpose: "Monitors actions and flows against policy, confidence, and checkpoint rules.",
      summary: "Continuous control layer for live delegation.",
      accountabilities: ["Check action against policy", "Raise checkpoint flags"],
      podIds: ["pod-trust-boundary", "pod-workflow-orchestration"]
    },
    {
      id: "agent-retrieval",
      name: "Retrieval Agent",
      roleClass: "agent",
      agentClass: "service",
      archetypeId: "verifier",
      archetypeRationale: "Fetches evidence and provenance while preserving source truth.",
      purpose: "Retrieves relevant knowledge, precedents, and guidance for live work.",
      summary: "Shared context retrieval layer across pods.",
      accountabilities: ["Retrieve context", "Surface supporting evidence"],
      podIds: ["pod-customer-signal", "pod-platform-knowledge", "pod-ecosystem-growth"]
    },
    {
      id: "agent-drift-detection",
      name: "Drift Detection Agent",
      roleClass: "agent",
      agentClass: "service",
      archetypeId: "sentinel",
      archetypeRationale: "Subscribes to drift signals and raises incidents before quality decay normalises.",
      purpose: "Detects quality drift, control drift, and learning decay.",
      summary: "Signals where operating reality is diverging from design.",
      accountabilities: ["Detect drift", "Flag learning closure risks"],
      podIds: ["pod-platform-knowledge", "pod-learning-loop"]
    },
    {
      id: "agent-scenario-comparison",
      name: "Scenario Comparison Agent",
      roleClass: "agent",
      agentClass: "copilot",
      archetypeId: "synthesizer",
      archetypeRationale: "Produces read-only recommendations with confidence and provenance boundaries.",
      purpose: "Compares design options and stress-test conditions against target intent.",
      summary: "Decision support agent for redesign and transition planning.",
      accountabilities: ["Compare scenarios", "Surface trade-off patterns"],
      podIds: ["pod-trust-boundary", "pod-learning-loop", "pod-intent-stewardship"]
    }
  ],
  hybridRoles: [
    {
      id: "role-agent-conductor",
      name: "Agent Conductor",
      roleClass: "hybrid",
      agentClass: "service",
      archetypeId: "sentinel",
      archetypeRationale: "Keeps human-agent work inside safe operating bands during live coordination.",
      purpose: "Coordinates agent work, human review, and role handoff design inside a POD.",
      summary: "Operational bridge between human and agent work.",
      accountabilities: ["Adjust autonomy bands", "Coordinate exception response"],
      podIds: ["pod-workflow-orchestration", "pod-ecosystem-growth"],
      roleLiquidity: 84
    },
    {
      id: "role-workflow-composer",
      name: "Workflow Composer",
      roleClass: "hybrid",
      agentClass: "service",
      archetypeId: "executor",
      archetypeRationale: "Builds bounded workflow patterns that execute only inside approved task scope.",
      purpose: "Designs and tunes workflow patterns, orchestration rules, and fallback paths.",
      summary: "Turns service logic into programmable flow architecture.",
      accountabilities: ["Compose reusable workflow patterns", "Reduce orchestration fragility"],
      podIds: ["pod-workflow-orchestration"],
      roleLiquidity: 76
    },
    {
      id: "role-decision-quality-reviewer",
      name: "Decision Quality Reviewer",
      roleClass: "hybrid",
      agentClass: "service",
      archetypeId: "verifier",
      archetypeRationale: "Verifies the evidence and reasoning quality behind fast decisions.",
      purpose: "Examines how decisions were made, not only whether they were fast.",
      summary: "Protects decision quality as speed increases.",
      accountabilities: ["Review decision traces", "Translate errors into redesign moves"],
      podIds: ["pod-learning-loop"],
      roleLiquidity: 68
    },
    {
      id: "role-intelligence-flow-curator",
      name: "Intelligence Flow Curator",
      roleClass: "hybrid",
      agentClass: "copilot",
      archetypeId: "synthesizer",
      archetypeRationale: "Synthesizes context movement, provenance, and learning signals across PODs.",
      purpose: "Owns the movement of usable context, interpretation, and feedback across the system.",
      summary: "Shapes Qi Flow across pods and time horizons.",
      accountabilities: ["Reduce handoff waste", "Increase context reuse"],
      podIds: ["pod-platform-knowledge", "pod-learning-loop"],
      roleLiquidity: 81
    }
  ],
  skills: [
    {
      id: "skill-signal-triage",
      name: "Signal triage",
      purpose: "Differentiate weak, urgent, and strategic signals before they flood execution lanes.",
      summary: "Reduces routing noise while preserving signal fidelity.",
      podIds: ["pod-customer-signal"],
      applications: ["Inbound signal classification", "Escalation threshold tuning"]
    },
    {
      id: "skill-context-packet-design",
      name: "Context packet design",
      purpose: "Assemble concise, reusable context packets for downstream pods.",
      summary: "Improves handoff quality between sensing and execution.",
      podIds: ["pod-customer-signal"],
      applications: ["Case context assembly", "Escalation packet design"]
    },
    {
      id: "skill-risk-controls-analysis",
      name: "Risk controls analysis",
      purpose: "Map workflows to permissions, approvals, and assurance controls.",
      summary: "Keeps trust policy visible at the point of delegation.",
      podIds: ["pod-trust-boundary"],
      applications: ["Control design", "Delegation risk review"]
    },
    {
      id: "skill-checkpoint-design",
      name: "Checkpoint design",
      purpose: "Define where human review and reversible stops are required.",
      summary: "Protects sovereignty zones as autonomy expands.",
      podIds: ["pod-trust-boundary"],
      applications: ["Irreversible action gating", "Confidence threshold checkpoints"]
    },
    {
      id: "skill-workflow-automation-design",
      name: "Workflow automation design",
      purpose: "Translate service logic into dependable orchestration patterns.",
      summary: "Shapes programmable work lanes without hiding accountability.",
      podIds: ["pod-workflow-orchestration"],
      applications: ["Lane design", "Task routing architecture"]
    },
    {
      id: "skill-exception-routing",
      name: "Exception routing",
      purpose: "Escalate non-standard work into the right human or POD checkpoint.",
      summary: "Prevents operational speed from bypassing trust.",
      podIds: ["pod-workflow-orchestration"],
      applications: ["Escalation design", "Fallback path definition"]
    },
    {
      id: "skill-retrieval-grounding",
      name: "Retrieval grounding",
      purpose: "Increase trust in retrieved context through provenance and evidence quality.",
      summary: "Supports reusable knowledge without losing traceability.",
      podIds: ["pod-platform-knowledge"],
      applications: ["Knowledge retrieval", "Evidence ranking"]
    },
    {
      id: "skill-tool-boundary-stewardship",
      name: "Tool boundary stewardship",
      purpose: "Keep tool access explicit, tiered, and reviewable.",
      summary: "Prevents hidden dependency and permission sprawl.",
      podIds: ["pod-platform-knowledge"],
      applications: ["Access tiering", "Platform boundary review"]
    },
    {
      id: "skill-drift-pattern-analysis",
      name: "Drift pattern analysis",
      purpose: "Detect patterns where quality, policy, or model behavior is moving off-target.",
      summary: "Turns weak drift signals into redesign prompts.",
      podIds: ["pod-learning-loop"],
      applications: ["Drift review", "Outcome variance analysis"]
    },
    {
      id: "skill-learning-closure-design",
      name: "Learning closure design",
      purpose: "Ensure learning is routed back into protocols, prompts, and role design.",
      summary: "Makes learning an operating obligation rather than a report.",
      podIds: ["pod-learning-loop"],
      applications: ["Protocol redesign", "Learning backlog design"]
    },
    {
      id: "skill-scenario-synthesis",
      name: "Scenario synthesis",
      purpose: "Compare plausible future operating states and expose trade-offs clearly.",
      summary: "Supports strategic redesign without abstraction drift.",
      podIds: ["pod-intent-stewardship"],
      applications: ["Scenario comparison", "Strategic option framing"]
    },
    {
      id: "skill-intent-trade-off-framing",
      name: "Intent trade-off framing",
      purpose: "Translate intent shifts into explicit structural trade-offs.",
      summary: "Keeps strategy legible inside the operating model.",
      podIds: ["pod-intent-stewardship"],
      applications: ["Intent review", "Structural change framing"]
    },
    {
      id: "skill-partner-pathway-design",
      name: "Partner pathway design",
      purpose: "Shape external pathways so trust scales into new interfaces.",
      summary: "Extends the model into partner and ecosystem operations.",
      podIds: ["pod-ecosystem-growth"],
      applications: ["Partner activation design", "Interface agreement design"]
    },
    {
      id: "skill-ecosystem-sensing",
      name: "Ecosystem sensing",
      purpose: "Detect partner, market, and platform signals that should influence growth choices.",
      summary: "Feeds external context back into internal design.",
      podIds: ["pod-ecosystem-growth"],
      applications: ["Market signal sensing", "Partner opportunity detection"]
    }
  ],
  delegationContracts: [
    {
      id: "contract-signal-sensing",
      agentRoleId: "agent-signal-sensing",
      podId: "pod-customer-signal",
      mandate: "Surface high-value customer signal clusters and route them with context.",
      allowedActions: [
        "Classify inbound signals",
        "Attach supporting context",
        "Recommend routing priority"
      ],
      forbiddenActions: [
        "Change customer commitments",
        "Resolve trust exceptions",
        "Modify checkpoint policy"
      ],
      autonomyLevel: "Act with confidence threshold",
      supervisingHumanRoleId: "role-relationship-designer",
      costBudget: "$6k / month",
      toolAccess: ["CRM read", "Knowledge retrieval", "Signal router invoke"],
      checkpointPolicy: "Escalate low-confidence or high-impact signals within one hour.",
      observability: "All classifications sampled weekly and exception-routed cases reviewed daily.",
      rollbackPolicy: "Routing recommendations can be replayed and reclassified without customer impact."
    },
    {
      id: "contract-workflow-orchestration",
      agentRoleId: "agent-workflow-orchestration",
      podId: "pod-workflow-orchestration",
      mandate: "Route reversible service work and surface blocked execution paths.",
      allowedActions: [
        "Assign tasks inside approved bands",
        "Escalate blocked or ambiguous work",
        "Assemble execution context"
      ],
      forbiddenActions: [
        "Execute irreversible actions",
        "Override trust checkpoints",
        "Expand tool access"
      ],
      autonomyLevel: "Act within approved lane",
      supervisingHumanRoleId: "role-agent-conductor",
      costBudget: "$12k / month",
      toolAccess: ["Case queue invoke", "Knowledge retrieval", "Workflow write"],
      checkpointPolicy: "Irreversible or low-confidence actions require human checkpoint confirmation.",
      observability: "Track handoff count, route changes, and escalation causes in every case trace.",
      rollbackPolicy: "Reassign work to human lane and replay workflow state from prior checkpoint."
    },
    {
      id: "contract-compliance-monitor",
      agentRoleId: "agent-compliance-monitor",
      podId: "pod-trust-boundary",
      mandate: "Monitor live work against policy and checkpoint conditions.",
      allowedActions: [
        "Flag non-compliant actions",
        "Trigger checkpoint review",
        "Recommend escalation path"
      ],
      forbiddenActions: [
        "Approve irreversible actions",
        "Change policy",
        "Silence audit events"
      ],
      autonomyLevel: "Monitor and interrupt",
      supervisingHumanRoleId: "role-trust-architect",
      costBudget: "$8k / month",
      toolAccess: ["Policy read", "Audit write", "Workflow interrupt invoke"],
      checkpointPolicy: "Any flagged irreversible action routes to Human Judgment Reviewer.",
      observability: "Policy interventions logged with reason code and confidence score.",
      rollbackPolicy: "Interrupted flows can be reset to pre-action checkpoint."
    },
    {
      id: "contract-retrieval",
      agentRoleId: "agent-retrieval",
      podId: "pod-platform-knowledge",
      mandate: "Retrieve relevant context and evidence without altering source truth.",
      allowedActions: [
        "Fetch approved knowledge",
        "Rank evidence",
        "Attach retrieval provenance"
      ],
      forbiddenActions: [
        "Write to source systems",
        "Publish policy changes",
        "Mask low-confidence retrieval"
      ],
      autonomyLevel: "Assist with provenance",
      supervisingHumanRoleId: "role-system-boundary-custodian",
      costBudget: "$5k / month",
      toolAccess: ["Knowledge read", "Search invoke"],
      checkpointPolicy: "Low-confidence retrieval requires reviewer acknowledgement before use in trust-sensitive work.",
      observability: "Track retrieval precision and usage by pod.",
      rollbackPolicy: "Remove stale evidence packets and re-run retrieval against approved snapshot."
    },
    {
      id: "contract-drift-detection",
      agentRoleId: "agent-drift-detection",
      podId: "pod-learning-loop",
      mandate: "Detect operational drift and recommend learning priorities.",
      allowedActions: [
        "Flag drift patterns",
        "Compare outcome shifts",
        "Propose redesign themes"
      ],
      forbiddenActions: [
        "Apply redesign changes directly",
        "Re-score governance policy unilaterally"
      ],
      autonomyLevel: "Recommend with evidence",
      supervisingHumanRoleId: "role-learning-curator",
      costBudget: "$4k / month",
      toolAccess: ["Outcome read", "Metric compare invoke"],
      checkpointPolicy: "Design changes require Learning Curator and Intent Steward review.",
      observability: "Every drift alert includes trace to metric and case sample set.",
      rollbackPolicy: "Withdraw alert bundle and restore prior benchmark set."
    },
    {
      id: "contract-scenario-comparison",
      agentRoleId: "agent-scenario-comparison",
      podId: "pod-intent-stewardship",
      mandate: "Compare operating-model options against intent, trust, and adaptability outcomes.",
      allowedActions: [
        "Model scenario deltas",
        "Surface trade-offs",
        "Recommend pilot sequences"
      ],
      forbiddenActions: [
        "Approve structural change",
        "Change sovereignty zones",
        "Set budget allocations"
      ],
      autonomyLevel: "Advisory with comparison trace",
      supervisingHumanRoleId: "role-intent-steward",
      costBudget: "$7k / month",
      toolAccess: ["Scenario model invoke", "Metric read", "Plan compare invoke"],
      checkpointPolicy: "Strategic design changes require Intent Steward sign-off.",
      observability: "Scenario recommendations stored with metric assumptions and policy references.",
      rollbackPolicy: "Revert to prior comparison set and archive superseded assumptions."
    }
  ],
  intelligenceFlows: [
    {
      id: "flow-intelligence",
      name: "Intelligence Flow",
      summary: "Moves interpretable context from sensing to decision-ready action.",
      source: "Customer Signal POD",
      target: "Workflow Orchestration POD",
      emphasis: "Context quality before speed",
      relatedPodIds: ["pod-customer-signal", "pod-workflow-orchestration"],
      flowScore: 78
    },
    {
      id: "flow-authority",
      name: "Authority Flow",
      summary: "Clarifies where decisions can be made and where they must be escalated.",
      source: "Intent Stewardship POD",
      target: "Trust & Boundary POD",
      emphasis: "Explicit decision rights and checkpoints",
      relatedPodIds: ["pod-intent-stewardship", "pod-trust-boundary"],
      flowScore: 83
    },
    {
      id: "flow-service",
      name: "Service Flow",
      summary: "Carries qualified work into execution with low handoff waste.",
      source: "Workflow Orchestration POD",
      target: "Customer-facing outcomes",
      emphasis: "Reversible lanes and visible bottlenecks",
      relatedPodIds: ["pod-workflow-orchestration", "pod-platform-knowledge"],
      flowScore: 74
    },
    {
      id: "flow-learning",
      name: "Learning Flow",
      summary: "Returns outcome evidence into protocol, role, and policy redesign.",
      source: "Learning Loop POD",
      target: "Intent Kernel",
      emphasis: "Learning closure and redesign cadence",
      relatedPodIds: ["pod-learning-loop", "pod-intent-stewardship"],
      flowScore: 81
    }
  ],
  governancePolicies: [
    {
      id: "policy-checkpoints",
      name: "Human checkpoint rules",
      summary: "Irreversible actions and low-confidence cases require named human checkpoint review.",
      appliesTo: ["pod-trust-boundary", "pod-workflow-orchestration"]
    },
    {
      id: "policy-autonomy",
      name: "Agent autonomy bands",
      summary: "Delegated work is split into assist, approved lane, and interrupt-capable monitoring bands.",
      appliesTo: ["pod-customer-signal", "pod-workflow-orchestration", "pod-platform-knowledge"]
    },
    {
      id: "policy-role-archetypes",
      name: "Role archetype policies",
      summary: "Every role declares one IXO/Qi archetype so authority, evidence, escalation, and failure modes are explicit before autonomy increases.",
      appliesTo: ["pod-trust-boundary", "pod-workflow-orchestration", "pod-learning-loop"]
    },
    {
      id: "policy-reversibility",
      name: "Reversible vs irreversible actions",
      summary: "Every action path is classified by reversibility before autonomy increases.",
      appliesTo: ["pod-workflow-orchestration", "pod-trust-boundary"]
    },
    {
      id: "policy-audit",
      name: "Audit requirements",
      summary: "Each delegated mandate preserves trace, tool access scope, and checkpoint evidence.",
      appliesTo: ["pod-platform-knowledge", "pod-trust-boundary", "pod-intent-stewardship"]
    },
    {
      id: "policy-escalation",
      name: "Escalation paths",
      summary: "Escalation routes must be visible, timed, and owned by a named human role.",
      appliesTo: ["pod-customer-signal", "pod-workflow-orchestration", "pod-learning-loop"]
    },
    {
      id: "policy-sovereignty",
      name: "Sovereignty zones",
      summary: "Policy interpretation, trust exceptions, and strategic intent changes remain explicitly sovereign.",
      appliesTo: ["pod-trust-boundary", "pod-intent-stewardship"]
    }
  ],
  fitnessMetrics: [
    { id: "metric-intent", name: "Intent coherence", value: 88, target: 92, summary: "Structure remains visibly tied to purpose." },
    { id: "metric-coverage", name: "Value-loop coverage", value: 84, target: 90, summary: "Each value loop has a clear owning POD." },
    { id: "metric-pod-autonomy", name: "POD autonomy", value: 71, target: 76, summary: "Autonomy is increasing where controls are mature." },
    { id: "metric-load", name: "Cognitive load", value: 63, target: 58, summary: "Execution load is manageable but rising." },
    { id: "metric-safety", name: "Delegation safety", value: 82, target: 88, summary: "Delegation is controlled but stress-sensitive." },
    { id: "metric-judgment", name: "Human judgment clarity", value: 86, target: 90, summary: "Sovereignty zones are mostly explicit." },
    { id: "metric-ifi", name: "Intelligence Flow Index", value: 79, target: 85, summary: "Context quality and handoff design are improving." },
    { id: "metric-debt", name: "Governance debt", value: 28, target: 18, summary: "Some controls still lag autonomy ambition." },
    { id: "metric-learning", name: "Learning closure", value: 74, target: 84, summary: "Outcome learning still closes too slowly." },
    { id: "metric-liquidity", name: "Role liquidity", value: 77, target: 82, summary: "Role flexibility is strong in hybrid lanes." },
    { id: "metric-leverage", name: "Agent leverage", value: 69, target: 78, summary: "Agent productivity is limited by boundary maturity." },
    { id: "metric-adaptability", name: "Adaptability index", value: 81, target: 87, summary: "The model can shift without large structural rewrites." }
  ],
  scenarios: [
    {
      id: "current-state",
      label: "Current State",
      summary: "Workflow coordination is improving, but trust boundaries and learning closure still limit safe autonomy expansion.",
      moves: [
        "Concentrate governance effort in Trust & Boundary POD",
        "Stabilise orchestration before scaling agent mandates"
      ],
      riskSignal: "Delegation safety is sensitive to reviewer load."
    },
    {
      id: "target-state",
      label: "Target State",
      summary: "An adaptive operating model where PODs are modular, agent mandates are explicit, and governance remains visible as scale grows.",
      moves: [
        "Raise autonomy in reversible lanes",
        "Keep sovereignty explicit in trust-critical paths"
      ],
      riskSignal: "Platform and learning maturity become the main scale constraints."
    },
    {
      id: "pilot-pod",
      label: "Pilot POD",
      summary: "Pilot with Customer Signal POD plus Trust & Boundary POD to prove signal quality and safe delegation together.",
      moves: [
        "Run low-risk signal routing automation",
        "Instrument checkpoint and false positive rates"
      ],
      riskSignal: "Pilot fails if signal quality is measured without trust outcome review."
    },
    {
      id: "quarter-1",
      label: "Quarter 1",
      summary: "Focus on signal quality, checkpoint clarity, and the first delegation contracts.",
      moves: [
        "Launch Trust & Boundary POD",
        "Instrument Workflow Orchestration POD handoff waste"
      ],
      riskSignal: "Too much pilot scope creates unclear accountability."
    },
    {
      id: "quarter-2",
      label: "Quarter 2",
      summary: "Broaden orchestration and retrieval once boundary policies are stable and traceable.",
      moves: [
        "Expand reversible service lanes",
        "Increase context reuse across pods"
      ],
      riskSignal: "Platform dependency risk rises with adoption."
    },
    {
      id: "quarter-3",
      label: "Quarter 3",
      summary: "Shift from pilot logic to a living operating model with stronger learning closure and ecosystem interfaces.",
      moves: [
        "Formalise Learning Loop POD",
        "Open one external pathway through Ecosystem Growth POD"
      ],
      riskSignal: "Governance debt returns if growth moves ahead of policy hardening."
    }
  ],
  plan: {
    pilotPodRecommendation:
      "Start with Customer Signal POD, paired with Trust & Boundary POD, to validate sensing quality and delegation safety together.",
    roleTransitionPlan: [
      "Name Intent Steward and Trust Architect before widening agent mandates",
      "Assign every role to one of the nine IXO/Qi archetypes before expanding authority",
      "Move workflow ownership from generic operators to Agent Conductor and Workflow Composer",
      "Stand up Learning Curator once pilot outcome signals are stable"
    ],
    agentRolloutSequence: [
      "Signal Sensing Agent",
      "Retrieval Agent",
      "Workflow Orchestration Agent",
      "Compliance Monitor Agent",
      "Drift Detection Agent",
      "Scenario Comparison Agent"
    ],
    governanceHardening: [
      "Codify reversible vs irreversible action bands",
      "Add tool access tiers to every Delegation Contract",
      "Standardise checkpoint evidence and rollback expectations"
    ],
    quarterMilestones: [
      "Q1: Pilot sensing and trust boundary design",
      "Q2: Expand orchestration and knowledge reuse",
      "Q3: Institutionalise learning closure and ecosystem interfaces"
    ],
    risksAndCounterMoves: [
      "Risk: reviewer overload. Counter-move: narrow sovereignty-trigger conditions.",
      "Risk: orchestration brittleness. Counter-move: separate reversible and irreversible lanes.",
      "Risk: policy drift. Counter-move: monthly intent coherence review."
    ]
  }
};
