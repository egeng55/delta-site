# Report-Only Maintenance Runner

`agent:maintenance:run` is the one-command maintenance cycle for Delta's agent
tooling. It composes the local findings queue, maintenance policy, and top
actionable finding selection into a single report.

It is the first background-agent precursor, but it is not a background agent.
There is no scheduling, cron, launchd job, MCP server, autonomous writer, or
implementation behavior in this phase.

## What It Does

The runner:

- reads `agent/findings/*.md`
- applies `agent/policies/maintenance-policy.json`
- counts findings by status, priority, and policy mode
- selects the top actionable finding using the same rules as
  `agent:policy -- --top-actionable`
- prints the approval requirement and refused actions
- prints the recommended next command
- optionally writes a durable maintenance cycle report

It does not implement findings, create worktrees, generate phase brief files,
run tests, call external services, mutate Supabase, run mic/TTS/notifications,
or change product behavior.

## Commands

Print a report:

```bash
npm run agent:maintenance:run -- --report
```

Parser-clean JSON:

```bash
npm --silent run agent:maintenance:run -- --json
```

Write a durable cycle report:

```bash
npm run agent:maintenance:run -- --write
```

Print the suggested finding-brief command explicitly in the human report:

```bash
npm run agent:maintenance:run -- --report --include-brief-command
```

Generated reports use:

```text
agent/runs/YYYY-MM-DDTHH-MM-SSZ-maintenance-cycle.md
```

Existing reports are not overwritten unless `--force` is passed.

## Relationship To Other Tools

- `agent:maintenance` lists the findings queue.
- `agent:policy` classifies findings and selects the top actionable finding.
- `agent:run-ledger` records one run ledger entry.
- `agent:maintenance:run` performs the full report-only cycle and may write a
  cycle report.
- `agent:daily:maintenance` summarizes the maintenance cycle, dispatch planning
  context, recent run records, latest live eval evidence, and deterministic eval
  fixture inventory into a manual daily-style report.
- `agent:dispatch:plan` turns the selected finding into a planning-only
  dispatch plan with approval requirements, proposed worktree details, scope,
  and verification.
- `agent:finding:brief` turns a selected finding into a scoped phase brief, but
  only when a later phase explicitly asks for that planning artifact.

The runner may print a suggested `agent:finding:brief` command. That command is
not executed by the runner and does not authorize implementation.

For a broader daily-style snapshot, use:

```bash
npm run agent:daily:maintenance -- --report
```

That wrapper is also report-only. It does not schedule itself or run
tests/build/lint.

## Future Background Agents

Before any future report-only or autonomous routine is scheduled, it should be
able to produce the same information this runner records:

- top finding
- policy mode
- approval requirement
- refused actions
- recommended next command
- confirmation that no implementation occurred

Future write-capable agents must still require explicit approval and policy
checks. This runner only creates operational context for review.
