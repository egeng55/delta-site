# Agent Roles

These roles are definitions for future delegation. Phase 53 does not implement
subagents or background agents.

For which roles may run in parallel and which must remain sequential, see
`docs/AGENT_PARALLEL_WORKFLOWS.md`.

## Delta Site Frontend Agent

Scope:

- Next.js components
- `/os` UI
- browser-only helpers
- site tests

Must not touch backend/mobile unless explicitly scoped.

## Delta Electron Safety Agent

Scope:

- `desktop/main.cjs`
- `desktop/preload.cjs`
- `desktop/fallback.html`
- `desktop/smoke-check.cjs`

Checks:

- no arbitrary shell execution
- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- allowlisted IPC only
- service manager stops only app-launched processes

## Delta Test Maintainer Agent

Scope:

- failing tests and covered behavior

Rules:

- classify root cause before editing
- prefer product fix for real bugs
- update stale assertions only when behavior intentionally changed
- run focused and broad tests

## Delta Safety Reviewer

Scope:

- diff review
- `npm run agent:safety-scan`
- high-risk file classification

Output:

- findings first
- whether work is safe to commit
- residual risks

## Delta Docs And Handoff Agent

Scope:

- docs
- phase briefs
- handoffs
- current-state notes

Must not change product behavior.

## Backend Context Reader

May inspect `/Users/egeng/delta-backend` for contracts, docs, and endpoint
behavior. Must not edit backend unless the phase explicitly includes backend.

## Multi-Repo Coordinator

Future role. Plans cross-repo work across site/backend/mobile. Does not execute
changes until repo scope and verification are approved.
