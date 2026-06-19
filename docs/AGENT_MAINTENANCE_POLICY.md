# Agent Maintenance Policy

The maintenance policy engine classifies each finding into the most permissive
agent action mode currently allowed. It is a report-only guardrail for future
agent work. It does not implement findings, create worktrees, run tests, or
approve runtime changes.

Policy data lives in:

```text
agent/policies/maintenance-policy.json
```

Inspect the policy report with:

```bash
npm run agent:policy -- --report
npm run agent:policy -- --id 002
npm run agent:policy -- --top-actionable
npm --silent run agent:policy -- --json
```

## Action Modes

### report_only

Agent may report status only.

- no brief generation
- no worktree
- no implementation

### brief_allowed

Agent may generate a scoped phase brief.

- no implementation
- no worktree unless a later phase explicitly asks

### worktree_allowed

Agent may recommend or create a worktree only after an explicit reviewed command.

- no implementation unless separately allowed
- no automatic cleanup
- no automatic merge

### docs_eval_autofix_allowed

Agent may make docs/eval-only changes in an isolated worktree.

- verify before handoff
- wait for human merge approval
- do not touch product runtime files

### implementation_requires_approval

Agent may plan and prepare a brief.

- human approval required before code changes
- human approval required before runtime, storage, auth, schema, deployment, or
  cross-repo changes

### human_required

Agent may only document or checklist the issue.

Examples:

- provider credential rotation
- payment provider actions
- production secret handling
- account-level security changes

### blocked

Agent must not act.

Examples:

- destructive cleanup
- secret printing
- database writes without explicit approval
- Supabase mutations without explicit approval
- mic, TTS, notification, or memory-write enablement

## Rule Summary

The initial policy is conservative:

- `pending-human` findings become `human_required`.
- `resolved` and `deferred` findings become `report_only`.
- credential/provider/secret findings become `human_required`.
- docs/eval-only findings may become `docs_eval_autofix_allowed`.
- site/backend/mobile runtime findings become
  `implementation_requires_approval`.
- auth, schema, migration, billing, privacy, terms, deployment, signing,
  notarization, and storage-behavior findings require approval.
- Supabase mutation, mic, TTS, notification, memory-write, destructive cleanup,
  secret-printing, or `npm audit fix` requests are `blocked`.
- P0 findings should never auto-implement.
- P1 findings may generate briefs but require approval for runtime changes.
- P2 docs/eval/tooling findings may allow docs/eval autofix.

## Relationship To Finding Briefs

`agent:finding:brief` checks this policy before generating output.

- `human_required` findings may produce manual/checklist briefs.
- `blocked` findings are refused.
- `implementation_requires_approval` findings produce planning briefs that
  clearly require human approval before implementation.
- `docs_eval_autofix_allowed` findings may produce docs/eval-scoped briefs.

## Relationship To Run Ledger

`agent:run-ledger` records the current policy output for a maintenance run. It
captures the top actionable finding, action mode, approval requirement, allowed
next actions, forbidden actions, and refused actions.

Run records are operational logs for agents. They do not grant approval, close
findings, create worktrees, or authorize implementation.

`agent:maintenance:run` uses the same policy output for a one-command
report-only maintenance cycle. It selects the top actionable finding, prints the
approval requirement, and may write a `maintenance-cycle` report with `--write`.
It still does not grant approval, close findings, create worktrees, or
authorize implementation.

`agent:daily:maintenance` uses the same policy output for a manually invoked
daily-style summary. It adds dispatch context, recent run artifacts, live eval
report evidence, and deterministic eval fixture inventory. It writes
`daily-maintenance` reports only with `--write`, includes skip-safe live eval
status only with `--include-live-eval`, and still performs no implementation or
scheduling.

`agent:dispatch:plan` also uses this policy output. It may print or write a
dispatch plan with proposed phase, scope, worktree path, and verification
commands, but the policy mode still controls whether implementation is blocked,
manual-only, or approval-required.

`agent:dispatch:worktree` enforces the same policy one step later. It refuses
`human_required`, `blocked`, and `report_only` worktree dispatches, requires
`--approve-worktree` for any worktree creation, requires `--write-task` for task
packets, and still performs no implementation or merge.

## Human Review Remains Required

The policy engine is not an autonomous approval system. It is a local,
read-only classifier. A human still decides whether a remediation phase should
start, whether a worktree should be created, and whether code should merge.
