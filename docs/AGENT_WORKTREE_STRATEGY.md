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

Keep worktrees outside the repo and outside the Delta product parent:

```text
/Users/egeng/delta-worktrees/site-phase-56-worktree-orchestration
```

This is the canonical worktree root from both the primary checkout and any
worktree already under `/Users/egeng/delta-worktrees`. Agent scripts must not
infer nested roots such as `/Users/egeng/delta-worktrees/delta-worktrees`.

Do not place worktrees under `delta-site`, `/Users/egeng/delta`, `.next`,
`node_modules`, or any generated build directory. This avoids mixing worktrees
with product repos or unrelated projects such as `/Users/egeng/morning-standup`.

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

## Fresh Worktree Setup

Git worktrees do not share ignored dependency folders. A fresh worktree may not
have `node_modules`, so tests or builds can fail with missing local binaries
such as `jest` until dependencies are installed.

Use:

```bash
npm ci
```

`npm ci` should install dependencies from `package-lock.json` without changing
product behavior. Do not commit `node_modules`, dependency caches, or generated
build output.

## Local Build Env Fallback

Fresh worktrees also do not copy ignored local env files such as `.env.local`.
If `npm run build` fails only because an ignored public local env value is
absent, agents may retry with:

```bash
NEXT_PUBLIC_DELTA_API_URL=http://127.0.0.1:8000 npm run build
```

Do not commit `.env.local`. Do not print or invent secrets. This fallback does
not change production env handling; it only supplies the local public API URL
needed for a one-off verification command.

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
- whether `npm ci` was needed
- whether build env fallback was needed
- commands run
- checks passing/failing
- safety confirmations
- whether the worktree was created by an agent script
- integration status: unmerged, merged, or pending review
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

## First Controlled Worktree Experiment

The first controlled worktree experiment should stay intentionally small:
create the worktree from a clean main checkout, make a docs/eval-only change,
run verification inside the worktree, commit on the phase branch, and hand off
without merging automatically. The handoff should make integration state
explicit by naming the worktree path, branch name, changed files, verification
results, safety confirmations, and whether the branch is still pending review.

## Cleanup Rules

Never clean up worktrees automatically.

Do not run:

```bash
git worktree remove
git branch -D
rm -rf /Users/egeng/delta-worktrees/...
```

unless the user explicitly asks for cleanup after reviewing the worktree state.
If cleanup is requested, report the exact path and branch first.
