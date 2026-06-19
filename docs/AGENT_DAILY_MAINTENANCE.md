# Report-Only Daily Maintenance

`agent:daily:maintenance` is the closest current tool to a background
maintenance agent. It is still manually invoked and report-only.

The command composes existing safe local tools into one daily-style maintenance
report. It does not schedule itself, implement findings, create worktrees,
merge branches, run tests/build/lint, start services, call external LLM APIs,
or change product behavior.

## What It Composes

The wrapper reads local state for:

- maintenance findings under `agent/findings/`
- policy classification from `agent/policies/maintenance-policy.json`
- the top actionable finding selected by policy
- dispatch-plan summary for the recommended next phase
- the latest maintenance run/cycle/daily report under `agent/runs/`
- the latest live domain eval report under `agent/runs/`, if present
- deterministic eval fixture inventory

By default it does not run live evals. With `--include-live-eval`, it calls the
existing local live eval core in skip-safe mode. It does not require the backend
to be running and does not fail simply because the backend is unavailable.

## Commands

Print the daily-style report:

```bash
npm run agent:daily:maintenance -- --report
```

Include optional skip-safe live eval status:

```bash
npm run agent:daily:maintenance -- --include-live-eval
```

Write a durable daily report:

```bash
npm run agent:daily:maintenance -- --write
```

Parser-clean JSON:

```bash
npm --silent run agent:daily:maintenance -- --json
```

Generated reports use:

```text
agent/runs/YYYY-MM-DDTHH-MM-SSZ-daily-maintenance.md
```

Existing reports are not overwritten unless `--force` is passed.

## Report Contents

The report includes:

- timestamp
- repo HEAD and clean status
- findings summary by status and priority
- policy summary by action mode
- top actionable finding
- dispatch decision
- recommended next phase
- latest maintenance record
- latest live eval report
- optional live eval status
- refused actions
- approval requirements
- exact next safe command
- explicit confirmation that no implementation occurred

## What It Refuses To Do

The wrapper must not:

- implement findings
- create worktrees
- merge or delete branches
- run tests, build, or lint
- start backend, site, or mobile services
- mutate Supabase
- run mic, TTS, notifications, or product memory writes
- call external LLM APIs
- run browser automation
- run `npm audit fix`
- schedule itself with cron, launchd, CI, or any background runner

## Relationship To Other Tools

- `agent:maintenance:run` performs one report-only maintenance cycle.
- `agent:run-ledger` records a narrower maintenance inspection ledger entry.
- `agent:dispatch:plan` turns the selected finding into a planning-only dispatch
  proposal.
- `agent:eval:live` optionally checks local read-only domain metadata.
- `agent:daily:maintenance` summarizes those layers into one manually invoked
  daily-style report.

The daily wrapper can recommend a dispatch or finding-brief command. It does
not execute that command.

If a broad finding has been partially remediated and split into narrower
follow-ups, mark the broad finding as deferred with clear notes rather than
leaving it as the top actionable item. The daily wrapper should then surface the
next active finding selected by policy.

## Future Scheduling Plan

Scheduling is intentionally deferred. Before any cron, launchd, CI, or
background-agent runner exists, a future phase must define:

- schedule ownership
- output location and retention
- failure notification policy
- token and secret handling
- human approval rules
- explicit refusal boundaries
- verification that the scheduled job remains report-only

Until then, run this command manually.
