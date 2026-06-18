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
scripts/agent-phase-start.mjs
scripts/agent-phase-handoff.mjs
evals/**/*.json
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
scripts/agent-routine.mjs
scripts/agent-orchestrate.mjs
scripts/agent-phase-brief.mjs
scripts/agent-status.mjs
scripts/agent-phase-start.mjs
scripts/agent-phase-handoff.mjs
```

Run:

```bash
npm run agent:status
npm run agent:context
npm run agent:routine -- --list
npm run agent:routine -- --routine docs-only
npm run agent:orchestrate -- --phase <number> --name <slug> --routine docs-only
npm run agent:phase:brief -- --phase <number> --name <slug> --routine docs-only
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

MCP and parallel-agent strategy docs are documentation only. They do not
authorize new servers, background jobs, CI/CD automation, or autonomous writes.
Workspace layout changes must keep Delta product context limited to
`delta-site`, `delta-backend`, and `delta-mobile`; unrelated projects such as
`/Users/egeng/morning-standup` remain excluded.

`agent:context` is read-only and prints Markdown by default or JSON with
`-- --json`. It does not replace verification commands; it gives future agents
a bounded repo map before they edit.

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
