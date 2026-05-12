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

## IXO Portal iframe embedding

Qi Studio exposes a Portal app manifest at `/ixo-portal/manifest.json`.

Configure deployment origins with:

```bash
QI_STUDIO_PUBLIC_ORIGIN=https://studio.example
NEXT_PUBLIC_IXO_PORTAL_ALLOWED_ORIGINS=https://portal.example
```

Register the app on an IXO domain with a linked resource like:

```json
{
  "id": "did:ixo:entity:<id>#app-01",
  "type": "App",
  "mediaType": "application/json",
  "serviceEndpoint": "https://studio.example/ixo-portal/manifest.json"
}
```

The Portal route is `/domain/[entityDid]/app/app-01`.

## Cloudflare deployment

Qi Studio deploys to Cloudflare Workers through OpenNext.

```bash
pnpm --filter @ixo-studio/studio deploy
```

The current Worker is `qi-studio` at `https://qi-studio.ixo-api.workers.dev`.
Set `ANTHROPIC_API_KEY` as a Cloudflare Worker secret before using compiler routes in production.

## v1 scope

Vertical slice through all seven stages (Intent Kernel, Value Loops, PODs, Roles, Agents, Governance, Fitness), Living Constellation canvas only. Greenfield future-back orientation. See the plan file for details.
