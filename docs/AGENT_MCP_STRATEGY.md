# Agent MCP Strategy

This document is strategy only. It does not add MCP servers, autonomous agents,
background jobs, CI/CD automation, or new runtime tooling.

## Core Principle

Scripts remain the source of truth for local agent workflows. MCP can become a
structured context layer later, but it should not replace `AGENTS.md`, the
`docs/AGENT_*` docs, or the existing `npm run agent:*` scripts.

Use MCP first for read-only context:

- repo maps
- docs and safety-boundary lookup
- eval fixture summaries
- verification plan summaries
- read-only status snapshots

Repo maps must use `docs/AGENT_WORKSPACE_LAYOUT.md` as the layout source. Delta
context includes only `delta-site`, `delta-backend`, and `delta-mobile`.
Unrelated projects such as `morning-standup` are out of scope, including the
current local legacy path `/Users/egeng/delta/Morning-Standup` if it exists.

Do not use MCP first for mutation, shell execution, database access, desktop
side effects, or commits.

## What Stays As Scripts

Keep these as plain npm scripts:

- `npm run agent:preflight`
- `npm run agent:status`
- `npm run agent:safety-scan`
- `npm run agent:eval`
- `npm run agent:verify`
- `npm run agent:routine`
- `npm run agent:phase:start`
- `npm run agent:phase:handoff`

These scripts are transparent, inspectable, easy to run in any terminal, and
already encode Delta's print-first and advisory defaults. Future MCP servers may
summarize their output, but should not create a separate policy path.

## MCP Candidate Matrix

| Candidate | Classification | Purpose | Capability | Risk | Existing coverage | Worth building now? |
| --- | --- | --- | --- | --- | --- | --- |
| repo-map MCP | implement soon | expose route/component/file ownership and high-risk paths | read-only | low | partial docs and `agent:status` | design now, build later |
| docs/search MCP | implement soon | search `AGENTS.md`, agent docs, desktop docs, and eval notes | read-only | low | `rg` and docs | design now, build later |
| eval-fixture MCP | document only | expose eval files, counts, and categories | read-only | low | `agent:eval` | not first |
| safety-scan MCP | document only | return structured safety scan findings | read-only | low | `agent:safety-scan` | not first |
| verification MCP | defer | summarize or run verification scopes | read/execute | medium | `agent:verify` | keep as script first |
| test-runner MCP | defer | run focused or full tests | execute | medium | npm scripts | defer |
| desktop-smoke MCP | defer | run Electron checks and parse smoke output | execute | medium | desktop scripts | defer |
| screenshot/layout-review MCP | defer | inspect `/os` layout with browser screenshots | browser automation | medium | manual smoke | useful later |
| git-status/worktree MCP | defer | report status or create worktrees | read/write git | medium-high | `agent:status`, `agent:phase:start` | defer |
| Supabase read-only MCP | defer | inspect proof state and schema readiness | network read | medium | backend endpoints and CLI | strict read-only later |
| backend-log MCP | defer | read local backend logs/status | local read | medium | service manager logs | defer |
| GitHub issue/PR MCP | defer | connect phases to issues/PRs | external read/write | medium-high | none | not now |
| CI-status MCP | defer | read CI state after CI exists | external read | medium | none | not now |
| write-capable Supabase MCP | avoid | mutate rows or schema | database write | critical | forbidden | avoid |
| desktop side-effect MCP | avoid | trigger mic, TTS, or notifications | side effects | critical | forbidden | avoid |
| autonomous commit MCP | avoid | edit, stage, or commit automatically | repo write | high | forbidden | avoid |

## Read-Only-First Policy

Any future MCP must start with a read-only mode that proves:

- allowed repo roots are explicit
- forbidden paths are explicit
- unrelated nearby projects are excluded
- network access is declared
- command execution is absent or disabled
- writes are absent
- output is auditable in a normal terminal fallback
- Codex can perform the same work without the MCP server

Only after a read-only MCP is useful should a later phase consider a narrow
execution path.

## Codex-First, Claude-Optional

MCP must not make Delta dependent on Claude Code or any specific host. The
canonical workflow remains:

1. read `AGENTS.md`
2. inspect files
3. use existing scripts
4. verify with the matrix
5. hand off with explicit status

MCP can reduce context-gathering friction for Codex. It is optional assistance,
not policy.

## Required Guardrails For Any Future MCP

Every MCP proposal must document:

- purpose
- read/write capability
- allowed filesystem roots
- forbidden paths
- whether it can execute commands
- whether it can access network
- whether it can mutate files
- whether it can touch sibling repos
- fallback script or manual workflow
- verification commands
- failure mode and safe shutdown behavior

Never expose:

- arbitrary shell execution
- Supabase writes or migrations
- live mic, browser mic, or audio recording
- backend local TTS
- desktop notifications
- memory writes
- deployment actions
- auth, billing, legal, or schema mutation
- automatic staging, commits, branch deletion, or worktree cleanup

## Smallest Useful Next Step

The first implementation after this strategy should be a read-only repo-map or
docs-search prototype. It should not execute commands, mutate files, call
Supabase, start services, or depend on live backend/site processes.
