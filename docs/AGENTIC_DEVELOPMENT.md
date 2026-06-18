# Agentic Development Foundation

Phase 53 adds a Codex-first operating model for future development work in
`delta-site`. This is not a product feature and does not add autonomous agents.

## Goals

- Give coding agents stable context before editing.
- Make phase work repeatable.
- Preserve Delta safety boundaries.
- Make verification and handoff requirements explicit.
- Prepare for later multi-repo orchestration without implementing it now.

## Current Repo Shape

`delta-site` is a standalone Next.js and Electron repo. It has sibling repos:

- `/Users/egeng/delta-backend`
- `/Users/egeng/delta-mobile`

There is no parent monorepo yet. Treat sibling repos as read-only context unless
the phase explicitly includes them.

## Default Agent Loop

1. Read `AGENTS.md`.
2. Inspect files relevant to the request.
3. Identify scope and forbidden areas.
4. Make the smallest coherent change.
5. Run the verification matrix for touched files.
6. Commit with explicit `git add -- <files>` only after checks pass.
7. Report final status and the next safest command.

## Codex First

Codex is the primary agent workflow. Claude Code and Cursor are optional. Do not
copy broad local permission settings into repo policy. `AGENTS.md` is the source
of truth for this repo.

## What This Phase Does Not Add

Phase 53 does not add:

- autonomous background agents
- MCP servers
- CI/CD automation
- write actions
- production deployment automation
- test-fixing bots
- cross-repo orchestration
- live mic, TTS, notifications, or memory writes

## First-Class Artifacts

- `AGENTS.md`: agent policy and repo contract
- `docs/AGENT_*`: templates, roles, verification, safety docs
- `scripts/agent-preflight.mjs`: read-only repo context report
- `scripts/agent-safety-scan.mjs`: advisory static scan for risky patterns

All scripts are advisory and read-only.
