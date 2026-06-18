# Agent Phase Briefs

Phase briefs are durable planning artifacts for future Codex runs. They capture
the phase contract before implementation: objective, routine, scope, safety
boundaries, suggested roles, verification plan, and handoff expectations.

They are not autonomous execution plans. A brief does not authorize command
execution, worktree creation, product changes, commits, side-effect validation,
or cross-repo edits.

## Generate A Brief

Print a brief to stdout:

```bash
npm run agent:phase:brief -- --phase 64 --name repo-map --routine site
```

Write a brief file:

```bash
npm run agent:phase:brief -- --phase 64 --name repo-map --routine site --write
```

Parallel-plan example:

```bash
npm run agent:phase:brief -- --phase 65 --name parallel-docs --routine worktree-experiment --mode parallel-plan
```

## Write Behavior

The generator is print-only by default. It writes only when `--write` is passed.

Written briefs live under:

```text
agent/phase-briefs/phase-XXX-name.md
```

The script creates `agent/phase-briefs/` only when `--write` is used.

If the target file already exists, the script stops. Use `--force` only when
replacing that planning artifact is intentional.

Phase briefs generated from an existing worktree should still point at the
canonical worktree root:

```text
/Users/egeng/delta-worktrees
```

They should not infer nested roots under another worktree.

## Relationship To Orchestration

`agent:orchestrate` prints an ephemeral phase plan. `agent:phase:brief` turns
the same planning model into a durable markdown contract that can be checked in
or handed to the next Codex run.

`agent:finding:brief` starts from a maintenance finding instead of a manually
selected phase objective. It uses finding evidence, priority, repo scope, and
recommended next phase to generate a remediation brief, but it does not
implement the finding or mark it resolved.

Use both together when a phase needs durable context:

```bash
npm run agent:orchestrate -- --phase 64 --name repo-map --routine site
npm run agent:phase:brief -- --phase 64 --name repo-map --routine site --write
npm run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy --write
```

## Using Briefs With Codex

Future Codex runs should:

1. Read `AGENTS.md`.
2. Read the relevant `agent/phase-briefs/phase-XXX-name.md`.
3. Run the brief's context commands, especially `npm run agent:context`, to get
   the latest repo map and verification recommendation.
4. Confirm scope and forbidden actions.
5. Implement only the requested phase.
6. Run the brief's verification plan.
7. Use `npm run agent:phase:handoff -- --phase <number>` for handoff.

When a phase runs in a fresh worktree, record whether `npm ci` was needed before
tests/builds and whether the local build needed the inline public API URL
fallback:

```bash
NEXT_PUBLIC_DELTA_API_URL=http://127.0.0.1:8000 npm run build
```

Briefs are guidance and contract memory. They do not replace human review,
tests, lint, build, safety scan, or final git inspection.
