# Agentic Development Foundation

Phase 53 adds a Codex-first operating model for future development work in
`delta-site`. This is not a product feature and does not add autonomous agents.

## Goals

- Give coding agents stable context before editing.
- Make phase work repeatable.
- Preserve Delta safety boundaries.
- Make verification and handoff requirements explicit.
- Prepare for later multi-repo orchestration without implementing it now.

## Current Repo Shape

`delta-site` is a standalone Next.js and Electron repo. Delta product context
includes exactly:

- `delta-site`
- `delta-backend`
- `delta-mobile`

The workspace may currently be flat under `/Users/egeng`, or manually moved to
the preferred grouped layout under `/Users/egeng/delta`. See
`docs/AGENT_WORKSPACE_LAYOUT.md` for supported paths. Treat sibling repos as
read-only context unless the phase explicitly includes them. Unrelated projects
such as `/Users/egeng/morning-standup` are not part of Delta context.

## Default Agent Loop

1. Read `AGENTS.md`.
2. Inspect files relevant to the request.
3. Identify scope and forbidden areas.
4. Make the smallest coherent change.
5. Run the verification matrix for touched files.
6. Commit with explicit `git add -- <files>` only after checks pass.
7. Report final status and the next safest command.

Agents can use `npm run agent:verify -- --<scope>` to print the recommended
commands for a phase. The wrapper does not execute anything unless `--run` is
provided.

Agents can use `npm run agent:eval` to validate deterministic eval fixtures for
OS Console explainability, safety language, and handoff quality. This currently
checks fixture structure only; it does not run live conversations or call an
LLM.

Agents can use `npm run agent:status` for a read-only repo snapshot before
starting or handing off work. For larger scoped phases, preview a worktree with
`npm run agent:phase:start -- --phase <number> --name <slug> --print`. Creating
a worktree requires `--run` and must only happen from a clean repo.

Agents can use `npm run agent:context` for a fuller read-only repo context
bundle before a phase begins. It reports recent commits, route/component maps,
desktop files, tests, docs, eval fixtures, agent scripts, risk classification,
Morning-Standup exclusion status, and advisory verification recommendations.
Add `-- --json` when a machine-readable bundle is needed, or `-- --compact` for
a shorter Markdown startup snapshot. It does not write files, call services,
run tests, or scan generated directories.

Agents can use `npm run agent:routine -- --list` to print standard command
sequences for common phase types. Routine output is guidance only; it does not
execute commands or replace review.

Agents can use `npm run agent:orchestrate -- --phase <number> --name <slug>
--routine <routine>` to print a complete phase plan that combines context,
routine, worktree, role, verification, safety, and handoff guidance. It is
print-only and does not execute commands, create worktrees, write files, or
commit.

Agents can use `npm run agent:phase:brief -- --phase <number> --name <slug>
--routine <routine>` to print a durable phase contract. Add `--write` only when
the phase should create `agent/phase-briefs/phase-XXX-name.md`; existing brief
files require `--force` to replace.

Agents can use `npm run agent:maintenance -- --report` to inspect the local
maintenance findings queue. Use `npm run agent:policy -- --report` or
`npm run agent:policy -- --id <id>` to classify each finding into an allowed
agent action mode before planning. Use `npm run agent:run-ledger -- --report`
or `--write` to record what a maintenance run inspected and what policy allowed.
Use `npm run agent:maintenance:run -- --report` for a single report-only
maintenance cycle that combines findings, policy, top actionable selection, and
the next recommended command.
Use `npm run agent:dispatch:plan -- --top --phase <number>` to turn the
policy-selected finding into a planning-only dispatch plan with approval
requirements, proposed worktree details, scope, and verification.
Use `npm run agent:finding:brief -- --id <id> --phase <number>` or `--top` to
turn an existing finding into a scoped remediation phase brief. Finding briefs
and run records are planning/operational artifacts only; they do not implement
the remediation or close the finding.

Future MCP and parallel-agent planning is documented separately:

- `docs/AGENT_MCP_STRATEGY.md`: read-only-first MCP policy and candidate matrix
- `docs/AGENT_PARALLEL_WORKFLOWS.md`: worktree-per-agent and report-only
  workflow policy
- `docs/AGENT_ORCHESTRATION.md`: print-only phase orchestration planner
- `docs/AGENT_PHASE_BRIEFS.md`: durable phase brief generator policy
- `docs/AGENT_MAINTENANCE.md`: local maintenance finding queue policy
- `docs/AGENT_MAINTENANCE_POLICY.md`: allowed action modes for findings
- `docs/AGENT_MAINTENANCE_RUNNER.md`: one-command report-only maintenance cycle
- `docs/AGENT_DISPATCH_PLANNER.md`: policy-aware finding dispatch plans
- `docs/AGENT_RUN_LEDGER.md`: durable records for maintenance inspection runs
- `docs/AGENT_FINDING_BRIEFS.md`: finding-to-phase brief generator policy

## Codex First

Codex is the primary agent workflow. Claude Code and Cursor are optional. Do not
copy broad local permission settings into repo policy. `AGENTS.md` is the source
of truth for this repo.

## What This Phase Does Not Add

Phase 53 does not add:

- autonomous background agents
- MCP servers
- CI/CD automation
- write actions
- production deployment automation
- test-fixing bots
- cross-repo orchestration
- live mic, TTS, notifications, or memory writes

## First-Class Artifacts

- `AGENTS.md`: agent policy and repo contract
- `docs/AGENT_*`: templates, roles, verification, safety docs
- `scripts/agent-preflight.mjs`: read-only repo context report
- `scripts/agent-status.mjs`: read-only status report with suggested next safe
  commands
- `scripts/agent-context.mjs`: read-only Markdown, compact Markdown, or JSON
  repo context bundle and repo map
- `scripts/agent-safety-scan.mjs`: advisory static scan for risky patterns,
  grouped by source/config risks and lower-severity documentation mentions
- `scripts/agent-eval.mjs`: read-only eval fixture validator for deterministic
  local guardrails under `evals/`
- `scripts/agent-verify.mjs`: print-first verification wrapper with
  `docs-only`, `site`, `desktop`, and `all` scopes
- `scripts/agent-routine.mjs`: print-only routine guide for composing existing
  agent commands
- `scripts/agent-orchestrate.mjs`: print-only planner for composing context,
  routine, worktree, verification, role, and handoff guidance
- `scripts/agent-phase-brief.mjs`: print-first phase contract generator; writes
  to `agent/phase-briefs/` only with `--write`
- `scripts/agent-maintenance.mjs`: read-only maintenance finding reporter
- `scripts/agent-policy.mjs`: read-only maintenance finding policy classifier
- `scripts/agent-run-ledger.mjs`: report-first maintenance run recorder; writes
  to `agent/runs/` only with `--write`
- `scripts/agent-maintenance-runner.mjs`: report-only maintenance cycle runner;
  writes cycle reports only with `--write`
- `scripts/agent-dispatch-plan.mjs`: planning-only maintenance dispatch planner;
  writes dispatch plans only with `--write`
- `scripts/agent-finding-brief.mjs`: print-first finding-to-phase brief
  generator; writes to `agent/phase-briefs/` only with `--write`
- `scripts/agent-phase-start.mjs`: print-first worktree command helper; `--run`
  can create a new worktree only when the repo is clean
- `scripts/agent-phase-handoff.mjs`: read-only handoff skeleton printer
- `docs/AGENT_MCP_STRATEGY.md`: optional future MCP strategy; scripts remain the
  source of truth
- `docs/AGENT_PARALLEL_WORKFLOWS.md`: future parallel-agent and report-only
  workflow strategy
- `docs/AGENT_WORKSPACE_LAYOUT.md`: supported Delta repo layouts and unrelated
  project exclusions

All scripts are local and advisory. `agent-preflight` and `agent-safety-scan`
are read-only. `agent-eval` validates JSON fixtures without calling backend,
browser, LLM, Supabase, mic, TTS, notification, or write paths. `agent-verify`
prints by default; `--run` executes only fixed commands from the selected scope
and should be used after the phase scope is clear.

`agent-phase-start` must never delete worktrees, clean files, commit, or touch
sibling repos. Worktree cleanup remains a manual, explicitly approved action.
`agent-routine` has no run mode in this phase and must not create worktrees,
commit, or execute commands.
