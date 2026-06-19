# Agent Run Ledger

The agent run ledger records what a maintenance-oriented agent inspected, what
policy decided, which actions were allowed or refused, and the next recommended
command. It is operational memory for future agents, not product memory.

Run records live under:

```text
agent/runs/
```

## Purpose

Use run records before future autonomous or report-only agents so each run has a
durable audit trail:

- repo HEAD and cleanliness
- finding counts by status, priority, and policy mode
- top actionable finding
- allowed next actions
- forbidden and refused actions
- human approval requirements
- recommended next command

The ledger does not implement findings, run tests, create worktrees, call
external services, mutate Supabase, or change product behavior.

## Maintenance Findings Vs Run Ledger

Maintenance findings describe durable issues under `agent/findings/`.

The run ledger describes one maintenance inspection run. A run record can point
to a finding, but it does not resolve that finding and does not authorize
implementation.

`agent:maintenance:run` is the higher-level report-only maintenance cycle. It
combines finding inspection, policy classification, top actionable selection,
and the recommended next command. It may write a `maintenance-cycle` report.
`agent:run-ledger` remains the narrower command for recording one run ledger
entry.

`agent:dispatch:plan` is the next planning layer. It can propose a phase,
worktree path, likely files, and verification for a finding, but it still does
not authorize implementation or create worktrees.

`agent:daily:maintenance` is the broader manual daily-style wrapper. It
summarizes the latest run records, policy-selected finding, dispatch decision,
and deterministic eval fixture inventory. It may write a `daily-maintenance`
report, but it does not replace narrower ledger records when a phase needs one
specific durable run entry.

## Report-Only Default

Print a report:

```bash
npm run agent:run-ledger -- --report
```

Parser-clean JSON:

```bash
npm --silent run agent:run-ledger -- --json
```

Focus on one finding:

```bash
npm run agent:run-ledger -- --finding 002
```

## Write Behavior

Writing requires an explicit flag:

```bash
npm run agent:run-ledger -- --write
```

Generated records use:

```text
agent/runs/YYYY-MM-DDTHH-MM-SSZ-maintenance-run.md
```

Existing records are not overwritten unless `--force` is passed.

Daily maintenance reports are written separately with:

```bash
npm run agent:daily:maintenance -- --write
```

## Required Before Future Autonomous Actions

Before any future background or autonomous agent is allowed to act, it should
first produce or reference a run record that includes:

- policy action mode
- approval requirement
- allowed next command
- forbidden actions
- refused actions
- repo cleanliness
- exact finding id, if a finding is selected

This does not grant permission to implement. It records the state that a human
or coordinator can review.

## Why Background Agents Need It

Report-only background agents need durable context because their output may be
read later, after repo state has changed. A run record prevents ambiguity about
what the agent inspected and what the policy allowed at that time.

Do not use run records for product memory, user memory, analytics, or
behavioral writes.
