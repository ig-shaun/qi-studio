(function () {
  const data = window.QI_STUDIO_DATA;
  const STORAGE_KEY = "qi-studio-app-state-v1";
  const defaultState = {
    view: "organism",
    selectedRef: { kind: "skill", id: "skill-risk-controls-analysis" },
    activeScenarioId: "current-state",
    modal: null,
    generatedDraft: false,
    draftSuggestion:
      "Suggested move: create a Trust & Boundary POD before increasing agent autonomy.",
    stressResult: null,
    highlightedPodIds: []
  };

  const state = createDefaultState();

  const refs = {};
  const toastTimeouts = new Set();

  const VIEW_META = {
    intent: {
      eyebrow: "Intent layer",
      title: "Intent Kernel",
      subtitle:
        "Define the purpose, boundaries, and sovereignty conditions that shape the rest of the operating model."
    },
    organism: {
      eyebrow: "System view",
      title: "Organism",
      subtitle:
        "Start at mission, then move outward through objectives, PODs, and definitions."
    },
    "value-loops": {
      eyebrow: "Value architecture",
      title: "Value Loops",
      subtitle:
        "View the essential loops the organisation must sustain, including signals, latency, ownership, and learning feedback."
    },
    "pod-protocols": {
      eyebrow: "Programmable cooperation",
      title: "POD Protocols",
      subtitle:
        "Review each POD as a human-agent cooperation unit with explicit interfaces, guardrails, and fitness characteristics."
    },
    "role-lattice": {
      eyebrow: "Capability design",
      title: "Role Lattice",
      subtitle:
        "Map every human, agent, and hybrid role to a formal archetype with explicit authority, evidence, escalation, and failure modes."
    },
    "agent-delegation": {
      eyebrow: "Control surface",
      title: "Agent Delegation",
      subtitle:
        "Inspect delegated mandates through their archetype policy envelope, autonomy band, checkpoint, budget, and supervising human."
    },
    "qi-flow": {
      eyebrow: "Intelligence layer",
      title: "Qi Flow",
      subtitle:
        "Trace how sensing, meaning-making, decisioning, execution, and learning move through the organisation."
    },
    governance: {
      eyebrow: "Governance control plane",
      title: "Governance",
      subtitle:
        "Keep sovereignty zones, audit expectations, and escalation paths visible as first-class design choices."
    },
    "fitness-lab": {
      eyebrow: "Stress testing",
      title: "Fitness Lab",
      subtitle:
        "Assess whether the operating model remains coherent under stress, policy change, and workload shocks."
    },
    plan: {
      eyebrow: "Migration path",
      title: "Plan",
      subtitle:
        "Translate the target operating model into a pragmatic rollout sequence with visible risks and counter-moves."
    }
  };

  document.addEventListener("DOMContentLoaded", initApp);

  function initApp() {
    refs.navRail = document.getElementById("navRail");
    refs.canvasContent = document.getElementById("canvasContent");
    refs.inspectorPanel = document.getElementById("inspectorPanel");
    refs.scenarioBar = document.getElementById("scenarioBar");
    refs.modalRoot = document.getElementById("modalRoot");
    refs.toastRoot = document.getElementById("toastRoot");
    refs.viewEyebrow = document.getElementById("viewEyebrow");
    refs.viewTitle = document.getElementById("viewTitle");
    refs.viewSubtitle = document.getElementById("viewSubtitle");
    refs.viewMeta = document.getElementById("viewMeta");
    refs.workspaceName = document.getElementById("workspaceName");

    const restored = hydrateState();
    refs.workspaceName.textContent = data.workspaceName;

    document.body.addEventListener("click", handleClick);
    document.body.addEventListener("submit", handleSubmit);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", persistAppState);

    renderNav();
    renderView(state.view);
    renderInspector(resolveSelectedItem());
    renderScenarioBar();
    renderModal();
    persistAppState();

    if (restored) {
      showToast("Restored saved session.");
    }
  }

  function handleClick(event) {
    const navButton = event.target.closest("[data-nav]");
    if (navButton) {
      state.view = navButton.getAttribute("data-nav");
      renderNav();
      renderView(state.view);
      persistAppState();
      return;
    }

    const selectTrigger = event.target.closest("[data-select-kind][data-select-id]");
    if (selectTrigger) {
      state.selectedRef = {
        kind: selectTrigger.getAttribute("data-select-kind"),
        id: selectTrigger.getAttribute("data-select-id")
      };
      renderView(state.view);
      renderInspector(resolveSelectedItem());
      persistAppState();
      return;
    }

    const scenarioTrigger = event.target.closest("[data-scenario-id]");
    if (scenarioTrigger) {
      state.activeScenarioId = scenarioTrigger.getAttribute("data-scenario-id");
      renderView(state.view);
      renderInspector(resolveSelectedItem());
      renderScenarioBar();
      persistAppState();
      return;
    }

    const modalTrigger = event.target.closest("[data-open-modal]");
    if (modalTrigger) {
      const type = modalTrigger.getAttribute("data-open-modal");
      if (type === "ai") {
        openAIModal();
      }
      if (type === "stress") {
        openStressTestModal();
      }
      return;
    }

    const exportTrigger = event.target.closest("[data-export]");
    if (exportTrigger) {
      showToast("Demo export prepared.");
      return;
    }

    const closeModalTrigger = event.target.closest("[data-close-modal]");
    if (closeModalTrigger) {
      closeModal();
      return;
    }

    const backdrop = event.target.closest(".modal-backdrop");
    if (backdrop && event.target === backdrop) {
      closeModal();
    }
  }

  function handleSubmit(event) {
    const aiForm = event.target.closest("[data-form='ai']");
    if (aiForm) {
      event.preventDefault();
      state.generatedDraft = true;
      state.selectedRef = { kind: "pod", id: "pod-trust-boundary" };
      closeModal();
      renderView(state.view);
      renderInspector(resolveSelectedItem());
      persistAppState();
      showToast("Draft organism generated from Intent.");
      return;
    }

    const stressForm = event.target.closest("[data-form='stress']");
    if (stressForm) {
      event.preventDefault();
      const formData = new FormData(stressForm);
      const option = formData.get("stressCase");
      state.stressResult = {
        option: String(option || ""),
        message: "Stress test complete: delegation safety drops from 82 to 61."
      };
      state.highlightedPodIds = ["pod-trust-boundary", "pod-workflow-orchestration"];
      state.selectedRef = { kind: "pod", id: "pod-trust-boundary" };
      closeModal();
      renderView(state.view);
      renderInspector(resolveSelectedItem());
      persistAppState();
      showToast("Stress test complete: delegation safety drops from 82 to 61.");
    }
  }

  function renderNav() {
    refs.navRail.innerHTML = data.navigation
      .map(function (item) {
        const active = item.id === state.view ? " is-active" : "";
        return (
          '<button class="nav-button' +
          active +
          '" data-nav="' +
          escapeAttribute(item.id) +
          '">' +
          escapeHtml(item.label) +
          "</button>"
        );
      })
      .join("");
  }

  function renderView(viewName) {
    const meta = VIEW_META[viewName];
    refs.viewEyebrow.textContent = meta.eyebrow;
    refs.viewTitle.textContent = meta.title;
    refs.viewSubtitle.textContent = meta.subtitle;
    refs.viewMeta.innerHTML = renderHeaderMeta();

    let html = "";
    if (viewName === "intent") html = renderIntentView();
    if (viewName === "organism") html = renderOrganismView();
    if (viewName === "value-loops") html = renderValueLoopsView();
    if (viewName === "pod-protocols") html = renderPodProtocolsView();
    if (viewName === "role-lattice") html = renderRoleLatticeView();
    if (viewName === "agent-delegation") html = renderAgentDelegationView();
    if (viewName === "qi-flow") html = renderQiFlowView();
    if (viewName === "governance") html = renderGovernanceView();
    if (viewName === "fitness-lab") html = renderFitnessLabView();
    if (viewName === "plan") html = renderPlanView();

    refs.canvasContent.innerHTML = html;
  }

  function renderHeaderMeta() {
    const scenario = getActiveScenario();
    const safety = getMetric("Delegation safety");
    const flowIndex = getMetric("Intelligence Flow Index");
    return [
      '<div class="meta-pill"><span>Scenario</span><strong>' +
        escapeHtml(scenario.label) +
        "</strong></div>",
      '<div class="meta-pill"><span>System posture</span><strong>' +
        escapeHtml("Safety " + safety.value + "  Flow " + flowIndex.value) +
        "</strong></div>"
    ].join("");
  }

  function renderOrganismView() {
    const scenario = getActiveScenario();
    const flowIndex = getMetric("Intelligence Flow Index");
    const safety = getMetric("Delegation safety");
    const svg = buildOrganismSvg();
    const selectionMeta = getOrganismSelectionMeta();

    return (
      '<div class="organism-layout">' +
      '<section class="organism-stage">' +
      '<div class="organism-toolbar">' +
      '<div class="organism-toolbar__title">' +
      '<div class="eyebrow">Goalscape-style organism map</div>' +
      "<p>Mission at the centre. Objectives, PODs, and definitions radiate outward.</p>" +
      "</div>" +
      '<div class="organism-toolbar__legend">' +
      renderLegendChip("Mission", "#d7b267") +
      renderLegendChip("Objectives", "#69d7d8") +
      renderLegendChip("PODs", "#97a8ff") +
      renderLegendChip("Definitions", "#7fd1ab") +
      "</div>" +
      "</div>" +
      svg +
      "</section>" +
      '<aside class="organism-sidecar">' +
      '<div class="mini-card">' +
      "<h3>Selection</h3>" +
      (selectionMeta
        ? "<p>" + escapeHtml(selectionMeta.label) + "</p>"
        : "<p>Select a slice to inspect it.</p>") +
      (selectionMeta
        ? '<div class="score-chip score-chip--accent" style="margin-top: 12px;">' +
          escapeHtml(selectionMeta.trail) +
          "</div>"
        : "") +
      "</div>" +
      '<details class="mini-disclosure">' +
      "<summary>How to read the organism</summary>" +
      "<ul>" +
      renderListItem("Center: mission") +
      renderListItem("Ring 2: objectives") +
      renderListItem("Ring 3: PODs") +
      renderListItem("Ring 4: definitions") +
      "</ul>" +
      "</details>" +
      '<div class="mini-card mini-card--compact">' +
      "<h3>Signals</h3>" +
      '<div class="stack">' +
      renderScoreChip("Intelligence Flow Index", flowIndex.value, "accent") +
      renderScoreChip("Delegation Safety", safety.value, state.stressResult ? "alert" : "accent") +
      renderScoreChip("Role Liquidity", getMetric("Role liquidity").value, "accent") +
      "</div>" +
      "</div>" +
      (state.generatedDraft
        ? '<div class="mini-card"><h3>Generated result</h3><p>Draft organism generated from Intent.</p><div class="score-chip score-chip--accent" style="margin-top: 12px;">' +
          escapeHtml(state.draftSuggestion) +
          "</div></div>"
        : "") +
      (state.stressResult
        ? '<div class="mini-card"><h3>Stress-test result</h3><p>' +
          escapeHtml(state.stressResult.message) +
        '</p><div class="stack" style="margin-top: 14px;">' +
        renderToken("Trust & Boundary POD") +
        renderToken("Workflow Orchestration POD") +
        "</div></div>"
        : "") +
      "</aside>" +
      "</div>"
    );
  }

  function renderIntentView() {
    const intent = data.intentKernel;
    return (
      '<div class="intent-layout">' +
      '<section class="editor-panel">' +
      renderFieldBlock("Purpose", intent.purpose) +
      renderFieldBlock("Stakeholders served", intent.stakeholdersServed.join(", ")) +
      renderFieldBlock("Outcomes to optimize", intent.outcomesToOptimize.join(", ")) +
      renderFieldBlock("Constraints", intent.constraints.join(", ")) +
      renderFieldBlock("Non-negotiables", intent.nonNegotiables.join(", ")) +
      renderFieldBlock("Human judgment sovereignty zones", intent.sovereigntyZones.join(", ")) +
      renderFieldBlock("Ethical principles", intent.ethicalPrinciples.join(", ")) +
      renderFieldBlock("Adaptability target", intent.adaptabilityTarget) +
      "</section>" +
      '<aside class="preview-card view-card">' +
      '<div class="view-card__meta">Intent Kernel preview</div>' +
      "<h3>Intent Kernel</h3>" +
      "<p>" +
      escapeHtml(intent.summary) +
      "</p>" +
      "<blockquote>" +
      escapeHtml(intent.purpose) +
      "</blockquote>" +
      '<div class="stack" style="margin-top: 16px;">' +
      renderToken("Trust before speed") +
      renderToken("Visible accountability") +
      renderToken("Learning closure") +
      "</div>" +
      "</aside>" +
      "</div>"
    );
  }

  function renderValueLoopsView() {
    return (
      '<div class="grid-3">' +
      data.valueLoops
        .map(function (loop) {
          return (
            '<article class="view-card view-card--interactive" data-select-kind="valueLoop" data-select-id="' +
            escapeAttribute(loop.id) +
            '">' +
            '<div class="view-card__meta">Value Loop</div>' +
            "<h3>" +
            escapeHtml(loop.name) +
            "</h3>" +
            "<p>" +
            escapeHtml(loop.summary) +
            "</p>" +
            '<div class="stack" style="margin-top: 12px;">' +
            renderToken("Criticality: " + loop.criticality) +
            renderToken("Latency: " + loop.requiredLatency) +
            renderToken("Owning POD: " + getPod(loop.owningPodId).name) +
            "</div>" +
            "<ul>" +
            [
              "Trigger signals: " + loop.triggerSignals.join(", "),
              "Outcomes: " + loop.outcomes.join(", "),
              "Learning feedback: " + loop.learningFeedback
            ]
              .map(renderListItem)
              .join("") +
            "</ul>" +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderPodProtocolsView() {
    return (
      '<div class="grid-3">' +
      data.pods
        .map(function (pod) {
          return (
            '<article class="protocol-card view-card--interactive" data-select-kind="pod" data-select-id="' +
            escapeAttribute(pod.id) +
            '">' +
            '<div class="view-card__meta">' +
            escapeHtml(pod.podType) +
            "</div>" +
            "<h3>" +
            escapeHtml(pod.name) +
            "</h3>" +
            "<p>" +
            escapeHtml(pod.purpose) +
            "</p>" +
            '<div class="stack" style="margin-top: 14px;">' +
            renderScoreChip("Autonomy", pod.autonomyScore, "accent") +
            renderScoreChip("Delegation safety", pod.delegationSafety, "accent") +
            renderScoreChip("Cognitive load", pod.cognitiveLoad, "accent") +
            renderScoreChip("Governance debt", pod.governanceDebt, pod.governanceDebt > 25 ? "alert" : "accent") +
            "</div>" +
            '<ul><li>Human roles: ' +
            escapeHtml(renderRoleNames(pod.peopleRoleIds)) +
            '</li><li>Agent roles: ' +
            escapeHtml(renderRoleNames(pod.agentRoleIds)) +
            "</li></ul>" +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderRoleLatticeView() {
    return (
      '<div class="qi-flow-layout">' +
      '<section class="lattice-board">' +
      '<div class="lattice-board__header">' +
      '<div><div class="view-card__meta">Archetype policy lattice</div><h3>Nine reusable role shapes</h3><p>Roles remain fluid, but their authority model is no longer implicit.</p></div>' +
      '<div class="stack">' +
      renderToken("Authority scopes") +
      renderToken("Evidence boundary") +
      renderToken("Escalation triggers") +
      renderToken("Failure modes") +
      "</div>" +
      "</div>" +
      renderRoleLatticeGraphic() +
      "</section>" +
      '<aside class="lane-stack">' +
      '<div class="wire-card"><div class="view-card__meta">Archetype coverage</div><h3>Policy before job title</h3><p>Each role keeps its product name, but inherits a clear IXO/Qi archetype envelope.</p>' +
      renderArchetypeCoverage() +
      "</div>" +
      renderSelectedArchetypeCard() +
      '<div class="wire-card"><div class="view-card__meta">Role liquidity</div><h3>Controlled flexibility</h3><p>Hybrid roles can move between human judgment and agent capability only inside compatible archetype classes.</p></div>' +
      "</aside>" +
      "</div>"
    );
  }

  function renderAgentDelegationView() {
    return (
      '<div class="table-wrap">' +
      "<table>" +
      "<thead><tr><th>Agent</th><th>Archetype</th><th>Mandate</th><th>Autonomy</th><th>Authority envelope</th><th>Supervising role</th><th>Budget</th></tr></thead>" +
      "<tbody>" +
      data.delegationContracts
        .map(function (contract) {
          const agent = getAgentRole(contract.agentRoleId);
          const policy = getRolePolicy(agent);
          return (
            "<tr>" +
            '<td><button class="button button--ghost" style="min-height: 36px;" data-select-kind="agentRole" data-select-id="' +
            escapeAttribute(agent.id) +
            '">' +
            escapeHtml(agent.name) +
            "</button></td>" +
            "<td>" +
            renderArchetypeBadge(policy) +
            '<div class="table-cell-note">' +
            escapeHtml(policy ? policy.summary : "No archetype assigned") +
            "</div>" +
            "</td>" +
            "<td>" +
            escapeHtml(contract.mandate) +
            "</td>" +
            "<td>" +
            '<div class="table-cell-stack">' +
            renderToken(policy ? policy.defaultAutonomy : "assist") +
            renderToken(contract.autonomyLevel) +
            "</div>" +
            "</td>" +
            "<td>" +
            (policy
              ? '<div class="table-cell-stack">' +
                renderToken(policy.authorityScopes[0]) +
                renderToken(policy.authorityScopes[1] || policy.evidenceBoundary[0]) +
                '<span class="table-cell-note">' +
                escapeHtml(policy.coreGuardrail) +
                "</span></div>"
              : "") +
            "</td>" +
            "<td>" +
            escapeHtml(resolveRoleName(contract.supervisingHumanRoleId)) +
            '<div class="table-cell-note">' +
            escapeHtml(contract.checkpointPolicy) +
            "</div>" +
            "</td>" +
            "<td>" +
            escapeHtml(contract.costBudget) +
            "</td>" +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>" +
      "</table>" +
      "</div>"
    );
  }

  function renderQiFlowView() {
    const lanes = [
      {
        title: "Sensing",
        copy: "Signal Sensing Agent and Customer Signal POD convert weak signals into action-ready context."
      },
      {
        title: "Meaning-making",
        copy: "Trust Architect, Retrieval Agent, and Relationship Designer interpret what signals mean in context."
      },
      {
        title: "Decisioning",
        copy: "Intent Stewardship POD and Trust & Boundary POD clarify where authority sits and when to escalate."
      },
      {
        title: "Execution",
        copy: "Workflow Orchestration POD coordinates reversible and irreversible work through explicit lanes."
      },
      {
        title: "Learning",
        copy: "Learning Loop POD returns outcome evidence into redesign moves and protocol changes."
      }
    ];

    return (
      '<div class="qi-flow-layout">' +
      '<section class="lane-stack">' +
      lanes
        .map(function (lane) {
          return (
            '<article class="lane"><h3>' +
            escapeHtml(lane.title) +
            "</h3><p>" +
            escapeHtml(lane.copy) +
            "</p></article>"
          );
        })
        .join("") +
      "</section>" +
      '<aside class="mini-card">' +
      "<h3>Intelligence Flow Index</h3>" +
      '<div class="inspector-metric-grid">' +
      renderMetricBox("Signal latency", "14m") +
      renderMetricBox("Handoff count", "3.2") +
      renderMetricBox("Escalation latency", "2.1h") +
      renderMetricBox("Feedback closure", "74") +
      renderMetricBox("Context reuse", "68") +
      renderMetricBox("Flow score", "79") +
      "</div>" +
      '<p style="margin-top: 14px;">Qi Flow is strongest when context remains interpretable as it moves between pods, not merely fast.</p>' +
      "</aside>" +
      "</div>"
    );
  }

  function renderGovernanceView() {
    return (
      '<div class="governance-layout">' +
      '<section class="grid-2">' +
      data.governancePolicies
        .map(function (policy) {
          return (
            '<article class="view-card view-card--interactive" data-select-kind="governancePolicy" data-select-id="' +
            escapeAttribute(policy.id) +
            '">' +
            '<div class="view-card__meta">Governance Control Plane</div>' +
            "<h3>" +
            escapeHtml(policy.name) +
            "</h3>" +
            "<p>" +
            escapeHtml(policy.summary) +
            "</p>" +
            '<div class="stack" style="margin-top: 12px;">' +
            policy.appliesTo
              .slice(0, 3)
              .map(function (id) {
                return renderToken(getPod(id).name);
              })
              .join("") +
            "</div>" +
            "</article>"
          );
        })
        .join("") +
      "</section>" +
      '<aside class="wire-card">' +
      "<h3>Human Judgment Sovereignty Zone</h3>" +
      "<p>" +
      escapeHtml(data.intentKernel.sovereigntyZones.join(". ")) +
      "</p>" +
      '<div class="stack" style="margin-top: 14px;">' +
      renderToken("Checkpoint design") +
      renderToken("Audit trace") +
      renderToken("Escalation ownership") +
      "</div>" +
      "</aside>" +
      "</div>"
    );
  }

  function renderFitnessLabView() {
    const cards = [
      "Remove checkpoint",
      "Add 4x workload",
      "Degrade agent accuracy",
      "Delay platform dependency",
      "Change regulatory policy",
      "Shift value loop to new market"
    ];

    return (
      '<div class="fitness-layout">' +
      '<section class="grid-2">' +
      cards
        .map(function (card) {
          return (
            '<article class="view-card"><div class="view-card__meta">Stress card</div><h3>' +
            escapeHtml(card) +
            "</h3><p>Use this scenario to test how intent coherence, delegation safety, and learning closure respond when one system assumption breaks.</p></article>"
          );
        })
        .join("") +
      "</section>" +
      '<aside class="mini-card">' +
      "<h3>Viability scores</h3>" +
      '<div class="inspector-metric-grid">' +
      data.fitnessMetrics
        .slice(0, 8)
        .map(function (metric) {
          return renderMetricBox(metric.name, String(metric.value));
        })
        .join("") +
      "</div>" +
      (state.stressResult
        ? '<p style="margin-top: 14px;">' + escapeHtml(state.stressResult.message) + "</p>"
        : '<p style="margin-top: 14px;">Run a stress test to expose where the operating model is brittle before the prototype moves into broader rollout.</p>') +
      "</aside>" +
      "</div>"
    );
  }

  function renderPlanView() {
    return (
      '<div class="plan-layout">' +
      '<section class="lane-stack">' +
      '<article class="view-card"><div class="view-card__meta">Pilot POD recommendation</div><h3>' +
      escapeHtml(data.plan.pilotPodRecommendation) +
      "</h3></article>" +
      '<article class="view-card"><div class="view-card__meta">Role transition plan</div><ul>' +
      data.plan.roleTransitionPlan.map(renderListItem).join("") +
      "</ul></article>" +
      '<article class="view-card"><div class="view-card__meta">Agent rollout sequence</div><ul>' +
      data.plan.agentRolloutSequence.map(renderListItem).join("") +
      "</ul></article>" +
      '<article class="view-card"><div class="view-card__meta">Governance hardening</div><ul>' +
      data.plan.governanceHardening.map(renderListItem).join("") +
      "</ul></article>" +
      "</section>" +
      '<aside class="mini-card">' +
      "<h3>Quarter-by-quarter milestones</h3>" +
      "<ul>" +
      data.plan.quarterMilestones.map(renderListItem).join("") +
      "</ul>" +
      '<h3 style="margin-top: 18px;">Risks and counter-moves</h3>' +
      "<ul>" +
      data.plan.risksAndCounterMoves.map(renderListItem).join("") +
      "</ul>" +
      "</aside>" +
      "</div>"
    );
  }

  function renderInspector(item) {
    const scenario = getActiveScenario();

    if (!item) {
      refs.inspectorPanel.innerHTML =
        '<div class="inspector-panel__header"><div><span class="inspector-tag">Overview</span><h3>Design posture</h3><p>Select an item to inspect its protocol, accountability, or delegation contract.</p></div></div>' +
        '<div class="inspector-grid">' +
        renderInspectorSection("Summary", "<p>" + escapeHtml(scenario.summary) + "</p>") +
        renderInspectorCard(
          "Current signals",
          '<div class="stack">' +
            renderScoreChip("Intent coherence", getMetric("Intent coherence").value, "accent") +
            renderScoreChip("Delegation safety", getMetric("Delegation safety").value, "accent") +
            renderScoreChip("Learning closure", getMetric("Learning closure").value, "accent") +
            "</div>"
        ) +
        renderDisclosure(
          "Scenario moves",
          "<ul>" + scenario.moves.map(renderListItem).join("") + "</ul>"
        ) +
        "</div>";
      return;
    }

    const inspector = buildInspectorContent(item);
    const breadcrumb = getOrganismTrailString(item.kind, item.id);

    refs.inspectorPanel.innerHTML =
      '<div class="inspector-panel__header"><div><span class="inspector-tag">' +
      escapeHtml(inspector.tag) +
      "</span><h3>" +
      escapeHtml(inspector.title) +
      "</h3>" +
      (breadcrumb
        ? '<div class="inspector-crumbs">' + escapeHtml(breadcrumb) + "</div>"
        : "") +
      "<p>" +
      escapeHtml(inspector.subtitle) +
      "</p></div></div>" +
      '<div class="inspector-grid">' +
      renderInspectorSection("Summary", "<p>" + escapeHtml(inspector.summary) + "</p>") +
      renderOptionalMetrics(inspector.metrics) +
      renderSpecializedCard(inspector) +
      renderInspectorEssentials(inspector) +
      "</div>";
  }

  function buildInspectorContent(item) {
    if (item.kind === "intentKernel") {
      return {
        tag: "Intent Kernel",
        title: item.name,
        subtitle: "Purpose defines structure.",
        summary: item.summary,
        purpose: item.purpose,
        accountabilities: item.outcomesToOptimize,
        humanRoles: ["Intent Steward", "Trust Architect"],
        agentRoles: ["Scenario Comparison Agent"],
        delegationBoundaries: item.sovereigntyZones,
        governanceCheckpoints: ["Intent change review", "Quarterly structural review"],
        metrics: ["Intent coherence", "Adaptability index"],
        risks: ["Intent blur creates local optimisation and governance drift."],
        suggestedMoves: [
          "Keep intent visible in every view",
          "Tie quarterly plan shifts back to explicit purpose language"
        ]
      };
    }

    if (item.kind === "valueLoop") {
      const ownerPod = getPod(item.owningPodId);
      return {
        tag: "Value Loop",
        title: item.name,
        subtitle: "Loop owner and learning cycle.",
        summary: item.summary,
        purpose: item.purpose,
        accountabilities: item.outcomes,
        humanRoles: resolveRoleNames(ownerPod.peopleRoleIds),
        agentRoles: resolveRoleNames(ownerPod.agentRoleIds),
        delegationBoundaries: item.risks,
        governanceCheckpoints: ["Loop owner review", "Latency review"],
        metrics: item.metrics,
        risks: item.risks,
        suggestedMoves: ["Tighten loop interfaces and learning feedback visibility."]
      };
    }

    if (item.kind === "pod") {
      return {
        tag: "POD Protocol",
        title: item.name,
        subtitle: item.podType,
        summary: item.summary,
        purpose: item.purpose,
        accountabilities: item.accountabilities,
        humanRoles: resolveRoleNames(item.peopleRoleIds),
        agentRoles: resolveRoleNames(item.agentRoleIds),
        delegationBoundaries: item.delegationBoundaries,
        governanceCheckpoints: item.governanceCheckpoints,
        metrics: item.metrics,
        risks: item.risks,
        suggestedMoves: item.suggestedMoves,
        cardType: "pod",
        cardData: item
      };
    }

    if (item.kind === "humanRole" || item.kind === "hybridRole") {
      const policy = getRolePolicy(item);
      return {
        tag:
          (item.kind === "humanRole" ? "Human role" : "Hybrid role") +
          (policy ? " / " + policy.label : ""),
        title: item.name,
        subtitle: policy ? item.summary + " / " + policy.summary : item.summary,
        summary: item.summary,
        purpose: item.purpose,
        accountabilities: item.accountabilities,
        humanRoles: item.kind === "humanRole" ? [item.name] : [],
        agentRoles: item.kind === "hybridRole" ? ["Connected to human and agent accountability"] : [],
        delegationBoundaries: policy
          ? policy.authorityScopes
          : ["Role changes should preserve named accountability."],
        governanceCheckpoints: policy
          ? policy.escalationTriggers
          : ["Role handoff review"],
        metrics: (item.metrics || ["Role liquidity"]).concat(
          policy ? [policy.label + " archetype", policy.defaultAutonomy] : []
        ),
        risks: policy
          ? policy.failureModes
          : ["Role liquidity can become ambiguity if authority is not explicit."],
        suggestedMoves: [
          item.archetypeRationale || "Clarify decision rights where this role crosses POD boundaries."
        ],
        cardType: "role",
        cardData: item,
        archetypePolicy: policy
      };
    }

    if (item.kind === "agentRole") {
      const contract = getDelegationContractByAgentId(item.id);
      const policy = getRolePolicy(item);
      return {
        tag: "Agent role" + (policy ? " / " + policy.label : ""),
        title: item.name,
        subtitle: policy ? item.summary + " / " + policy.summary : item.summary,
        summary: item.summary,
        purpose: item.purpose,
        accountabilities: item.accountabilities,
        humanRoles: contract ? [resolveRoleName(contract.supervisingHumanRoleId)] : [],
        agentRoles: [item.name],
        delegationBoundaries: contract ? contract.forbiddenActions : [],
        governanceCheckpoints: contract
          ? [contract.checkpointPolicy].concat(policy ? policy.escalationTriggers : [])
          : policy
            ? policy.escalationTriggers
            : [],
        metrics: [
          "Delegation safety",
          "Trace quality",
          "Budget adherence"
        ].concat(policy ? [policy.label + " archetype", policy.defaultAutonomy] : []),
        risks: policy
          ? policy.failureModes
          : ["Agent leverage rises faster than trust if mandates are broad and opaque."],
        suggestedMoves: [
          item.archetypeRationale || "Raise mandate clarity before increasing autonomy."
        ],
        cardType: "agent",
        cardData: { contract: contract, policy: policy, role: item },
        archetypePolicy: policy
      };
    }

    if (item.kind === "skill") {
      return {
        tag: "Skill definition",
        title: item.name,
        subtitle: item.summary,
        summary: item.summary,
        purpose: item.purpose,
        accountabilities: item.applications,
        humanRoles: ["Used inside named POD protocols"],
        agentRoles: ["Supports programmable capability in the outer ring"],
        delegationBoundaries: ["Skills describe reusable capability; they do not carry autonomous mandate by themselves."],
        governanceCheckpoints: ["Skill adoption review", "POD protocol fit review"],
        metrics: ["Capability reuse", "POD fit", "Learning closure"],
        risks: ["Skills become decorative if they are not tied to named PODs and agents."],
        suggestedMoves: ["Attach this skill to explicit POD interfaces and delegation contracts."]
      };
    }

    if (item.kind === "governancePolicy") {
      return {
        tag: "Governance policy",
        title: item.name,
        subtitle: "Control plane policy",
        summary: item.summary,
        purpose: item.summary,
        accountabilities: item.appliesTo.map(function (podId) {
          return getPod(podId).name;
        }),
        humanRoles: ["Trust Architect", "Intent Steward"],
        agentRoles: ["Compliance Monitor Agent"],
        delegationBoundaries: ["Policies cannot be implicitly bypassed by workflow design."],
        governanceCheckpoints: ["Policy review", "Audit review"],
        metrics: ["Governance debt", "Delegation safety"],
        risks: ["Policy language decays if it is not linked to live delegation contracts."],
        suggestedMoves: ["Map policy changes directly to POD and agent contract changes."]
      };
    }

    if (item.kind === "intelligenceFlow") {
      return {
        tag: "Qi Flow",
        title: item.name,
        subtitle: item.emphasis,
        summary: item.summary,
        purpose: item.summary,
        accountabilities: ["Preserve context quality", "Reduce handoff waste"],
        humanRoles: ["Intelligence Flow Curator"],
        agentRoles: ["Scenario Comparison Agent", "Retrieval Agent"],
        delegationBoundaries: ["Qi Flow should not hide authority or accountability boundaries."],
        governanceCheckpoints: ["Flow redesign review"],
        metrics: ["Flow score: " + item.flowScore],
        risks: ["Fast flow without meaning-making produces brittle automation."],
        suggestedMoves: ["Improve context trace between source and target PODs."]
      };
    }

    if (item.kind === "fitnessMetric") {
      return {
        tag: "Fitness metric",
        title: item.name,
        subtitle: "Operating-model viability indicator",
        summary: item.summary,
        purpose: item.summary,
        accountabilities: ["Track score movement", "Link metric change to redesign action"],
        humanRoles: ["Intent Steward", "Learning Curator"],
        agentRoles: ["Drift Detection Agent"],
        delegationBoundaries: ["Scores should not change without visible assumptions."],
        governanceCheckpoints: ["Metric interpretation review"],
        metrics: [item.name + ": " + item.value + " / target " + item.target],
        risks: ["Metrics without redesign ownership become decorative."],
        suggestedMoves: ["Tie this metric to a named POD redesign backlog item."]
      };
    }

    return {
      tag: "Overview",
      title: "Design posture",
      subtitle: "",
      summary: "",
      purpose: "",
      accountabilities: [],
      humanRoles: [],
      agentRoles: [],
      delegationBoundaries: [],
      governanceCheckpoints: [],
      metrics: [],
      risks: [],
      suggestedMoves: []
    };
  }

  function renderSpecializedCard(inspector) {
    if (inspector.cardType === "pod") {
      const pod = inspector.cardData;
      return renderInspectorCard(
        "POD Protocol",
        "<ul>" +
          renderListItem("Owned value loop: " + getValueLoop(pod.ownedValueLoopId).name) +
          renderListItem("Decision rights: " + pod.decisionRights.join(", ")) +
          renderListItem("Fitness score: " + pod.fitnessScore) +
          renderListItem("Cost profile: " + pod.costProfile) +
          "</ul>" +
          renderDisclosure(
            "Full protocol",
            "<ul>" +
              renderListItem("Purpose: " + pod.purpose) +
              renderListItem("Inputs: " + pod.inputs.join(", ")) +
              renderListItem("Outputs: " + pod.outputs.join(", ")) +
              renderListItem("People roles: " + renderRoleNames(pod.peopleRoleIds)) +
              renderListItem("Agent roles: " + renderRoleNames(pod.agentRoleIds)) +
              renderListItem("Guardrails: " + pod.guardrails.join(", ")) +
              renderListItem("Interfaces: " + pod.interfaces.join(", ")) +
              renderListItem("Learning obligations: " + pod.learningObligations.join(", ")) +
              "</ul>"
          )
      );
    }

    if (inspector.cardType === "role" && inspector.archetypePolicy) {
      return renderPolicyEnvelopeCard(inspector.archetypePolicy, inspector.cardData);
    }

    if (inspector.cardType === "agent" && inspector.cardData) {
      const contract = inspector.cardData.contract;
      const policy = inspector.cardData.policy;
      return renderInspectorCard(
        "Delegation Contract",
        "<ul>" +
          (policy ? renderListItem("Archetype: " + policy.label) : "") +
          (policy ? renderListItem("Guardrail: " + policy.coreGuardrail) : "") +
          renderListItem("Mandate: " + (contract ? contract.mandate : "No contract assigned")) +
          renderListItem("Autonomy level: " + (contract ? contract.autonomyLevel : policy ? policy.defaultAutonomy : "assist")) +
          (contract
            ? renderListItem("Supervising role: " + resolveRoleName(contract.supervisingHumanRoleId))
            : "") +
          (contract ? renderListItem("Cost budget: " + contract.costBudget) : "") +
          "</ul>" +
          (policy
            ? renderDisclosure("Archetype policy envelope", renderPolicyEnvelopeList(policy))
            : "") +
          renderDisclosure(
            "Full contract",
            "<ul>" +
              (contract
                ? renderListItem("Allowed actions: " + contract.allowedActions.join(", ")) +
                  renderListItem("Forbidden actions: " + contract.forbiddenActions.join(", ")) +
                  renderListItem("Tool access: " + contract.toolAccess.join(", ")) +
                  renderListItem("Checkpoint policy: " + contract.checkpointPolicy) +
                  renderListItem("Observability: " + contract.observability) +
                  renderListItem("Rollback policy: " + contract.rollbackPolicy)
                : renderListItem("No contract has been assigned to this role.")) +
              "</ul>"
          )
      );
    }

    return "";
  }

  function renderInspectorEssentials(inspector) {
    var blocks = "";
    const rolesHtml =
      renderOptionalListSection("Accountabilities", inspector.accountabilities) +
      renderOptionalListSection("Human roles", inspector.humanRoles) +
      renderOptionalListSection("Agent roles", inspector.agentRoles);
    if (rolesHtml) {
      blocks += renderDisclosure("Roles & accountabilities", rolesHtml);
    }
    const controlsHtml =
      renderOptionalSection("Purpose", inspector.purpose) +
      renderOptionalListSection("Delegation boundaries", inspector.delegationBoundaries) +
      renderOptionalListSection("Governance checkpoints", inspector.governanceCheckpoints);
    if (controlsHtml) {
      blocks += renderDisclosure("Controls", controlsHtml);
    }
    const signalsHtml =
      renderOptionalListSection("Risks", inspector.risks) +
      renderOptionalListSection("Suggested redesign moves", inspector.suggestedMoves);
    if (signalsHtml) {
      blocks += renderDisclosure("Risks & redesign", signalsHtml);
    }
    return blocks;
  }

  function renderScenarioBar() {
    const scenario = getActiveScenario();
    refs.scenarioBar.innerHTML =
      '<div class="timeline-track">' +
      data.scenarios
        .map(function (item) {
          const active = item.id === state.activeScenarioId ? " is-active" : "";
          return (
            '<button class="timeline-button' +
            active +
            '" data-scenario-id="' +
            escapeAttribute(item.id) +
            '">' +
            '<span class="view-card__meta">Scenario stage</span>' +
            "<strong>" +
            escapeHtml(item.label) +
            "</strong>" +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<aside class="timeline-summary">' +
      "<h3>" +
      escapeHtml(scenario.label) +
      "</h3>" +
      "<p>" +
      escapeHtml(scenario.summary) +
      "</p>" +
      "<ul>" +
      scenario.moves.map(renderListItem).join("") +
      "</ul>" +
      "</aside>";
  }

  function openAIModal() {
    state.modal = "ai";
    renderModal();
    persistAppState();
  }

  function openStressTestModal() {
    state.modal = "stress";
    renderModal();
    persistAppState();
  }

  function closeModal() {
    state.modal = null;
    renderModal();
    persistAppState();
  }

  function renderModal() {
    if (!state.modal) {
      refs.modalRoot.innerHTML = "";
      return;
    }

    if (state.modal === "ai") {
      refs.modalRoot.innerHTML =
        '<div class="modal-backdrop">' +
        '<div class="modal">' +
        '<div class="modal__header"><div><h3>Generate an AI-native organisation from Intent</h3><p class="muted">This is a mocked generation flow for the prototype. No API call is made.</p></div><button class="icon-button" data-close-modal="true">x</button></div>' +
        '<form data-form="ai">' +
        renderTextareaField(
          "What change in the world should this organisation continuously create?",
          "Increase trusted customer value through adaptive human-agent cooperation."
        ) +
        renderTextareaField(
          "Who are the humans and intelligent systems it serves?",
          "Customers, trust and service teams, platform stewards, and intelligent systems coordinating context and workflow."
        ) +
        renderTextareaField(
          "Where must human judgment remain sovereign?",
          "Policy interpretation, trust exceptions, and irreversible customer-impacting actions."
        ) +
        renderTextareaField(
          "What value loops are essential?",
          "Sense needs, build trust, deliver service, govern risk, learn from outcomes, grow ecosystem."
        ) +
        renderTextareaField(
          "What should agents be trusted to do?",
          "Sense signals, retrieve context, route reversible workflows, monitor policy, detect drift, compare scenarios."
        ) +
        '<div class="modal-actions"><button type="button" class="button button--ghost" data-close-modal="true">Cancel</button><button type="submit" class="button button--primary">Generate draft organism</button></div>' +
        "</form>" +
        "</div>" +
        "</div>";
      return;
    }

    if (state.modal === "stress") {
      refs.modalRoot.innerHTML =
        '<div class="modal-backdrop">' +
        '<div class="modal">' +
        '<div class="modal__header"><div><h3>Stress test this operating model</h3><p class="muted">Use a single mocked condition to reveal where delegation safety is brittle.</p></div><button class="icon-button" data-close-modal="true">x</button></div>' +
        '<form data-form="stress">' +
        renderSelectField("Condition", "stressCase", [
          "Agent acts outside confidence threshold",
          "Human reviewer overloaded",
          "Customer signal volume doubles",
          "Platform dependency fails",
          "Governance policy changes",
          "Learning loop stops closing"
        ]) +
        '<div class="modal-actions"><button type="button" class="button button--ghost" data-close-modal="true">Cancel</button><button type="submit" class="button button--secondary">Run stress test</button></div>' +
        "</form>" +
        "</div>" +
        "</div>";
    }
  }

  function showToast(message) {
    const id = "toast-" + Date.now();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = id;
    toast.textContent = message;
    refs.toastRoot.appendChild(toast);
    const timeout = window.setTimeout(function () {
      toast.remove();
      toastTimeouts.delete(timeout);
    }, 2400);
    toastTimeouts.add(timeout);
  }

  function createDefaultState() {
    return {
      view: defaultState.view,
      selectedRef: {
        kind: defaultState.selectedRef.kind,
        id: defaultState.selectedRef.id
      },
      activeScenarioId: defaultState.activeScenarioId,
      modal: defaultState.modal,
      generatedDraft: defaultState.generatedDraft,
      draftSuggestion: defaultState.draftSuggestion,
      stressResult: defaultState.stressResult,
      highlightedPodIds: defaultState.highlightedPodIds.slice()
    };
  }

  function getPersistableState() {
    return {
      view: state.view,
      selectedRef: state.selectedRef
        ? { kind: state.selectedRef.kind, id: state.selectedRef.id }
        : null,
      activeScenarioId: state.activeScenarioId,
      modal: state.modal,
      generatedDraft: state.generatedDraft,
      draftSuggestion: state.draftSuggestion,
      stressResult: state.stressResult
        ? {
            option: state.stressResult.option,
            message: state.stressResult.message
          }
        : null,
      highlightedPodIds: state.highlightedPodIds.slice()
    };
  }

  function getDefaultPersistableState() {
    return {
      view: defaultState.view,
      selectedRef: {
        kind: defaultState.selectedRef.kind,
        id: defaultState.selectedRef.id
      },
      activeScenarioId: defaultState.activeScenarioId,
      modal: defaultState.modal,
      generatedDraft: defaultState.generatedDraft,
      draftSuggestion: defaultState.draftSuggestion,
      stressResult: defaultState.stressResult,
      highlightedPodIds: defaultState.highlightedPodIds.slice()
    };
  }

  function persistAppState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistableState()));
    } catch (_error) {
      // Ignore localStorage failures so the prototype still runs from file://.
    }
  }

  function hydrateState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      applyHydratedState(saved);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function applyHydratedState(saved) {
    if (!saved || typeof saved !== "object") return;

    if (isValidView(saved.view)) {
      state.view = saved.view;
    }

    if (isValidScenario(saved.activeScenarioId)) {
      state.activeScenarioId = saved.activeScenarioId;
    }

    if (saved.modal === null || saved.modal === "ai" || saved.modal === "stress") {
      state.modal = saved.modal;
    }

    if (typeof saved.generatedDraft === "boolean") {
      state.generatedDraft = saved.generatedDraft;
    }

    if (typeof saved.draftSuggestion === "string" && saved.draftSuggestion.trim()) {
      state.draftSuggestion = saved.draftSuggestion;
    }

    if (saved.stressResult && typeof saved.stressResult === "object") {
      const message = typeof saved.stressResult.message === "string" ? saved.stressResult.message : "";
      const option = typeof saved.stressResult.option === "string" ? saved.stressResult.option : "";
      state.stressResult = message ? { option: option, message: message } : null;
    } else {
      state.stressResult = null;
    }

    if (Array.isArray(saved.highlightedPodIds)) {
      state.highlightedPodIds = saved.highlightedPodIds.filter(isValidPodId);
    }

    if (saved.selectedRef && isValidSelection(saved.selectedRef.kind, saved.selectedRef.id)) {
      state.selectedRef = {
        kind: saved.selectedRef.kind,
        id: saved.selectedRef.id
      };
    }
  }

  function handleBeforeUnload(event) {
    persistAppState();
    if (!hasSessionChanges()) return;
    event.preventDefault();
    event.returnValue =
      "Your Qi Studio session is saved in this browser. Export before leaving if you want a portable copy.";
  }

  function hasSessionChanges() {
    return JSON.stringify(getPersistableState()) !== JSON.stringify(getDefaultPersistableState());
  }

  function buildOrganismSvg() {
    const model = buildOrganismModel();
    const selectedKey = state.selectedRef ? state.selectedRef.kind + ":" + state.selectedRef.id : "";
    const selectedEntry = model.index[selectedKey];
    const ancestorKeys = selectedEntry ? selectedEntry.ancestorKeys : [];
    const width = 1020;
    const height = 760;
    const centerX = 470;
    const centerY = 392;
    const centerRadius = 92;
    const objectiveOuterRadius = 230;
    const podOuterRadius = 340;
    const definitionOuterRadius = 456;

    const objectiveSegments = [];
    const podSegments = [];
    const definitionSegments = [];

    model.objectives.forEach(function (objective) {
      objectiveSegments.push(
        renderOrganismSegment(
          objective,
          centerX,
          centerY,
          centerRadius,
          objectiveOuterRadius,
          selectedKey,
          ancestorKeys,
          18,
          2
        )
      );

      objective.pods.forEach(function (pod) {
        podSegments.push(
          renderOrganismSegment(
            pod,
            centerX,
            centerY,
            objectiveOuterRadius,
            podOuterRadius,
            selectedKey,
            ancestorKeys,
            15,
            2
          )
        );

        pod.definitions.forEach(function (definition) {
          definitionSegments.push(
            renderOrganismSegment(
              definition,
              centerX,
              centerY,
              podOuterRadius,
              definitionOuterRadius,
              selectedKey,
              ancestorKeys,
              11,
              3
            )
          );
        });
      });
    });

    return (
      '<svg class="organism-svg" viewBox="0 0 ' +
      width +
      " " +
      height +
      '" role="img" aria-label="Organism map">' +
      '<defs>' +
      '<filter id="organismShadow"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="rgba(0,0,0,0.26)"></feDropShadow></filter>' +
      '<radialGradient id="organismGlow" cx="50%" cy="50%" r="65%"><stop offset="0%" stop-color="rgba(255,255,255,0.08)"></stop><stop offset="100%" stop-color="rgba(255,255,255,0)"></stop></radialGradient>' +
      "</defs>" +
      '<rect x="0" y="0" width="' +
      width +
      '" height="' +
      height +
      '" fill="transparent"></rect>' +
      '<circle cx="' +
      centerX +
      '" cy="' +
      centerY +
      '" r="' +
      (definitionOuterRadius + 14) +
      '" fill="url(#organismGlow)"></circle>' +
      '<g class="organism-surface" filter="url(#organismShadow)">' +
      definitionSegments.join("") +
      podSegments.join("") +
      objectiveSegments.join("") +
      '<g class="organism-segment ' +
      (selectedKey === "intentKernel:" + data.intentKernel.id ? "is-selected" : "") +
      '" data-select-kind="intentKernel" data-select-id="' +
      escapeAttribute(data.intentKernel.id) +
      '">' +
      '<circle cx="' +
      centerX +
      '" cy="' +
      centerY +
      '" r="' +
      centerRadius +
      '" fill="' +
      (selectedKey === "intentKernel:" + data.intentKernel.id ? "#5dc7f5" : "#f8f6ef") +
      '" stroke="rgba(56,59,64,0.42)" stroke-width="1.4"></circle>' +
      renderCenteredOrganismLabel(data.intentKernel.purpose, centerX, centerY) +
      "</g>" +
      "</g>" +
      "</svg>"
    );
  }

  function buildOrganismModel() {
    const index = {};
    const objectives = data.valueLoops.map(function (loop) {
      const pods = data.pods
        .filter(function (pod) {
          return pod.ownedValueLoopId === loop.id;
        })
        .map(function (pod) {
          const definitions = buildOrganismDefinitions(pod);
          return {
            kind: "pod",
            id: pod.id,
            key: "pod:" + pod.id,
            label: pod.name,
            summary: pod.summary,
            definitions: definitions,
            weight: Math.max(definitions.length, 1),
            parentKey: "valueLoop:" + loop.id,
            trail: [loop.name, pod.name],
            ancestorKeys: ["valueLoop:" + loop.id]
          };
        });

      const weight = Math.max(
        pods.reduce(function (sum, pod) {
          return sum + pod.weight;
        }, 0),
        1
      );

      return {
        kind: "valueLoop",
        id: loop.id,
        key: "valueLoop:" + loop.id,
        label: loop.name,
        summary: loop.summary,
        pods: pods,
        weight: weight,
        trail: [loop.name],
        ancestorKeys: []
      };
    });

    const totalWeight = objectives.reduce(function (sum, objective) {
      return sum + objective.weight;
    }, 0);

    let angleCursor = -90;

    objectives.forEach(function (objective) {
      const objectiveSpan = (360 * objective.weight) / totalWeight;
      objective.startAngle = angleCursor;
      objective.endAngle = angleCursor + objectiveSpan;
      objective.tone = "#69d7d8";
      index[objective.key] = objective;

      let podCursor = objective.startAngle;

      objective.pods.forEach(function (pod) {
        const podSpan = objectiveSpan * (pod.weight / objective.weight);
        pod.startAngle = podCursor;
        pod.endAngle = podCursor + podSpan;
        pod.tone = state.highlightedPodIds.indexOf(pod.id) >= 0 ? "#ff9566" : "#97a8ff";
        index[pod.key] = pod;

        let definitionCursor = pod.startAngle;

        pod.definitions.forEach(function (definition) {
          const definitionSpan = podSpan / pod.definitions.length;
          definition.startAngle = definitionCursor;
          definition.endAngle = definitionCursor + definitionSpan;
          definition.parentKey = pod.key;
          definition.ancestorKeys = [objective.key, pod.key];
          definition.trail = [objective.label, pod.label, definition.label];
          index[definition.key] = definition;
          definitionCursor += definitionSpan;
        });

        podCursor += podSpan;
      });

      angleCursor += objectiveSpan;
    });

    index["intentKernel:" + data.intentKernel.id] = {
      kind: "intentKernel",
      id: data.intentKernel.id,
      key: "intentKernel:" + data.intentKernel.id,
      label: data.intentKernel.name,
      trail: [data.intentKernel.name],
      ancestorKeys: []
    };

    return { objectives: objectives, index: index };
  }

  function buildOrganismDefinitions(pod) {
    const definitions = [];
    const seen = new Set();

    function pushDefinition(kind, id) {
      const key = kind + ":" + id;
      if (seen.has(key)) return;
      seen.add(key);
      definitions.push({
        kind: kind,
        id: id,
        key: key,
        label: getDefinitionName(kind, id),
        tone: getDefinitionTone(kind, id)
      });
    }

    pod.peopleRoleIds.forEach(function (id) {
      pushDefinition(findRoleKindById(id), id);
    });
    pod.agentRoleIds.forEach(function (id) {
      pushDefinition("agentRole", id);
    });
    (pod.skillIds || []).forEach(function (id) {
      pushDefinition("skill", id);
    });

    return definitions;
  }

  function renderOrganismSegment(segment, centerX, centerY, innerRadius, outerRadius, selectedKey, ancestorKeys, fontSize, maxLines) {
    const isSelected = segment.key === selectedKey;
    const isAncestor = ancestorKeys.indexOf(segment.key) >= 0;
    const isHighlightedPod = segment.kind === "pod" && state.highlightedPodIds.indexOf(segment.id) >= 0;
    const fill = isSelected
      ? "#5dc7f5"
      : isHighlightedPod
        ? "#ffd5c2"
        : isAncestor
          ? "#e8f7ff"
          : "#f8f6ef";
    const stroke = isSelected ? "#2484af" : "rgba(63, 65, 73, 0.42)";
    const labelColor = isSelected ? "#0e2632" : "#22262d";

    return (
      '<g class="organism-segment' +
      (isSelected ? " is-selected" : "") +
      (isAncestor ? " is-ancestor" : "") +
      '" data-select-kind="' +
      escapeAttribute(segment.kind) +
      '" data-select-id="' +
      escapeAttribute(segment.id) +
      '">' +
      '<path d="' +
      sectorPath(centerX, centerY, innerRadius, outerRadius, segment.startAngle, segment.endAngle) +
      '" fill="' +
      fill +
      '" stroke="' +
      stroke +
      '" stroke-width="' +
      (isSelected ? "1.9" : "1.1") +
      '"></path>' +
      renderRadialLabel(segment.label, centerX, centerY, innerRadius, outerRadius, segment.startAngle, segment.endAngle, fontSize, maxLines, labelColor) +
      "</g>"
    );
  }

  function renderCenteredOrganismLabel(label, x, y) {
    const lines = wrapLabel(label, 20, 4);
    return (
      '<text class="organism-center-text" x="' +
      x +
      '" y="' +
      (y - (lines.length - 1) * 12) +
      '" text-anchor="middle" fill="#22262d" font-size="15" font-weight="500">' +
      lines
        .map(function (line, index) {
          return (
            '<tspan x="' +
            x +
            '" dy="' +
            (index === 0 ? 0 : 24) +
            '">' +
            escapeHtml(line) +
            "</tspan>"
          );
        })
        .join("") +
      "</text>"
    );
  }

  function renderRadialLabel(label, centerX, centerY, innerRadius, outerRadius, startAngle, endAngle, fontSize, maxLines, color) {
    const midAngle = (startAngle + endAngle) / 2;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const point = polarPoint(centerX, centerY, radius, midAngle);
    let rotation = midAngle + 90;
    if (midAngle > 90 || midAngle < -90) {
      rotation += 180;
    }
    const availableAngle = Math.abs(endAngle - startAngle);
    const maxChars = availableAngle > 30 ? 18 : availableAngle > 18 ? 14 : 10;
    const lines = wrapLabel(label, maxChars, maxLines);
    const startDy = -((lines.length - 1) * (fontSize + 1)) / 2;

    return (
      '<text class="organism-label" transform="translate(' +
      round(point.x) +
      " " +
      round(point.y) +
      ") rotate(" +
      round(rotation) +
      ')" text-anchor="middle" fill="' +
      color +
      '" font-size="' +
      fontSize +
      '" font-weight="500">' +
      lines
        .map(function (line, index) {
          return (
            '<tspan x="0" dy="' +
            (index === 0 ? startDy : fontSize + 1) +
            '">' +
            escapeHtml(line) +
            "</tspan>"
          );
        })
        .join("") +
      "</text>"
    );
  }

  function getOrganismSelectionMeta() {
    if (!state.selectedRef) return null;
    const model = buildOrganismModel();
    const key = state.selectedRef.kind + ":" + state.selectedRef.id;
    const entry = model.index[key];
    if (!entry) return null;
    return {
      label: entry.label,
      trail: entry.trail.join(" > ")
    };
  }

  function getOrganismTrailString(kind, id) {
    const model = buildOrganismModel();
    const entry = model.index[kind + ":" + id];
    if (!entry || !entry.trail || entry.trail.length < 2) return "";
    return entry.trail.join(" > ");
  }

  function renderRoleLatticeGraphic() {
    const policies = data.roleArchetypes;
    const roles = getAllRoleEntries();
    const selectedKey = state.selectedRef ? state.selectedRef.kind + ":" + state.selectedRef.id : "";
    const rowStart = 92;
    const rowStep = 64;
    const columns = {
      human: { x: 300, label: "Human" },
      hybrid: { x: 495, label: "Hybrid" },
      agent: { x: 635, label: "Agent" }
    };
    const groupCounts = {};
    const groupSeen = {};

    roles.forEach(function (role) {
      const roleClass = getRoleClass(role);
      const key = roleClass + ":" + role.archetypeId;
      groupCounts[key] = (groupCounts[key] || 0) + 1;
    });

    const nodes = roles
      .map(function (role) {
        const policy = getRolePolicy(role);
        const roleClass = getRoleClass(role);
        const column = columns[roleClass];
        const rowIndex = policies.findIndex(function (item) {
          return item.id === role.archetypeId;
        });
        if (!policy || !column || rowIndex < 0) return null;
        const groupKey = roleClass + ":" + role.archetypeId;
        const seen = groupSeen[groupKey] || 0;
        const count = groupCounts[groupKey] || 1;
        groupSeen[groupKey] = seen + 1;
        return {
          key: role.kind + ":" + role.id,
          kind: role.kind,
          id: role.id,
          x: column.x,
          y: rowStart + rowIndex * rowStep + (seen - (count - 1) / 2) * 30,
          label: role.name,
          roleClass: roleClass,
          policy: policy,
          tone: getArchetypeTone(policy.id)
        };
      })
      .filter(Boolean);

    const byKey = {};
    nodes.forEach(function (node) {
      byKey[node.key] = node;
    });

    const edges = [
      ["humanRole:role-intent-steward", "hybridRole:role-intelligence-flow-curator"],
      ["humanRole:role-trust-architect", "hybridRole:role-agent-conductor"],
      ["humanRole:role-learning-curator", "hybridRole:role-decision-quality-reviewer"],
      ["hybridRole:role-agent-conductor", "agentRole:agent-workflow-orchestration"],
      ["hybridRole:role-intelligence-flow-curator", "agentRole:agent-retrieval"],
      ["hybridRole:role-decision-quality-reviewer", "agentRole:agent-drift-detection"],
      ["hybridRole:role-workflow-composer", "agentRole:agent-compliance-monitor"],
      ["hybridRole:role-agent-conductor", "agentRole:agent-scenario-comparison"]
    ];

    return (
      '<svg class="lattice-svg" viewBox="0 0 720 700" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Role Lattice archetype policy map">' +
      '<defs><filter id="latticeGlow"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="rgba(0,0,0,0.32)"></feDropShadow></filter></defs>' +
      Object.keys(columns)
        .map(function (key) {
          const column = columns[key];
          return (
            '<text x="' +
            column.x +
            '" y="44" fill="#8fa7b6" text-anchor="middle" font-size="12" letter-spacing="2">' +
            escapeHtml(column.label.toUpperCase()) +
            "</text>" +
            '<line x1="' +
            column.x +
            '" y1="64" x2="' +
            column.x +
            '" y2="658" stroke="rgba(189, 208, 220, 0.13)" stroke-width="1"></line>'
          );
        })
        .join("") +
      policies
        .map(function (policy, index) {
          const y = rowStart + index * rowStep;
          const tone = getArchetypeTone(policy.id);
          return (
            '<g class="lattice-archetype-row">' +
            '<line x1="28" y1="' +
            y +
            '" x2="700" y2="' +
            y +
            '" stroke="rgba(189, 208, 220, 0.08)" stroke-width="1"></line>' +
            '<circle cx="44" cy="' +
            y +
            '" r="5" fill="' +
            tone +
            '"></circle>' +
            '<text x="58" y="' +
            (y - 4) +
            '" fill="#f3f8fb" font-size="12" font-weight="600">' +
            escapeHtml(policy.label) +
            "</text>" +
            '<text x="58" y="' +
            (y + 13) +
            '" fill="#8fa7b6" font-size="10">' +
            escapeHtml(truncate(policy.summary, 38)) +
            "</text>" +
            "</g>"
          );
        })
        .join("") +
      edges
        .map(function (edge) {
          const source = byKey[edge[0]];
          const target = byKey[edge[1]];
          if (!source || !target) return "";
          return (
            '<path d="M ' +
            source.x +
            " " +
            source.y +
            " C " +
            (source.x + target.x) / 2 +
            " " +
            source.y +
            ", " +
            (source.x + target.x) / 2 +
            " " +
            target.y +
            ", " +
            target.x +
            " " +
            target.y +
            '" fill="none" stroke="rgba(189, 208, 220, 0.26)" stroke-width="1.4"></path>'
          );
        })
        .join("") +
      nodes
        .map(function (node) {
          const isSelected = node.key === selectedKey;
          const fill = isSelected ? "rgba(232, 248, 255, 0.96)" : "rgba(8,17,22,0.96)";
          const textFill = isSelected ? "#0e2632" : "#f3f8fb";
          const subFill = isSelected ? "#315563" : "#8fa7b6";
          return (
            '<g class="lattice-node' +
            (isSelected ? " is-selected" : "") +
            '" data-select-kind="' +
            node.kind +
            '" data-select-id="' +
            node.id +
            '">' +
            '<rect x="' +
            (node.x - 72) +
            '" y="' +
            (node.y - 19) +
            '" width="144" height="38" rx="15" fill="' +
            fill +
            '" stroke="' +
            node.tone +
            '" stroke-width="' +
            (isSelected ? "2.4" : "1.4") +
            '" filter="url(#latticeGlow)"></rect>' +
            '<text x="' +
            node.x +
            '" y="' +
            (node.y - 3) +
            '" fill="' +
            textFill +
            '" text-anchor="middle" font-size="10.5" font-weight="600">' +
            escapeHtml(truncate(node.label, 18)) +
            "</text>" +
            '<text x="' +
            node.x +
            '" y="' +
            (node.y + 11) +
            '" fill="' +
            subFill +
            '" text-anchor="middle" font-size="8.5" letter-spacing="1.2">' +
            escapeHtml(node.policy.label.toUpperCase()) +
            "</text>" +
            "</g>"
          );
        })
        .join("") +
      "</svg>"
    );
  }

  function renderArchetypeCoverage() {
    return (
      '<div class="archetype-list">' +
      data.roleArchetypes
        .map(function (policy) {
          const roles = getRolesByArchetype(policy.id);
          return (
            '<div class="archetype-row">' +
            '<span class="archetype-dot" style="background:' +
            getArchetypeTone(policy.id) +
            ';"></span>' +
            "<strong>" +
            escapeHtml(policy.label) +
            "</strong>" +
            '<span class="archetype-row__meta">' +
            escapeHtml(String(roles.length) + " role" + (roles.length === 1 ? "" : "s")) +
            "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderSelectedArchetypeCard() {
    const selectedRole = getSelectedRoleEntry();
    const policy = selectedRole
      ? getRolePolicy(selectedRole)
      : getArchetypePolicy("sentinel");
    if (!policy) return "";

    return (
      '<div class="wire-card wire-card--policy">' +
      '<div class="view-card__meta">' +
      escapeHtml(selectedRole ? "Selected role policy" : "Policy spotlight") +
      "</div>" +
      "<h3>" +
      escapeHtml(policy.label + " archetype") +
      "</h3>" +
      "<p>" +
      escapeHtml(
        selectedRole
          ? selectedRole.name + " inherits this policy envelope."
          : "Select a role node to inspect its archetype envelope."
      ) +
      "</p>" +
      '<div class="stack" style="margin-top: 12px;">' +
      renderArchetypeBadge(policy) +
      renderToken(policy.defaultAutonomy) +
      renderToken("classes: " + policy.allowedClasses.join(", ")) +
      "</div>" +
      renderPolicyEnvelopeList(policy) +
      "</div>"
    );
  }

  function getMetric(name) {
    return data.fitnessMetrics.find(function (metric) {
      return metric.name === name;
    });
  }

  function isValidView(viewName) {
    return data.navigation.some(function (item) {
      return item.id === viewName;
    });
  }

  function isValidScenario(id) {
    return data.scenarios.some(function (scenario) {
      return scenario.id === id;
    });
  }

  function isValidPodId(id) {
    return data.pods.some(function (pod) {
      return pod.id === id;
    });
  }

  function isValidSelection(kind, id) {
    if (kind === "intentKernel") return id === data.intentKernel.id;
    if (kind === "valueLoop") return !!getValueLoop(id);
    if (kind === "pod") return !!getPod(id);
    if (kind === "humanRole") return !!getHumanRole(id);
    if (kind === "agentRole") return !!getAgentRole(id);
    if (kind === "hybridRole") return !!getHybridRole(id);
    if (kind === "skill") return !!getSkill(id);
    if (kind === "governancePolicy") return !!getGovernancePolicy(id);
    if (kind === "intelligenceFlow") return !!getIntelligenceFlow(id);
    if (kind === "fitnessMetric") return !!getFitnessMetric(id);
    return false;
  }

  function getActiveScenario() {
    return data.scenarios.find(function (scenario) {
      return scenario.id === state.activeScenarioId;
    });
  }

  function resolveSelectedItem() {
    if (!state.selectedRef) return null;
    const kind = state.selectedRef.kind;
    const id = state.selectedRef.id;

    if (kind === "intentKernel") {
      return Object.assign({ kind: "intentKernel" }, data.intentKernel);
    }
    if (kind === "valueLoop") {
      return Object.assign({ kind: "valueLoop" }, getValueLoop(id));
    }
    if (kind === "pod") {
      return Object.assign({ kind: "pod" }, getPod(id));
    }
    if (kind === "humanRole") {
      return Object.assign({ kind: "humanRole" }, getHumanRole(id));
    }
    if (kind === "agentRole") {
      return Object.assign({ kind: "agentRole" }, getAgentRole(id));
    }
    if (kind === "hybridRole") {
      return Object.assign({ kind: "hybridRole" }, getHybridRole(id));
    }
    if (kind === "skill") {
      return Object.assign({ kind: "skill" }, getSkill(id));
    }
    if (kind === "governancePolicy") {
      return Object.assign({ kind: "governancePolicy" }, getGovernancePolicy(id));
    }
    if (kind === "intelligenceFlow") {
      return Object.assign({ kind: "intelligenceFlow" }, getIntelligenceFlow(id));
    }
    if (kind === "fitnessMetric") {
      return Object.assign({ kind: "fitnessMetric" }, getFitnessMetric(id));
    }
    return null;
  }

  function getValueLoop(id) {
    return data.valueLoops.find(function (item) {
      return item.id === id;
    });
  }

  function getPod(id) {
    return data.pods.find(function (item) {
      return item.id === id;
    });
  }

  function getHumanRole(id) {
    return data.humanRoles.find(function (item) {
      return item.id === id;
    });
  }

  function getAgentRole(id) {
    return data.agentRoles.find(function (item) {
      return item.id === id;
    });
  }

  function getHybridRole(id) {
    return data.hybridRoles.find(function (item) {
      return item.id === id;
    });
  }

  function getSkill(id) {
    return data.skills.find(function (item) {
      return item.id === id;
    });
  }

  function getDefinitionName(kind, id) {
    if (kind === "skill") return getSkill(id).name;
    return resolveRoleName(id);
  }

  function getDefinitionTone(kind, id) {
    const role =
      kind === "humanRole"
        ? getHumanRole(id)
        : kind === "hybridRole"
          ? getHybridRole(id)
          : kind === "agentRole"
            ? getAgentRole(id)
            : null;
    const policy = getRolePolicy(role);
    if (policy) return getArchetypeTone(policy.id);
    if (kind === "humanRole") return "#7fd1ab";
    if (kind === "hybridRole") return "#d7b267";
    if (kind === "skill") return "#9cbeff";
    return "#69d7d8";
  }

  function getGovernancePolicy(id) {
    return data.governancePolicies.find(function (item) {
      return item.id === id;
    });
  }

  function getIntelligenceFlow(id) {
    return data.intelligenceFlows.find(function (item) {
      return item.id === id;
    });
  }

  function getFitnessMetric(id) {
    return data.fitnessMetrics.find(function (item) {
      return item.id === id;
    });
  }

  function getDelegationContractByAgentId(agentRoleId) {
    return data.delegationContracts.find(function (contract) {
      return contract.agentRoleId === agentRoleId;
    });
  }

  function getArchetypePolicy(id) {
    return data.roleArchetypes.find(function (item) {
      return item.id === id;
    });
  }

  function getRolePolicy(role) {
    return role && role.archetypeId ? getArchetypePolicy(role.archetypeId) : null;
  }

  function getRoleClass(role) {
    if (role.roleClass) return role.roleClass;
    if (role.kind === "humanRole") return "human";
    if (role.kind === "hybridRole") return "hybrid";
    return "agent";
  }

  function getAllRoleEntries() {
    return []
      .concat(
        data.humanRoles.map(function (role) {
          return Object.assign({ kind: "humanRole" }, role);
        })
      )
      .concat(
        data.hybridRoles.map(function (role) {
          return Object.assign({ kind: "hybridRole" }, role);
        })
      )
      .concat(
        data.agentRoles.map(function (role) {
          return Object.assign({ kind: "agentRole" }, role);
        })
      );
  }

  function getSelectedRoleEntry() {
    if (!state.selectedRef) return null;
    if (state.selectedRef.kind === "humanRole") {
      return Object.assign({ kind: "humanRole" }, getHumanRole(state.selectedRef.id));
    }
    if (state.selectedRef.kind === "hybridRole") {
      return Object.assign({ kind: "hybridRole" }, getHybridRole(state.selectedRef.id));
    }
    if (state.selectedRef.kind === "agentRole") {
      return Object.assign({ kind: "agentRole" }, getAgentRole(state.selectedRef.id));
    }
    return null;
  }

  function getRolesByArchetype(archetypeId) {
    return getAllRoleEntries().filter(function (role) {
      return role.archetypeId === archetypeId;
    });
  }

  function getArchetypeTone(archetypeId) {
    const tones = {
      executor: "#d7b267",
      orchestrator: "#69d7d8",
      verifier: "#7fd1ab",
      sentinel: "#ff9566",
      gatekeeper: "#f2cf72",
      curator: "#9cbeff",
      auditor: "#caa7ff",
      mediator: "#f3a6a6",
      synthesizer: "#97a8ff"
    };
    return tones[archetypeId] || "#bdd0dc";
  }

  function resolveRoleNames(ids) {
    return ids.map(function (id) {
      return resolveRoleName(id);
    });
  }

  function resolveRoleName(id) {
    return (
      (getHumanRole(id) || getAgentRole(id) || getHybridRole(id) || { name: id }).name
    );
  }

  function renderRoleNames(ids) {
    return resolveRoleNames(ids).join(", ");
  }

  function renderLegendChip(label, color) {
    return (
      '<span class="legend-chip"><span class="legend-chip__swatch" style="background:' +
      color +
      ';"></span>' +
      escapeHtml(label) +
      "</span>"
    );
  }

  function renderToken(label) {
    return '<span class="token">' + escapeHtml(label) + "</span>";
  }

  function renderArchetypeBadge(policy) {
    if (!policy) return '<span class="archetype-badge">Unassigned</span>';
    return (
      '<span class="archetype-badge" style="--archetype-tone:' +
      escapeAttribute(getArchetypeTone(policy.id)) +
      ';">' +
      escapeHtml(policy.label) +
      "</span>"
    );
  }

  function renderPolicyEnvelopeCard(policy, role) {
    return renderInspectorCard(
      "Archetype Policy",
      '<div class="stack">' +
        renderArchetypeBadge(policy) +
        renderToken("default: " + policy.defaultAutonomy) +
        renderToken("classes: " + policy.allowedClasses.join(", ")) +
        (role && role.agentClass ? renderToken("agent: " + role.agentClass) : "") +
        "</div>" +
        '<p style="margin-top: 12px;">' +
        escapeHtml(policy.coreGuardrail) +
        "</p>" +
        (role && role.archetypeRationale
          ? renderDisclosure(
              "Role fit",
              "<p>" + escapeHtml(role.archetypeRationale) + "</p>"
            )
          : "") +
        renderDisclosure("Policy envelope", renderPolicyEnvelopeList(policy))
    );
  }

  function renderPolicyEnvelopeList(policy) {
    return (
      '<div class="policy-envelope">' +
      renderCompactPolicyList("Authority", policy.authorityScopes) +
      renderCompactPolicyList("Evidence", policy.evidenceBoundary) +
      renderCompactPolicyList("Escalation", policy.escalationTriggers) +
      renderCompactPolicyList("Failure modes", policy.failureModes) +
      "</div>"
    );
  }

  function renderCompactPolicyList(title, values) {
    return (
      '<section class="policy-list"><div class="inspector-label">' +
      escapeHtml(title) +
      "</div><ul>" +
      values.map(renderListItem).join("") +
      "</ul></section>"
    );
  }

  function renderScoreChip(label, value, tone) {
    return (
      '<span class="score-chip score-chip--' +
      escapeAttribute(tone || "accent") +
      '"><span>' +
      escapeHtml(label) +
      "</span><strong>" +
      escapeHtml(String(value)) +
      "</strong></span>"
    );
  }

  function renderFieldBlock(title, copy) {
    return (
      '<section class="field-block"><div class="view-card__meta">' +
      escapeHtml(title) +
      "</div><h3>" +
      escapeHtml(title) +
      "</h3><p>" +
      escapeHtml(copy) +
      "</p></section>"
    );
  }

  function renderMetricBox(label, value) {
    return (
      '<div class="inspector-metric"><div class="inspector-label">' +
      escapeHtml(label) +
      "</div><strong>" +
      escapeHtml(value) +
      "</strong></div>"
    );
  }

  function renderInspectorSection(title, bodyHtml) {
    return (
      '<section class="inspector-section"><div class="inspector-label">' +
      escapeHtml(title) +
      "</div>" +
      bodyHtml +
      "</section>"
    );
  }

  function renderOptionalSection(title, text) {
    if (!text) return "";
    return renderInspectorSection(title, "<p>" + escapeHtml(text) + "</p>");
  }

  function renderOptionalListSection(title, items) {
    if (!items || !items.length) return "";
    return renderInspectorSection(
      title,
      "<ul>" +
        items
          .map(function (item) {
            return renderListItem(item);
          })
          .join("") +
        "</ul>"
    );
  }

  function renderInspectorCard(title, bodyHtml) {
    return (
      '<section class="inspector-card"><h4>' +
      escapeHtml(title) +
      "</h4>" +
      bodyHtml +
      "</section>"
    );
  }

  function renderDisclosure(title, bodyHtml) {
    return (
      '<details class="inspector-disclosure"><summary>' +
      escapeHtml(title) +
      "</summary><div class=\"inspector-disclosure__body\">" +
      bodyHtml +
      "</div></details>"
    );
  }

  function renderOptionalMetrics(items) {
    if (!items || !items.length) return "";
    return renderInspectorCard(
      "Signals",
      '<div class="stack">' +
        items
          .slice(0, 4)
          .map(function (item) {
            return renderToken(item);
          })
          .join("") +
        "</div>"
    );
  }

  function renderListItem(text) {
    return "<li>" + escapeHtml(text) + "</li>";
  }

  function renderTextareaField(label, value) {
    return (
      '<div class="modal-field"><label>' +
      escapeHtml(label) +
      '</label><textarea>' +
      escapeHtml(value) +
      "</textarea></div>"
    );
  }

  function renderSelectField(label, name, options) {
    return (
      '<div class="modal-field"><label>' +
      escapeHtml(label) +
      '</label><select name="' +
      escapeAttribute(name) +
      '">' +
      options
        .map(function (option) {
          return '<option value="' + escapeAttribute(option) + '">' + escapeHtml(option) + "</option>";
        })
        .join("") +
      "</select></div>"
    );
  }

  function sectorPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
    const outerStart = polarPoint(centerX, centerY, outerRadius, startAngle);
    const outerEnd = polarPoint(centerX, centerY, outerRadius, endAngle);
    const innerEnd = polarPoint(centerX, centerY, innerRadius, endAngle);
    const innerStart = polarPoint(centerX, centerY, innerRadius, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return (
      "M " +
      round(outerStart.x) +
      " " +
      round(outerStart.y) +
      " A " +
      outerRadius +
      " " +
      outerRadius +
      " 0 " +
      largeArc +
      " 1 " +
      round(outerEnd.x) +
      " " +
      round(outerEnd.y) +
      " L " +
      round(innerEnd.x) +
      " " +
      round(innerEnd.y) +
      " A " +
      innerRadius +
      " " +
      innerRadius +
      " 0 " +
      largeArc +
      " 0 " +
      round(innerStart.x) +
      " " +
      round(innerStart.y) +
      " Z"
    );
  }

  function wrapLabel(label, maxChars, maxLines) {
    const words = String(label).split(/\s+/);
    const lines = [];
    let current = "";

    words.forEach(function (word) {
      const candidate = current ? current + " " + word : word;
      if (candidate.length <= maxChars) {
        current = candidate;
        return;
      }
      if (current) lines.push(current);
      current = word;
    });

    if (current) lines.push(current);

    if (lines.length > maxLines) {
      const trimmed = lines.slice(0, maxLines);
      const last = trimmed[maxLines - 1];
      trimmed[maxLines - 1] = truncate(last, Math.max(maxChars - 1, 8));
      return trimmed;
    }

    return lines;
  }

  function orbitCircle(cx, cy, radius, strokeWidth) {
    return (
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      radius +
      '" fill="none" stroke="rgba(189,208,220,0.24)" stroke-width="' +
      strokeWidth +
      '" stroke-dasharray="3 9"></circle>'
    );
  }

  function ringLabel(x, y, label) {
    return (
      '<text x="' +
      x +
      '" y="' +
      y +
      '" fill="#7f95a4" text-anchor="middle" font-size="12" letter-spacing="4">' +
      escapeHtml(label.toUpperCase()) +
      "</text>"
    );
  }

  function renderFlowPath(path, stroke, label, labelX, labelY) {
    return (
      '<path d="' +
      path +
      '" fill="none" stroke="' +
      stroke +
      '" stroke-width="3.2" stroke-linecap="round" opacity="0.78"></path>' +
      '<text x="' +
      labelX +
      '" y="' +
      labelY +
      '" fill="#dcebf0" font-size="11" letter-spacing="1.2">' +
      escapeHtml(label) +
      "</text>"
    );
  }

  function linePath(a, b) {
    return (
      "M " +
      round(a.x) +
      " " +
      round(a.y) +
      " C " +
      round((a.x + b.x) / 2) +
      " " +
      round(a.y) +
      ", " +
      round((a.x + b.x) / 2) +
      " " +
      round(b.y) +
      ", " +
      round(b.x) +
      " " +
      round(b.y)
    );
  }

  function podMeta(pod) {
    return (
      "Fit " +
      pod.fitnessScore +
      "  Safety " +
      pod.delegationSafety
    );
  }

  function orbitLabel(kind) {
    if (kind === "humanRole") return "Human role";
    if (kind === "hybridRole") return "Hybrid role";
    if (kind === "agentRole") return "Agent role";
    if (kind === "governancePolicy") return "Policy";
    if (kind === "fitnessMetric") return "Metric";
    return "";
  }

  function buildOuterArc(list, kind, startAngle, endAngle, radius, tone, positions, centerX, centerY) {
    if (!list.length) return;
    const range = endAngle - startAngle;
    list.forEach(function (item, index) {
      const angle =
        list.length === 1
          ? startAngle + range / 2
          : startAngle + (range / (list.length - 1)) * index;
      const point = polarPoint(centerX, centerY, radius, angle);
      positions[kind + ":" + item.id] = {
        x: point.x,
        y: point.y,
        radius: kind === "governancePolicy" ? 13 : kind === "fitnessMetric" ? 14 : 15,
        tone: tone,
        label: item.name,
        item: { kind: kind, id: item.id }
      };
    });
  }

  function groupBy(items, key) {
    return items.reduce(function (acc, item) {
      const value = item[key];
      if (!acc[value]) acc[value] = [];
      acc[value].push(item);
      return acc;
    }, {});
  }

  function angleFromCenter(cx, cy, x, y) {
    return Math.atan2(y - cy, x - cx) * (180 / Math.PI);
  }

  function polarPoint(cx, cy, radius, angleDegrees) {
    const angle = (angleDegrees * Math.PI) / 180;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  }

  function diamondPath(x, y, radius) {
    return (
      "M " +
      round(x) +
      " " +
      round(y - radius) +
      " L " +
      round(x + radius) +
      " " +
      round(y) +
      " L " +
      round(x) +
      " " +
      round(y + radius) +
      " L " +
      round(x - radius) +
      " " +
      round(y) +
      " Z"
    );
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function truncate(text, max) {
    return text.length <= max ? text : text.slice(0, max - 1) + "...";
  }

  function findRoleKindById(id) {
    if (getHumanRole(id)) return "humanRole";
    if (getHybridRole(id)) return "hybridRole";
    return "agentRole";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
