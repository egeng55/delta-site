# Agent Parallel Workflows

This document defines future workflow policy only. It does not add parallel
agents, background agents, MCP servers, CI/CD automation, or autonomous writes.

## Worktree-Per-Agent Model

Parallel work must use one worktree per agent and one scoped role per worktree.
Use the detailed conventions in `docs/AGENT_WORKTREE_STRATEGY.md`.

Recommended shape:

```text
/Users/egeng/delta-worktrees/site-phase-58-mcp-strategy
/Users/egeng/delta-worktrees/site-phase-59-repo-map-mcp
```

Use this external worktree root for both the current flat layout and the
preferred grouped product layout. See `docs/AGENT_WORKSPACE_LAYOUT.md`.

Branch shape:

```text
phase-58-mcp-strategy
phase-59-repo-map-mcp
```

Preview worktree commands first:

```bash
npm run agent:phase:start -- --phase <number> --name <slug> --print
```

For a broader advisory split across roles and candidate worktrees, use the
print-only orchestration planner:

```bash
npm run agent:orchestrate -- --phase <number> --name <slug> --routine worktree-experiment --mode parallel-plan
```

Creating a worktree requires explicit approval and `--run`. Worktree cleanup is
manual and must never be automatic.

## Parallel-Safe Roles

These roles can run in parallel when they have separate worktrees and
non-overlapping files:

- Docs and handoff agent
- Eval fixture agent
- Safety reviewer
- Repo-map or context reader
- Test failure classifier in read-only mode
- Frontend UI agent with isolated component scope
- Electron safety reviewer in read-only mode
- Backend context reader in read-only mode

See `docs/AGENT_ROLES.md` for the canonical role definitions.

## Sequential-Only Roles

Keep these sequential:

- final integrator
- committer
- package script or lockfile editor
- Electron service-manager editor
- auth, legal, billing, privacy, terms, schema, or migration editor
- backend contract editor
- mobile runtime editor
- any role that touches shared `/os` state architecture
- any role that would run side-effect validation

Only one agent should integrate and commit a final diff.

## Coordinator Responsibilities

A coordinator should:

1. define the phase goal and forbidden actions
2. assign one repo and one worktree per agent
3. assign explicit files or file families
4. choose the verification scope
5. collect handoffs
6. review safety scan output and diffs
7. merge changes sequentially
8. commit only after the selected verification passes

The coordinator must not treat parallel agent output as automatically safe.

## Report-Only Overnight Routines

Safe overnight routines are report-only. They may inspect and summarize, but
must not edit, stage, commit, start services, or trigger side effects.

Safe candidates:

- repo cleanliness snapshot
- safety-scan report
- eval fixture validation report
- stale docs or TODO report
- high-risk path diff report
- package script inventory
- cross-repo branch/status report
- verification recommendation report

## Never Run Overnight

Do not run overnight:

- live backend or site services
- Electron desktop launch
- live mic or browser mic
- backend local TTS
- desktop notifications
- Supabase mutations or migrations
- auth, billing, privacy, terms, schema, or deployment changes
- dependency installs or upgrades
- branch deletion
- worktree deletion
- automatic commits
- autonomous test-fixing or code-writing loops

## Future Multi-Repo Orchestration

Delta may later add a parent workspace layer, but the current repo remains
standalone. A future workspace should start as read-only:

```text
/Users/egeng/delta/workspace/
  docs/
    MULTI_REPO_AGENT_GUIDE.md
    MULTI_REPO_VERIFICATION.md
  scripts/
    delta-status.mjs
    delta-verify-plan.mjs
```

Initial multi-repo orchestration should only:

- detect sibling repos
- report branch, HEAD, and git status
- report available agent scripts
- suggest per-repo verification
- preserve repo ownership boundaries
- exclude unrelated projects such as `/Users/egeng/morning-standup`

Do not centralize commits, cleanup, deployment, schema changes, or service
startup until a later explicitly scoped phase.

## Merge And Integration Rules

- Merge one worktree at a time.
- Review changed files before staging.
- Run the verification matrix for the integrated result.
- Stage explicit files only.
- Do not use `git add .`.
- Do not commit unrelated dirty files.
- Include safety confirmations and final repo status in the handoff.

If parallel outputs conflict, stop and resolve deliberately. Do not let the last
agent overwrite earlier work by default.
