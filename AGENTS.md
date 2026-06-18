# Delta Site Agent Guide

This file is the source of truth for coding agents working inside
`/Users/egeng/delta-site`.

## Repository Purpose

`delta-site` is the Next.js and Electron desktop surface for Delta. It owns:

- the marketing/auth pages under `src/app`
- the `/os` Delta OS Console
- the browser-only OS Console speech preview
- the Electron desktop shell and service manager in `desktop/`
- site tests, lint, production build, and desktop smoke checks

It does not own Behavioral OS backend behavior, Supabase persistence behavior,
mobile runtime behavior, live mic capture, backend local TTS, desktop
notification delivery, database schema, or migrations.

## Codex-First Workflow

Use Codex as the default implementation agent. Claude Code and Cursor may be
used as optional readers or editors, but they are not required and their local
settings are not policy. When instructions conflict, this file wins for
`delta-site`.

Expected workflow:

1. Inspect relevant files before proposing or editing.
2. Keep the phase scope narrow.
3. Make explicit file edits only.
4. Run the verification commands required for the touched area.
5. Commit only after checks pass and only with explicit file lists.
6. Report files changed, checks run, safety boundaries, commit hash, and final
   repo status.

## Safe Commands

Common site verification:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

Desktop shell verification:

```bash
npm run desktop:check
npm run desktop:smoke
npm run desktop:smoke:services
```

Agent advisory checks:

```bash
npm run agent:preflight
npm run agent:safety-scan
npm run agent:verify -- --docs-only
npm run agent:verify -- --site
npm run agent:verify -- --desktop
```

`agent:verify` prints recommended commands by default. Add `--run` only when
you are ready to execute the selected fixed command set.

Local development:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
npm run desktop:dev
```

Starting the backend is allowed only when a phase explicitly needs a read-only
local API for `/os` or Electron smoke validation:

```bash
cd /Users/egeng/delta-backend
set -a; source .env; set +a
.venv/bin/python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

## Forbidden Actions Without Explicit Approval

Do not:

- mutate Supabase or run database writes
- run migrations or change schema
- enable live mic or browser mic
- run backend local TTS
- run desktop notifications
- add memory writes
- add wake word or always-on/background listening
- change backend behavior
- touch `delta-mobile`
- change auth, billing, privacy, terms, cookies, deployment, or legal behavior
- expose arbitrary shell execution from Electron
- weaken Electron security settings
- commit `.env`, `.next`, `node_modules`, screenshots, generated caches, or local
  artifacts

Side-effect flags and commands such as `--confirm-side-effects`,
`ENABLE_LOCAL_TTS=true`, `ENABLE_DESKTOP_NOTIFICATIONS=true`, and live microphone
commands require explicit phase approval.

## File Ownership Boundaries

Normal site work:

- `src/components/*`
- `src/lib/*`
- `src/app/(marketing)/os/*`
- component tests beside touched components
- `README.md` and docs under `docs/`

High-risk site files requiring explicit scope:

- `src/context/AuthContext.tsx`
- `src/app/(marketing)/privacy/page.tsx`
- `src/app/(marketing)/terms/page.tsx`
- `src/app/(marketing)/cookies/page.tsx`
- `supabase/migrations/*`
- `desktop/main.cjs`
- `desktop/preload.cjs`
- `desktop/fallback.html`

Sibling repos:

- `/Users/egeng/delta-backend` is read-only context unless explicitly included.
- `/Users/egeng/delta-mobile` is read-only context unless explicitly included.

## Verification Expectations

Use `docs/AGENT_VERIFICATION_MATRIX.md` to choose checks.

Minimum expectations:

- docs-only: `npm run agent:verify -- --docs-only`
- site component change: `npm run agent:verify -- --site`
- `/os` or Electron change: `npm run agent:verify -- --desktop`
- auth/legal/schema changes: stop unless explicitly approved

`agent:safety-scan` is advisory, not a replacement for review. It separates
source/config risks from lower-severity documentation mentions so agents can
focus on executable changes first.

## Electron Safety Rules

Keep:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- runtime permission requests denied
- allowlisted IPC only
- `child_process.spawn` with fixed service definitions only
- `shell: false` for service launch

Do not add `exec`, arbitrary command strings, filesystem browsing, broad
environment exposure, microphone permissions, notification permissions, or
backend TTS permissions.

## OS Console Safety Posture

`/os` is a read-only cockpit. It may ask the backend read-only conversation API
questions and display readiness/state. It must not:

- write memory
- mutate Supabase
- start live mic capture
- auto-speak
- call backend local TTS
- send desktop notifications
- imply wake word or always-on mode exists

Browser speech synthesis is user-triggered only and is separate from backend
local TTS.

## Commit And Handoff Rules

- Do not use `git add .`.
- Stage explicit files only.
- Do not commit unrelated dirty files.
- Do not revert user changes unless explicitly requested.
- Final reports must include checks run, results, safety confirmations, commit
  hash, and final status for `delta-site`.
- If context must be handed off, use `docs/AGENT_HANDOFF_TEMPLATE.md`.
