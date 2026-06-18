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

Agents can use `npm run agent:verify -- --<scope>` to print the recommended
commands for a phase. The wrapper does not execute anything unless `--run` is
provided.

Agents can use `npm run agent:eval` to validate deterministic eval fixtures for
OS Console explainability, safety language, and handoff quality. This currently
checks fixture structure only; it does not run live conversations or call an
LLM.

Agents can use `npm run agent:status` for a read-only repo snapshot before
starting or handing off work. For larger scoped phases, preview a worktree with
`npm run agent:phase:start -- --phase <number> --name <slug> --print`. Creating
a worktree requires `--run` and must only happen from a clean repo.

Agents can use `npm run agent:routine -- --list` to print standard command
sequences for common phase types. Routine output is guidance only; it does not
execute commands or replace review.

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
- `scripts/agent-status.mjs`: read-only status report with suggested next safe
  commands
- `scripts/agent-safety-scan.mjs`: advisory static scan for risky patterns,
  grouped by source/config risks and lower-severity documentation mentions
- `scripts/agent-eval.mjs`: read-only eval fixture validator for deterministic
  local guardrails under `evals/`
- `scripts/agent-verify.mjs`: print-first verification wrapper with
  `docs-only`, `site`, `desktop`, and `all` scopes
- `scripts/agent-routine.mjs`: print-only routine guide for composing existing
  agent commands
- `scripts/agent-phase-start.mjs`: print-first worktree command helper; `--run`
  can create a new worktree only when the repo is clean
- `scripts/agent-phase-handoff.mjs`: read-only handoff skeleton printer

All scripts are local and advisory. `agent-preflight` and `agent-safety-scan`
are read-only. `agent-eval` validates JSON fixtures without calling backend,
browser, LLM, Supabase, mic, TTS, notification, or write paths. `agent-verify`
prints by default; `--run` executes only fixed commands from the selected scope
and should be used after the phase scope is clear.

`agent-phase-start` must never delete worktrees, clean files, commit, or touch
sibling repos. Worktree cleanup remains a manual, explicitly approved action.
`agent-routine` has no run mode in this phase and must not create worktrees,
commit, or execute commands.
