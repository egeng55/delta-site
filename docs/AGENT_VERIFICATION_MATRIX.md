# Agent Verification Matrix

Choose verification based on touched files.

## Verification Wrapper

Use the wrapper to print the recommended commands for a scope:

```bash
npm run agent:verify -- --docs-only
npm run agent:verify -- --site
npm run agent:verify -- --desktop
npm run agent:verify -- --all
```

The wrapper prints commands by default. Add `--run` only when you want it to
execute the selected fixed command set:

```bash
npm run agent:verify -- --desktop --run
```

Scopes:

- `--docs-only`: agent preflight and safety scan
- `--site`: preflight, safety scan, tests, lint, and build
- `--desktop`: site scope plus desktop checks and smoke checks
- `--all`: same as desktop for now because `/os` and Electron are this repo's
  highest-risk surfaces

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
npm run agent:verify -- --docs-only
```

If agent scripts or `package.json` changed, use the site or desktop scope
instead of docs-only:

```bash
npm run agent:verify -- --site
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
npm run agent:verify -- --desktop
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
npm run agent:verify -- --desktop
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
npm run agent:verify -- --site
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

## Safety Scan Notes

`npm run agent:safety-scan` is advisory. It does not replace human review, and
it exits successfully unless the script itself crashes. Findings are grouped as:

- source/config risks: review first because they can affect executable behavior
- documentation mentions: lower severity, often intentional policy examples
- generated/build artifacts ignored: skipped dependency, cache, and build paths
