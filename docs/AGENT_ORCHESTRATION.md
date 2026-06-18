# Agent Orchestration Planner

`agent:orchestrate` is a print-only planning wrapper for Codex-led phases. It
does not run commands, create worktrees, write files, start servers, call
external services, or commit. It composes the existing local agent tools into a
single phase plan so a future agent can start with the right context,
verification scope, safety reminders, and handoff expectations.

## Purpose

Use the orchestration planner when a phase needs more structure than a single
routine printout:

```bash
npm run agent:orchestrate -- --phase 62 --name orchestration --routine docs-only
npm run agent:orchestrate -- --phase 63 --name repo-map --routine site
npm run agent:orchestrate -- --phase 64 --name parallel-docs --routine worktree-experiment --mode parallel-plan
```

For parser-clean JSON:

```bash
npm --silent run agent:orchestrate -- --phase 62 --name orchestration --routine docs-only --json
node scripts/agent-orchestrate.mjs --phase 62 --name orchestration --routine docs-only --json
```

## What It Composes

The planner references, but does not execute:

- `npm run agent:preflight`
- `npm run agent:status`
- `npm run agent:context`
- `npm run agent:routine -- --routine <routine>`
- `npm run agent:phase:start -- --phase <phase> --name <slug> --print`
- routine-specific `agent:verify` commands
- `npm run agent:phase:handoff -- --phase <phase>`

The script remains advisory. It is not a task runner.

For a durable markdown phase contract, use `agent:phase:brief`:

```bash
npm run agent:phase:brief -- --phase 64 --name repo-map --routine site
npm run agent:phase:brief -- --phase 64 --name repo-map --routine site --write
```

`agent:phase:brief` uses the same routine model but writes only with `--write`
under `agent/phase-briefs/`.

## Supported Routines

| Routine | Suggested role | Typical verification |
| --- | --- | --- |
| `docs-only` | Docs/Handoff Agent | `agent:safety-scan`, `agent:eval`, `agent:verify -- --docs-only` |
| `site` | Delta Site Frontend Agent | `agent:verify -- --site`, then `--run` when ready |
| `desktop` | Site Frontend Agent + Electron Safety Reviewer | `agent:verify -- --desktop`, then `--run` when ready |
| `test-fix` | Delta Test Fixer | focused test run, then site verification |
| `safety-review` | Delta Safety Reviewer | safety scan and eval fixture check |
| `eval-update` | Eval Maintainer | `agent:eval` and docs-only verification |
| `phase-start` | Coordinator | worktree preview and status |
| `handoff` | Docs/Handoff Agent | handoff skeleton and status |
| `worktree-experiment` | Coordinator + isolated implementation agent | worktree preview plus routine-specific checks |

## Parallel-Plan Mode

`--mode parallel-plan` prints an advisory split into parallel-safe roles and
candidate worktree paths. It does not create those worktrees.

Parallel planning must still follow `docs/AGENT_PARALLEL_WORKFLOWS.md`:

- one repo per agent
- one worktree per agent
- one scoped role per worktree
- no automatic commits
- final integration stays sequential
- file collisions are resolved by the coordinator

## JSON Mode

`--json` emits the same major sections as machine-readable JSON:

- phase identity
- context commands
- worktree plan
- suggested roles
- pre-change checklist
- forbidden action reminders
- verification plan
- handoff plan
- optional parallel-plan split

Use `npm --silent` or direct `node` invocation when another tool needs to parse
the output.

## What It Does Not Do

`agent:orchestrate` does not:

- add MCP servers
- run autonomous agents
- run background jobs
- create or delete worktrees
- execute verification
- mutate product code
- touch backend or mobile
- mutate Supabase
- run mic, TTS, notifications, or memory writes
- change auth, billing, legal, schema, migrations, or deployment behavior
- stage or commit files

## Relationship To MCP And Autonomous Agents

This planner is intentionally script-first. Future MCP servers may wrap these
structured outputs, but scripts remain the source of truth. The planner is
useful to Codex without requiring Claude Code, MCP, or background automation.
