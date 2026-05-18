# AGENTS.md

## Project

This repository contains a lightweight prototype for Qi Studio.

Qi Studio is an intent-first organisational design environment for creating AI-native operating models. It helps users design organisations around Intent, value loops, programmable PODs, fluid human/agent roles, intelligence flow, governance, and transition paths.

This is a demo prototype, not a production application.

## Primary objective

Build a polished, clickable, static prototype that communicates the product vision clearly.

The prototype should help a viewer understand:

1. The organisation starts from Intent, not departments.
2. Value loops generate PODs.
3. PODs are programmable human-agent cooperation units.
4. Roles are capability/accountability bundles, not fixed job titles.
5. Agents have explicit mandates, budgets, checkpoints, and supervising humans.
6. Qi represents intelligence flow across the organisation.
7. Governance and fitness are visible design layers.
8. Plan turns the target design into a migration path.

## Tech constraints

Keep the code simple, readable, and well-structured.

## UX principles

The interface should feel:

- Strategic
- Calm
- High-trust
- Futuristic without being gimmicky
- Suitable for executive, operating-model, transformation, and AI-governance conversations

Avoid:

- Cartoonish AI visuals
- Generic SaaS dashboards
- Cluttered charts
- Departmental org-chart metaphors
- Overuse of gradients or animation

Use the metaphor of a living constellation or organisational organism.

## Product language

Use these product concepts consistently:

- Intent Kernel
- Value Loop
- POD Protocol
- Role Lattice
- Agent Delegation Contract
- Qi Flow
- Governance Control Plane
- Fitness Lab
- Plan
- Human Judgment Sovereignty Zone
- Delegation Safety
- Intelligence Flow Index
- Role Liquidity
- Learning Closure

## Architecture guidance

Use `data.js` for all sample data.

Use `app.js` for rendering and interactions.

Recommended functions:

- `initApp()`
- `renderView(viewName)`
- `renderLivingConstellation()`
- `renderInspector(item)`
- `renderIntentView()`
- `renderValueLoopsView()`
- `renderPodProtocolsView()`
- `renderRoleLatticeView()`
- `renderAgentDelegationView()`
- `renderQiFlowView()`
- `renderGovernanceView()`
- `renderFitnessLabView()`
- `renderPlanView()`
- `openAIModal()`
- `openStressTestModal()`
- `closeModal()`
- `showToast(message)`

Keep rendering deterministic and data-driven.

## Interaction requirements

Implement these interactions:

- Left navigation switches views.
- Radial constellation nodes are clickable.
- Clicking a node updates the right inspector.
- Timeline stages are clickable.
- "Generate with AI" opens a modal.
- "Stress test" opens a modal.
- "Export" shows a toast.
- AI modal submission shows a generated result.
- Stress test modal submission shows a mocked risk result and highlights affected PODs.

## Visual requirements

The central Living Constellation should include:

- Center node for Intent Kernel.
- Inner orbit for value loops.
- Middle orbit for PODs.
- Outer orbit for roles, agents, policies, and metrics.
- Curved or straight flow lines.
- Small badges for scores, risks, or agent density.
- Hover and selected states.

The map must be visually convincing and conceptually clear.

## Sample content

Use this Intent Kernel:

"Increase trusted customer value through adaptive human-agent cooperation."

Use these value loops:

- Sense Customer Needs
- Build Trust
- Deliver Service
- Govern Risk
- Learn from Outcomes
- Grow Ecosystem

Use these PODs:

- Customer Signal POD
- Trust & Boundary POD
- Workflow Orchestration POD
- Platform & Knowledge POD
- Learning Loop POD
- Intent Stewardship POD
- Ecosystem Growth POD

Use these human roles:

- Intent Steward
- Trust Architect
- Human Judgment Reviewer
- Relationship Designer
- Learning Curator
- System Boundary Custodian

Use these agent roles:

- Signal Sensing Agent
- Workflow Orchestration Agent
- Compliance Monitor Agent
- Retrieval Agent
- Drift Detection Agent
- Scenario Comparison Agent

Use these hybrid roles:

- Agent Conductor
- Workflow Composer
- Decision Quality Reviewer
- Intelligence Flow Curator

## Fitness metrics

Include these metrics in the UI:

- Intent coherence
- Value-loop coverage
- POD autonomy
- Cognitive load
- Delegation safety
- Human judgment clarity
- Intelligence Flow Index
- Governance debt
- Learning closure
- Role liquidity
- Agent leverage
- Adaptability index

## Writing style

Use precise product language.

Avoid hype.

Make labels short and meaningful.

Use realistic demo copy.

## Completion criteria

The scaffold is complete when:

1. Opening `index.html` shows the full app shell.
2. The Living Constellation radial SVG is visible by default.
3. Left navigation switches all major views.
4. Clicking nodes updates the inspector.
5. AI and Stress Test modals work with mocked responses.
6. Timeline stages update scenario state.
7. The visual design feels coherent and polished.
8. README.md explains the demo.
9. AGENTS.md exists at the repository root.
10. No external dependencies are required.
