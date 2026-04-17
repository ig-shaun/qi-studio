# IXO Studio

Intent compiler and governance simulator for AI-native organizations.

Treats intent as source code: a prompt is parsed into an Intent Kernel, then compiled through value loops, PODs, roles, agent delegation contracts, and governance checkpoints into a runnable target-state design visualized on the Living Constellation canvas.

Design-time only in v1 — Studio compiles and simulates, it does not execute agents or mutate external systems.

## Monorepo layout

- `packages/core` — graph schemas, store, compiler pipeline, copilot service, fitness engine
- `apps/studio` — Next.js 15 app: Intent Canvas, Living Constellation, Inspector, Fitness panel

## Getting started

```bash
pnpm install
pnpm dev
```

## v1 scope

Vertical slice through all seven stages (Intent Kernel, Value Loops, PODs, Roles, Agents, Governance, Fitness), Living Constellation canvas only. Greenfield future-back orientation. See the plan file for details.
