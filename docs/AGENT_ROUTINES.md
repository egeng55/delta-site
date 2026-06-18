# Agent Routine Workflows

Agent routines compose the existing advisory scripts into repeatable workflows.
They are not autonomous agents, CI jobs, or background processes. Use them to
choose the right command sequence for a phase, then apply normal judgment and
human review.

Print routine guidance with:

```bash
npm run agent:routine -- --list
npm run agent:routine -- --routine docs-only
npm run agent:routine -- --routine desktop
npm run agent:routine -- --routine worktree-experiment --phase 58 --name example
```

## Shared Safety Rules

All routines inherit the `AGENTS.md` safety contract:

- no product behavior changes outside the requested phase
- no backend or mobile edits unless explicitly scoped
- no Supabase mutation
- no live mic
- no TTS
- no notifications
- no memory writes
- no auth, billing, privacy, terms, schema, migration, or deployment changes
- no automatic commits
- no automatic worktree creation or cleanup

## Docs-Only Change

Use when editing `AGENTS.md`, `docs/`, eval fixture documentation, or advisory
workflow copy.

Before changes:

```bash
npm run agent:status
npm run agent:preflight
```

After changes:

```bash
npm run agent:safety-scan
npm run agent:eval
npm run agent:verify -- --docs-only
```

Verification scope: docs-only, or site if package scripts changed.

Handoff:

```bash
npm run agent:phase:handoff -- --phase <number>
```

Do not edit `/os`, Electron runtime code, backend, mobile, legal pages, auth, or
schema files from this routine.

## Frontend UI Change

Use when editing site components or static frontend UI outside Electron service
management.

Before changes:

```bash
npm run agent:status
npm run agent:preflight
```

After changes:

```bash
npm run agent:safety-scan
npm run agent:verify -- --site
npm test -- --runInBand
npm run lint
npm run build
```

Verification scope: site.

Safety notes:

- keep browser TTS user-triggered only
- keep voice input disabled unless explicitly scoped
- do not add Supabase writes or backend calls that mutate state

## `/os` Or Electron Change

Use when touching `/os`, OS Console components, Electron shell, service manager,
desktop fallback, or desktop smoke checks.

Before changes:

```bash
npm run agent:status
npm run agent:preflight
npm run agent:routine -- --routine desktop
```

After changes:

```bash
npm run agent:safety-scan
npm run agent:eval
npm run agent:verify -- --desktop
npm run agent:verify -- --desktop --run
```

Verification scope: desktop.

Safety notes:

- do not weaken Electron sandbox, context isolation, or permission denial
- do not expose arbitrary shell execution
- keep `/os` read-only
- keep browser mic, backend TTS, and notifications disabled unless explicitly
  approved in a future phase

## Test-Fix Loop

Use when a test fails and the requested phase allows fixing it.

Before changes:

```bash
npm run agent:status
```

Routine:

1. Inspect the failing test and covered behavior.
2. Classify root cause: product bug, stale test, brittle assertion, or
   environment issue.
3. Make the smallest safe fix.
4. Run focused test first.
5. Run the broader verification scope.

After changes:

```bash
npm test -- --runInBand
npm run lint
npm run build
```

Do not weaken tests to hide product regressions. Do not touch unrelated files.

## Safety Review

Use before committing any nontrivial diff.

Before review:

```bash
npm run agent:status
npm run agent:safety-scan
```

Review for:

- Supabase mutation
- schema/migration changes
- auth/legal/billing changes
- Electron permission broadening
- arbitrary shell execution
- mic/TTS/notification enablement
- memory writes
- backend/mobile boundary violations

Handoff:

```bash
npm run agent:phase:handoff -- --phase <number>
```

Safety scan findings are advisory. Human diff review is still required.

## Eval Update

Use when editing `evals/`, `docs/AGENT_EVALS.md`, OS Console explainability
expectations, safety-language expectations, or handoff quality fixtures.

Before changes:

```bash
npm run agent:status
```

After changes:

```bash
npm run agent:eval
npm run agent:safety-scan
npm run agent:verify -- --site
```

Do not call external LLM APIs, backend services, browser automation, Supabase,
mic, TTS, notifications, or write paths.

## Phase Start

Use to inspect repo state and decide whether a phase should use the primary
checkout or a worktree.

Commands:

```bash
npm run agent:status
npm run agent:phase:start -- --phase <number> --name <slug> --print
```

Only create a worktree if explicitly requested:

```bash
npm run agent:phase:start -- --phase <number> --name <slug> --run
```

Do not create a worktree from a dirty repo. Do not delete worktrees or branches.

## Phase Handoff

Use when context is being compacted, work is paused, or another agent will
continue.

Commands:

```bash
npm run agent:status
npm run agent:phase:handoff -- --phase <number>
```

Include exact files changed, commands run, warnings, safety confirmations, repo
status, and next safest command.

## Worktree-Based Experimental Phase

Use for broad, uncertain, or parallelizable work.

Before creation:

```bash
npm run agent:status
npm run agent:phase:start -- --phase <number> --name <slug> --print
```

Creation requires explicit approval and `--run`:

```bash
npm run agent:phase:start -- --phase <number> --name <slug> --run
```

After creation:

```bash
cd /Users/egeng/delta-worktrees/site-phase-<number>-<slug>
npm run agent:status
```

Handoff must include worktree path, branch, HEAD, git status, verification, and
whether cleanup was requested. Never clean up automatically.

## Future Parallel-Agent Phase

Documented only. This repo does not yet implement parallel agents, background
agents, autonomous writes, MCP orchestration, CI/CD automation, or overnight
mutation loops.

Use `docs/AGENT_PARALLEL_WORKFLOWS.md` for the detailed worktree-per-agent
model. Use `docs/AGENT_MCP_STRATEGY.md` for optional future MCP boundaries.

Future planning should require:

- explicit repo scope per agent
- explicit worktree per agent
- report-only behavior by default
- no cross-repo writes without approval
- no production deployment actions
- no Supabase, mic, TTS, notification, or memory-write side effects
