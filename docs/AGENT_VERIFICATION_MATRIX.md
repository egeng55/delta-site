# Agent Verification Matrix

Choose verification based on touched files.

## Docs And Agent Tooling Only

Examples:

```text
AGENTS.md
docs/AGENT_*.md
scripts/agent-preflight.mjs
scripts/agent-safety-scan.mjs
```

Run:

```bash
npm run agent:preflight
npm run agent:safety-scan
npm test -- --runInBand
npm run lint
npm run build
```

## OS Console

Examples:

```text
src/components/OSConsole.tsx
src/components/OSConsole.test.tsx
src/lib/osConsoleFixtures.ts
src/lib/conversationApi.ts
src/lib/systemReadinessApi.ts
```

Run:

```bash
npm test -- --runInBand src/components/OSConsole.test.tsx
npm test -- --runInBand
npm run lint
npm run build
npm run desktop:check
npm run desktop:smoke
npm run desktop:smoke:services
```

## Electron Desktop Shell

Examples:

```text
desktop/main.cjs
desktop/preload.cjs
desktop/fallback.html
desktop/smoke-check.cjs
docs/DESKTOP_APP.md
```

Run:

```bash
npm run desktop:check
npm run desktop:smoke
npm run desktop:smoke:services
npm test -- --runInBand
npm run lint
npm run build
```

## Marketing Or Static Site UI

Run:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

## Auth, Legal, Billing, Or Schema

Stop unless the phase explicitly includes these files. If approved, define a
custom verification plan in the phase brief.

High-risk examples:

```text
src/context/AuthContext.tsx
src/app/(marketing)/privacy/page.tsx
src/app/(marketing)/terms/page.tsx
src/app/(marketing)/cookies/page.tsx
supabase/migrations/*
```

## Sibling Repos

Do not run backend or mobile write-producing commands unless those repos are in
scope. If included, use their own repo-specific verification.
