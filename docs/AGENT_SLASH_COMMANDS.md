# Slash-Command Style Prompts

These are prompt templates for agents. They are not executable commands.

## /phase-brief

```text
Read AGENTS.md, docs/AGENTIC_DEVELOPMENT.md, and docs/AGENT_PHASE_BRIEFS.md.
Run npm run agent:status if repo state is unclear.
Run npm run agent:context when a structured repo map is useful.
Run npm run agent:routine -- --list if the phase type is unclear.
Generate a printed phase brief:
npm run agent:phase:brief -- --phase <number> --name <slug> --routine <routine>

Write a durable brief only when requested:
npm run agent:phase:brief -- --phase <number> --name <slug> --routine <routine> --write

Inspect the requested files.
Produce:
1. repo scope
2. likely files
3. forbidden actions
4. verification scope and commands, using npm run agent:verify -- --<scope>
   where possible
5. commit plan
Do not edit product files yet. Do not overwrite existing brief files without
explicit `--force`.
```

## /routine

```text
Read docs/AGENT_ROUTINES.md.
Print available routines:
npm run agent:routine -- --list

Print one routine:
npm run agent:routine -- --routine <name>

For worktree planning:
npm run agent:routine -- --routine worktree-experiment --phase <number> --name <slug>

Do not execute commands just because a routine prints them.
```

## /orchestrate

```text
Read docs/AGENT_ORCHESTRATION.md.
Print a complete phase plan:
npm run agent:orchestrate -- --phase <number> --name <slug> --routine <routine>

For parallel planning:
npm run agent:orchestrate -- --phase <number> --name <slug> --routine worktree-experiment --mode parallel-plan

For parser-clean JSON:
npm --silent run agent:orchestrate -- --phase <number> --name <slug> --routine <routine> --json

Treat the output as advisory. Do not execute commands, create worktrees, write
phase files, or commit unless the phase explicitly asks.
```

## /context

```text
Print the read-only repo context bundle:
npm run agent:context

For machine-readable output:
npm run agent:context -- --json
npm --silent run agent:context -- --json

Use this before broad phases, repo-map work, MCP strategy work, and handoffs
that need structured context. Do not write bundle files or include
/Users/egeng/morning-standup in Delta context.
```

## /mcp-strategy

```text
Read docs/AGENT_MCP_STRATEGY.md and docs/AGENT_WORKSPACE_LAYOUT.md.
Classify the requested MCP idea as implement soon, document only, defer, or
avoid.
Prefer existing scripts when they are enough.
Keep Delta context limited to delta-site, delta-backend, and delta-mobile.
Do not implement MCP servers, command execution, database access, desktop
side effects, or autonomous commits unless a later phase explicitly asks.
```

## /parallel-plan

```text
Read docs/AGENT_PARALLEL_WORKFLOWS.md, docs/AGENT_WORKTREE_STRATEGY.md, and
docs/AGENT_WORKSPACE_LAYOUT.md.
Define one repo, one worktree, one role, and one verification scope per agent.
Keep final integration sequential.
Do not create worktrees, background agents, or autonomous writers unless the
phase explicitly asks.
Do not include /Users/egeng/morning-standup in Delta context.
```

## /phase-start

```text
Read docs/AGENT_WORKTREE_STRATEGY.md.
If a worktree is useful, preview it first:
npm run agent:phase:start -- --phase <number> --name <slug> --print

Only create a worktree if explicitly requested:
npm run agent:phase:start -- --phase <number> --name <slug> --run

Do not delete worktrees, clean files, commit, or touch backend/mobile.
```

## /safe-site-change

```text
Implement only the requested delta-site change.
Do not touch backend or mobile.
Do not enable mic, TTS, notifications, Supabase writes, memory writes, wake word,
or always-on behavior.
Run the verification matrix for touched files.
Use npm run agent:verify -- --site to print the baseline site checks.
```

## /verify

```text
Choose one verification scope:
- docs-only
- site
- desktop
- all

First print commands:
npm run agent:verify -- --<scope>

Only execute after confirming the scope:
npm run agent:verify -- --<scope> --run

Remember that agent:safety-scan is advisory. Review source/config findings
before documentation mentions.
Run npm run agent:eval when the phase touches /os explainability, safety copy,
handoff templates, or eval fixtures.
```

## /eval-review

```text
Read docs/AGENT_EVALS.md and the relevant evals/**/*.json fixtures.
Confirm the fixtures match the intended /os explainability, safety-language, or
handoff behavior.
Run npm run agent:eval.
Do not call external LLM APIs, live backend services, browser automation,
Supabase, mic, TTS, notifications, or write paths.
```

## /test-fix-loop

```text
Inspect the failing test and covered behavior.
Classify root cause:
- product bug
- stale test
- brittle assertion
- environment issue
Make the smallest safe fix.
Run focused test, then broader suite.
```

## /safety-review

```text
Review the diff for:
- Supabase mutation
- schema/migration changes
- auth/legal/billing changes
- Electron permission broadening
- arbitrary shell execution
- mic/TTS/notification enablement
- memory writes
Report findings before commit.
Use npm run agent:safety-scan as an advisory input, not as a replacement for
human diff review.
Use npm run agent:eval as an advisory fixture check when /os response language
or agent handoff expectations changed.
```

## /handoff

```text
Use docs/AGENT_HANDOFF_TEMPLATE.md.
Optionally run npm run agent:phase:handoff -- --phase <number> for a skeleton.
Include files changed, tests run, current git status, warnings, safety
confirmations, and next safest command.
```

## /ui-smoke

```text
For /os or Electron UI changes:
1. run site tests/lint/build
2. run desktop checks
3. if local services are available, open Electron
4. verify Chat is primary and safety labels remain visible
5. do not click Speak response, mic, notification, or write actions unless
   explicitly approved
Use npm run agent:verify -- --desktop to print the expected command set.
```
