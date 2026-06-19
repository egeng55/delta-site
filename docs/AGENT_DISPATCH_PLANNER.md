# Maintenance Dispatch Planner

`agent:dispatch:plan` converts a maintenance finding into a policy-aware
dispatch plan. It answers what the next safe step would be, which action mode is
allowed, whether human approval is required, what worktree would be proposed if
approved, which files are likely in scope, and what verification would be
required.

It is planning-only. It does not implement findings, create worktrees, run
tests, call external services, mutate Supabase, or change product behavior.

## Relationship To Maintenance Runner

`agent:maintenance:run` performs the one-command report-only cycle: inspect the
queue, classify findings, select the top actionable finding, and stop.

`agent:daily:maintenance` is the manual daily-style wrapper that summarizes
that cycle plus recent run artifacts, live eval report evidence, and
deterministic eval fixture inventory.

`agent:dispatch:plan` starts from a selected finding and prints the next
dispatch plan. It is one step closer to implementation planning, but it still
does not execute anything.

When a human approves a scoped worktree after reviewing a dispatch plan, use
`agent:dispatch:worktree`. That later command creates a worktree only with
`--approve-worktree` and writes a task packet only with `--write-task`.

## Policy Behavior

The planner uses `agent:policy` classifications:

- `human_required`: manual-only dispatch; no implementation or worktree.
- `implementation_requires_approval`: planning is allowed, but human approval is
  required before code, runtime, storage, or cross-repo changes.
- `docs_eval_autofix_allowed`: docs/eval worktree may be proposed after an
  explicit command; the planner does not create it.
- `brief_allowed`: finding brief only.
- `worktree_allowed`: worktree preview only.
- `report_only`, `resolved`, `deferred`, or `blocked`: stop at reporting.

## Commands

Plan from the highest-priority policy-actionable finding:

```bash
npm run agent:dispatch:plan -- --top --phase 78
```

Plan from a specific finding:

```bash
npm run agent:dispatch:plan -- --id 002 --phase 78 --name mobile-cache-strategy
```

Parser-clean JSON:

```bash
npm --silent run agent:dispatch:plan -- --id 002 --phase 78 --json
```

Write a durable dispatch plan:

```bash
npm run agent:dispatch:plan -- --id 002 --phase 78 --name mobile-cache-strategy --write
```

## Write Behavior

Writing requires `--write` and creates:

```text
agent/dispatch-plans/phase-XXX-<finding-slug>-dispatch.md
```

Existing files are not overwritten unless `--force` is passed.

## Approval-Required Findings

For findings such as mobile storage, backend surface separation, status schema
hardening, or Electron production path, the planner may show:

- a proposed phase number and name
- the recommended finding-brief command
- the proposed worktree path and branch if approval is later granted
- likely files and out-of-scope areas
- required verification commands

This is not approval to implement. A later phase must explicitly authorize code
or runtime changes.

## Worktree Dispatcher

The worktree dispatcher is documented in `docs/AGENT_WORKTREE_DISPATCHER.md`.
Typical usage:

```bash
npm run agent:dispatch:worktree -- --id 005 --phase 80 --name live-eval-coverage
npm run agent:dispatch:worktree -- --id 005 --phase 80 --name live-eval-coverage --approve-worktree --write-task
```

It prepares a future Codex run; it does not make the implementation change.

## Safety Rules

The planner must not:

- implement findings
- create worktrees
- run tests from the planner
- call provider dashboards or external services
- mutate Supabase
- run mic, TTS, notifications, or product memory writes
- run `npm audit fix`
- change backend, mobile, site runtime behavior, schema, auth, billing, legal,
  storage behavior, or deployment behavior
