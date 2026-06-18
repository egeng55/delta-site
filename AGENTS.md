# Delta Site Agent Guide

This file is the source of truth for coding agents working inside
the `delta-site` checkout.

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
npm run agent:status
npm run agent:safety-scan
npm run agent:eval
npm run agent:verify -- --docs-only
npm run agent:verify -- --site
npm run agent:verify -- --desktop
npm run agent:routine -- --list
npm run agent:routine -- --routine desktop
npm run agent:phase:start -- --phase <number> --name <slug> --print
npm run agent:phase:handoff -- --phase <number>
```

`agent:verify` prints recommended commands by default. Add `--run` only when
you are ready to execute the selected fixed command set.

`agent:eval` validates local eval fixture JSON only. It does not call the
backend, browser, external LLM APIs, Supabase, TTS, notifications, or mic paths.

`agent:routine` prints recommended command sequences for common phase types. It
does not execute commands, create worktrees, commit, or modify files.

`agent:context` prints a read-only repo context bundle in Markdown by default,
or JSON with `-- --json`. It is the script-first repo map for Codex phases and
does not write bundle files, scan generated directories, call services, run
tests, or start servers. For parser-clean JSON, use
`npm --silent run agent:context -- --json` or
`node scripts/agent-context.mjs --json`.

Future MCP and parallel-agent planning lives in
`docs/AGENT_MCP_STRATEGY.md` and `docs/AGENT_PARALLEL_WORKFLOWS.md`. These are
strategy documents only; they do not authorize MCP servers, background agents,
CI/CD automation, or autonomous writes.

Workspace layout guidance lives in `docs/AGENT_WORKSPACE_LAYOUT.md`. Delta
product context includes only `delta-site`, `delta-backend`, and
`delta-mobile`; unrelated projects such as `morning-standup` must not be
included in context bundles, MCP repo maps, or multi-repo orchestration.
`morning-standup` now lives separately at `/Users/egeng/morning-standup` and
remains excluded from Delta context.

`agent:phase:start` prints worktree creation commands by default. It may create
a worktree only with `--run`, a clean current repo, a valid phase/name, and a
nonexistent target path. It must never delete worktrees, clean files, commit, or
touch sibling repos.
The canonical worktree root is `/Users/egeng/delta-worktrees` for both flat and
grouped local layouts.

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

That command reflects the current flat layout. If the repos are manually moved
under `/Users/egeng/delta`, use `/Users/egeng/delta/delta-backend` instead.

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

- `delta-backend` is read-only context unless explicitly included.
- `delta-mobile` is read-only context unless explicitly included.

Supported local layouts are documented in `docs/AGENT_WORKSPACE_LAYOUT.md`.
Scripts should detect both the current flat layout under `/Users/egeng` and the
preferred grouped layout under `/Users/egeng/delta`.

## Verification Expectations

Use `docs/AGENT_VERIFICATION_MATRIX.md` to choose checks.

Minimum expectations:

- docs-only: `npm run agent:verify -- --docs-only`
- site component change: `npm run agent:verify -- --site`
- `/os` or Electron change: `npm run agent:verify -- --desktop`
- phase/worktree planning: `npm run agent:status`,
  `npm run agent:routine -- --routine phase-start --phase <number> --name <slug>`,
  `npm run agent:phase:start -- --phase <number> --name <slug> --print`
- auth/legal/schema changes: stop unless explicitly approved

`agent:safety-scan` is advisory, not a replacement for review. It separates
source/config risks from lower-severity documentation mentions so agents can
focus on executable changes first.

`agent:eval` is also advisory. It checks that eval fixtures are structurally
valid; it does not prove live `/os` behavior.

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
- Do not delete worktrees or branches unless explicitly requested after
  reporting exact paths and branch names.
- Final reports must include checks run, results, safety confirmations, commit
  hash, and final status for `delta-site`.
- If context must be handed off, use `docs/AGENT_HANDOFF_TEMPLATE.md`.
