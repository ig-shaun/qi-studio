# Qi Studio Implementation Progress

## Current direction

The repository currently contains a monorepo proof of concept built around a Next.js app and a compiler-oriented core package. The target deliverable is different: a polished, dependency-free, static prototype that can be opened directly in a browser and understood immediately in a demo or investor context.

Implementation will therefore proceed by creating a new root-level static prototype and treating the existing monorepo code as reference material, not as the primary runtime.

## Progress log

### Completed

- Evaluated the existing repository structure and identified the main gaps against the prototype spec.
- Added the required `AGENTS.md` at the repository root.
- Established the implementation approach: root static prototype using `index.html`, `styles.css`, `data.js`, and `app.js`.
- Created the root static prototype shell in `index.html`.
- Added a token-based premium visual system in `styles.css`.
- Added structured sample demo data in `data.js`.
- Implemented deterministic rendering and interaction logic in `app.js`.
- Implemented the Organism radial SVG with clickable nodes, inspector updates, scenario switching, mocked AI generation, mocked stress testing, and export toast feedback.
- Implemented high-fidelity wireframe views for Intent, Value Loops, POD Protocols, Role Lattice, Agent Delegation, Qi Flow, Governance, Fitness Lab, and Plan.

### In progress

- Polishing hierarchy, spacing, copy, and documentation around the new static prototype.

### Not started

- Documentation refresh

## Execution plan

### Phase 1: Static scaffold

Goal: create the dependency-free app entrypoint and visual shell.

- Add `index.html` with the full five-part layout:
  - top command bar
  - left navigation rail
  - central canvas
  - right inspector
  - bottom scenario timeline
- Add `styles.css` with design tokens, layout primitives, panels, buttons, cards, and modal/toast styles.
- Add `data.js` with all required structured sample data.
- Add `app.js` with deterministic app state, rendering entrypoint, and event wiring.

### Phase 2: Primary experience

Goal: make the default view convincing and clickable.

- Implement `initApp()`.
- Implement `renderView(viewName)`.
- Implement `renderLivingConstellation()`.
- Implement `renderInspector(item)`.
- Make the Organism view the default selected view.
- Ensure radial nodes can be selected and reflected in the inspector.
- Add flow lines for intelligence, authority, service, and learning.
- Add scenario summary updates driven by the bottom timeline.

### Phase 3: Secondary views

Goal: make the product concept legible across all design layers.

- Implement `renderIntentView()`.
- Implement `renderValueLoopsView()`.
- Implement `renderPodProtocolsView()`.
- Implement `renderRoleLatticeView()`.
- Implement `renderAgentDelegationView()`.
- Implement `renderQiFlowView()`.
- Implement `renderGovernanceView()`.
- Implement `renderFitnessLabView()`.
- Implement `renderPlanView()`.

These views can be high-fidelity wireframes rather than full deep interactions, but they need to feel coherent with the main experience.

### Phase 4: Mocked product actions

Goal: satisfy the demo interaction model without network calls.

- Implement `openAIModal()`.
- Implement `openStressTestModal()`.
- Implement `closeModal()`.
- Implement `showToast(message)`.
- Add mocked AI generation result state.
- Add mocked stress test result state.
- Highlight impacted PODs after stress test submission.

### Phase 5: Final polish

Goal: make the prototype demo-ready.

- Refine hierarchy, spacing, typography, and empty states.
- Improve mobile and narrow-width behavior enough for reliable presentation.
- Ensure the inspector content matches the product language in `AGENTS.md`.
- Rewrite `README.md` for the static prototype.

## Design principles to preserve during implementation

- The product is not an org chart or dashboard.
- Intent must read as the origin of structure.
- PODs must read as programmable cooperation units.
- Governance and delegation must be explicit, not implied.
- Visual tone should be calm, serious, and high-trust.
- The app should feel like an organisational design environment, not an analytics console.

## Known mismatches in the current codebase

- Current product naming and copy still use `IXO Studio`.
- Current UI depends on React and Next.js.
- Current flow starts with compiling a prompt instead of exploring a structured design artifact.
- The current inspector is schema-oriented and not yet product-oriented.
- The current radial view stops at intent, value loops, and PODs.
- Qi Flow, Fitness, and Plan are stubbed or absent as user-facing experiences.

## Notes for future production phases

The static prototype is the right next step for product communication. It is not sufficient as a production foundation. Future phases should address the following:

### Production phase A: Domain model hardening

- Formalize a stable domain schema shared by authoring, simulation, and export layers.
- Introduce versioned migrations for saved organisational designs.
- Separate display-oriented sample content from canonical domain entities.

### Production phase B: Application architecture

- Choose a production frontend stack and component system intentionally rather than inheriting the current proof-of-concept shape.
- Introduce explicit state management for selection, scenarios, simulation, and persisted drafts.
- Define module boundaries between rendering, interaction logic, simulation logic, and persistence.

### Production phase C: Persistence and collaboration

- Add draft saving, workspace management, and scenario version history.
- Support collaborative editing and review workflows.
- Preserve auditability for design changes to roles, delegation, and governance policies.

### Production phase D: Real simulation and generation

- Replace mocked AI generation with a structured generation pipeline.
- Replace mocked stress tests with deterministic scenario simulation and scoring.
- Make outputs inspectable so users can see why a recommendation or score changed.

### Production phase E: Governance and safety

- Add permissioning by user role.
- Add policy validation and governance rule authoring.
- Add traceability for agent mandates, autonomy levels, budgets, and checkpoint rules.

### Production phase F: Design system and accessibility

- Build a reusable design system with tokens, components, and documentation.
- Improve keyboard interaction, focus states, contrast, and semantic labeling.
- Add responsive behavior beyond demo-level layout adaptation.

### Production phase G: Quality and delivery

- Add automated tests for rendering logic, data transforms, and interaction flows.
- Add visual regression checks for the constellation and inspector views.
- Add CI, release packaging, and environment-specific build workflows.

## Immediate next build step

Create the root static scaffold:

1. `index.html`
2. `styles.css`
3. `data.js`
4. `app.js`

That should become the primary demo entrypoint while the existing monorepo remains available as reference code.
