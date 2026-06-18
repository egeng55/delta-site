# Agent Worktree Strategy

Git worktrees give agents a clean, isolated checkout for scoped phases without
dirtying the primary `delta-site` checkout. They are useful when a phase is
large, experimental, or likely to span multiple turns.

For future multi-agent coordination, pair this document with
`docs/AGENT_PARALLEL_WORKFLOWS.md`. This document remains the canonical source
for worktree paths, branch names, and cleanup rules.

Workspace layout is documented in `docs/AGENT_WORKSPACE_LAYOUT.md`.

## Why Worktrees Matter

Worktrees help with agent safety because they:

- keep the main checkout clean for verified milestone work
- make it easier to abandon exploratory changes without touching the main repo
- separate parallel phase branches by filesystem path
- reduce accidental cross-phase file mixing
- make handoffs more concrete: branch, path, status, and next command

They do not replace scope control, tests, safety review, or explicit commits.

## When To Use A Worktree

Use a worktree when:

- a phase is broad enough that rollback risk matters
- two agents may inspect or work in parallel
- the change is exploratory and may be abandoned
- the user asks for a branch/worktree plan
- the task touches `/os`, Electron, or agent tooling in a way that may take
  multiple iterations

Do not use a worktree when:

- the change is a tiny docs-only edit
- the primary checkout is already dirty and must be resolved first
- the phase explicitly requires staying in the current checkout
- the task is read-only analysis

## Directory Convention

Keep worktrees outside the repo:

```text
/Users/egeng/delta/worktrees/site-phase-56-worktree-orchestration
```

When the repos are still in the current flat layout, use the fallback:

```text
/Users/egeng/delta-worktrees/site-phase-56-worktree-orchestration
```

Do not place worktrees under `delta-site`, `.next`, `node_modules`, or any
generated build directory.

## Branch Naming Convention

Use:

```text
phase-56-worktree-orchestration
```

Format:

```text
phase-<number>-<short-slug>
```

Use lowercase letters, numbers, and hyphens only.

## Safe Start Command

Preview first:

```bash
npm run agent:routine -- --routine worktree-experiment --phase 56 --name worktree-orchestration
npm run agent:phase:start -- --phase 56 --name worktree-orchestration --print
```

Create only with explicit `--run`:

```bash
npm run agent:phase:start -- --phase 56 --name worktree-orchestration --run
```

The start script must refuse to create a worktree when:

- the current repo is dirty
- phase or name is missing
- the target path already exists

It must not delete worktrees, clean files, commit, touch backend, or touch
mobile.

## Avoiding Cross-Repo Edits

`delta-site` agents may inspect sibling repos only as read-only context unless a
phase explicitly includes them:

```text
delta-backend
delta-mobile
```

Before editing, run:

```bash
npm run agent:status
```

If backend or mobile are dirty, report that state but do not modify or clean
those repos from a `delta-site` phase.

## Handoff Expectations

A worktree handoff should include:

- worktree path
- branch name
- HEAD commit
- git status
- files changed
- commands run
- checks passing/failing
- safety confirmations
- whether the worktree was created by an agent script
- next safest command

Use:

```bash
npm run agent:phase:handoff -- --phase 56
```

The handoff script prints a skeleton only. It does not write files in this
phase.

Routine guidance is also available:

```bash
npm run agent:routine -- --routine handoff --phase 56
```

`agent:routine` is print-only and does not create, clean, or delete anything.

## Cleanup Rules

Never clean up worktrees automatically.

Do not run:

```bash
git worktree remove
git branch -D
rm -rf /Users/egeng/delta-worktrees/...
rm -rf /Users/egeng/delta/worktrees/...
```

unless the user explicitly asks for cleanup after reviewing the worktree state.
If cleanup is requested, report the exact path and branch first.
