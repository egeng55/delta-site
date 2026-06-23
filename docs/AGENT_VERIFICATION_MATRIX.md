# Agent Verification Matrix

Choose verification based on touched files.

## Verification Wrapper

Use the wrapper to print the recommended commands for a scope:

```bash
npm run agent:verify -- --docs-only
npm run agent:verify -- --site
npm run agent:verify -- --desktop
npm run agent:verify -- --all
```

The wrapper prints commands by default. Add `--run` only when you want it to
execute the selected fixed command set:

```bash
npm run agent:verify -- --desktop --run
```

Scopes:

- `--docs-only`: agent preflight and safety scan
- `--site`: preflight, safety scan, tests, lint, and build
- `--desktop`: site scope plus desktop checks and smoke checks
- `--all`: same as desktop for now because `/os` and Electron are this repo's
  highest-risk surfaces

Run `npm run agent:eval` separately when a phase touches eval fixtures, `/os`
explainability, safety language, or agent handoff expectations.

## Docs And Agent Tooling Only

Examples:

```text
AGENTS.md
docs/AGENT_*.md
scripts/agent-preflight.mjs
scripts/agent-status.mjs
scripts/agent-safety-scan.mjs
scripts/agent-eval.mjs
scripts/agent-routine.mjs
scripts/agent-phase-brief.mjs
scripts/agent-maintenance.mjs
scripts/agent-policy.mjs
scripts/agent-run-ledger.mjs
scripts/agent-maintenance-runner.mjs
scripts/agent-dispatch-plan.mjs
scripts/agent-dispatch-worktree.mjs
scripts/agent-finding-brief.mjs
scripts/agent-phase-start.mjs
scripts/agent-phase-handoff.mjs
evals/**/*.json
agent/findings/*.md
agent/policies/*.json
agent/runs/*.md
agent/dispatch-plans/*.md
agent/dispatch-tasks/*.md
agent/phase-briefs/*.md
```

Run:

```bash
npm run agent:status
npm run agent:verify -- --docs-only
```

If agent scripts or `package.json` changed, use the site or desktop scope
instead of docs-only:

```bash
npm run agent:verify -- --site
npm test -- --runInBand
npm run lint
npm run build
```

## Agent Eval Fixtures

Examples:

```text
docs/AGENT_EVALS.md
evals/os-console/*.json
evals/agent-workflow/*.json
scripts/agent-eval.mjs
```

Run:

```bash
npm run agent:eval
npm run agent:verify -- --site
```

`agent:eval` validates fixture structure only. It does not call the backend,
browser, external LLM APIs, Supabase, mic, TTS, notifications, or write paths.

## Agent Phase Orchestration

Examples:

```text
docs/AGENT_ROUTINES.md
docs/AGENT_WORKTREE_STRATEGY.md
docs/AGENT_WORKSPACE_LAYOUT.md
docs/AGENT_MCP_STRATEGY.md
docs/AGENT_PARALLEL_WORKFLOWS.md
docs/AGENT_ORCHESTRATION.md
docs/AGENT_PHASE_BRIEFS.md
docs/AGENT_MAINTENANCE.md
docs/AGENT_MAINTENANCE_POLICY.md
docs/AGENT_MAINTENANCE_RUNNER.md
docs/AGENT_DISPATCH_PLANNER.md
docs/AGENT_RUN_LEDGER.md
docs/AGENT_FINDING_BRIEFS.md
scripts/agent-routine.mjs
scripts/agent-orchestrate.mjs
scripts/agent-phase-brief.mjs
scripts/agent-maintenance.mjs
scripts/agent-policy.mjs
scripts/agent-run-ledger.mjs
scripts/agent-maintenance-runner.mjs
scripts/agent-dispatch-plan.mjs
scripts/agent-dispatch-worktree.mjs
scripts/agent-finding-brief.mjs
scripts/agent-status.mjs
scripts/agent-phase-start.mjs
scripts/agent-phase-handoff.mjs
agent/findings/*.md
agent/policies/*.json
agent/runs/*.md
agent/dispatch-plans/*.md
agent/dispatch-tasks/*.md
```

Run:

```bash
npm run agent:status
npm run agent:context
npm run agent:routine -- --list
npm run agent:routine -- --routine docs-only
npm run agent:orchestrate -- --phase <number> --name <slug> --routine docs-only
npm run agent:phase:brief -- --phase <number> --name <slug> --routine docs-only
npm run agent:maintenance -- --report
npm run agent:policy -- --report
npm run agent:policy -- --top-actionable
npm run agent:run-ledger -- --report
npm run agent:maintenance:run -- --report
npm run agent:daily:maintenance -- --report
npm run agent:dispatch:plan -- --top --phase <number>
npm run agent:dispatch:worktree -- --top --phase <number>
npm run agent:finding:brief -- --top --phase <number>
npm run agent:orchestrate -- --phase <number> --name <slug> --routine worktree-experiment --mode parallel-plan
npm run agent:phase:start -- --phase <number> --name <slug> --print
npm run agent:phase:handoff -- --phase <number>
npm run agent:verify -- --site
```

Only run `agent:phase:start` with `--run` when the phase explicitly asks to
create a worktree. The script must never clean files, delete worktrees, delete
branches, commit, or touch sibling repos.

`agent:routine` is print-only in this phase. It does not execute commands,
create worktrees, commit, or modify files.

`agent:orchestrate` is also print-only. It composes context, routine, worktree,
role, verification, safety, and handoff guidance without executing commands,
creating worktrees, writing files, or committing. Use `npm --silent` or direct
`node` invocation for parser-clean JSON output.

`agent:phase:brief` is print-only by default. It writes a durable markdown brief
only with `--write`, under `agent/phase-briefs/`, and refuses to overwrite
without `--force`.

`agent:maintenance` is a read-only report over `agent/findings/`. `agent:policy`
is a read-only classifier that maps findings to allowed action modes.
`agent:run-ledger` is report-only by default and writes maintenance run records
only with `--write`. `agent:maintenance:run` is a report-only maintenance cycle
runner and writes cycle reports only with `--write`. `agent:daily:maintenance`
is a manual report-only daily wrapper over maintenance, policy, dispatch,
recent run evidence, and deterministic eval fixture inventory; it writes daily
reports only with `--write` and includes skip-safe live eval status only with
`--include-live-eval`. `agent:dispatch:plan` is
planning-only and writes dispatch plans only with `--write`.
`agent:dispatch:worktree` is approval-gated: it creates worktrees only with
`--approve-worktree`, writes task packets only with `--write-task`, and still
does not implement, test, merge, delete, or clean up findings.
`agent:finding:brief` checks policy first, is print-only by default, and writes
a generated remediation phase brief only with `--write`. These scripts must not
implement findings, run tests from planners, commit, or mark findings resolved.

Fresh worktrees may need dependency setup before tests or builds:

```bash
npm ci
```

`node_modules` is ignored and is not copied between worktrees. Do not commit
dependency folders, caches, or generated build output. If `npm run build` fails
only because ignored local env is absent, retry with:

```bash
NEXT_PUBLIC_DELTA_API_URL=http://127.0.0.1:8000 npm run build
```

Do not commit `.env.local`, print secrets, or change production env handling.

MCP and parallel-agent strategy docs are documentation only. They do not
authorize new servers, background jobs, CI/CD automation, or autonomous writes.
Workspace layout changes must keep Delta product context limited to
`delta-site`, `delta-backend`, and `delta-mobile`; unrelated projects such as
`/Users/egeng/morning-standup` remain excluded.

`agent:context` is read-only and prints Markdown by default or JSON with
`-- --json`. It also supports `-- --compact` for shorter Markdown. It does not
replace verification commands; it gives future agents a bounded repo map before
they edit, including route/component/desktop/test/doc/eval/script maps, risk
classification, workspace exclusions, and advisory verification recommendations.

## OS Console

Examples:

```text
src/components/OSConsole.tsx
src/components/OSConsole.test.tsx
src/lib/osConsoleFixtures.ts
src/lib/conversationApi.ts
src/lib/systemReadinessApi.ts
```

Run:

```bash
npm run agent:verify -- --desktop
npm test -- --runInBand src/components/OSConsole.test.tsx
npm test -- --runInBand
npm run lint
npm run build
npm run desktop:check
npm run desktop:smoke
npm run desktop:smoke:services
```

## Electron Desktop Shell

Examples:

```text
desktop/main.cjs
desktop/preload.cjs
desktop/runtime-config.cjs
desktop/runtime-config.test.js
desktop/fallback.html
desktop/smoke-check.cjs
docs/DESKTOP_APP.md
```

Run:

```bash
npm run agent:verify -- --desktop
npm run desktop:check
npm run desktop:smoke
npm run desktop:smoke:services
npm test -- --runInBand
npm run lint
npm run build
```

## Marketing Or Static Site UI

Run:

```bash
npm run agent:verify -- --site
npm test -- --runInBand
npm run lint
npm run build
```

## Auth, Legal, Billing, Or Schema

Stop unless the phase explicitly includes these files. If approved, define a
custom verification plan in the phase brief.

High-risk examples:

```text
src/context/AuthContext.tsx
src/app/(marketing)/privacy/page.tsx
src/app/(marketing)/terms/page.tsx
src/app/(marketing)/cookies/page.tsx
supabase/migrations/*
```

## Sibling Repos

Do not run backend or mobile write-producing commands unless those repos are in
scope. If included, use their own repo-specific verification.

## Safety Scan Notes

`npm run agent:safety-scan` is advisory. It does not replace human review, and
it exits successfully unless the script itself crashes. Findings are grouped as:

- source/config risks: review first because they can affect executable behavior
- documentation mentions: lower severity, often intentional policy examples
- generated/build artifacts ignored: skipped dependency, cache, and build paths

## Eval Notes

`npm run agent:eval` is advisory. It validates fixture shape and reports counts
by category. It does not replace Jest tests, lint, build, desktop smoke checks,
or human review of copy and safety posture.
