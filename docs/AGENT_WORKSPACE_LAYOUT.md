# Agent Workspace Layout

Delta product context includes only these repos:

- `delta-site`
- `delta-backend`
- `delta-mobile`

`morning-standup` is a separate project and must not be included in Delta
context bundles, MCP repo maps, multi-repo orchestration, worktree planning, or
agent verification summaries.

The unrelated project now lives outside the Delta parent at:

```text
/Users/egeng/morning-standup
```

Do not include it in Delta context bundles or future repo-map MCPs.

## Supported Layouts

Current flat layout:

```text
/Users/egeng/delta-site
/Users/egeng/delta-backend
/Users/egeng/delta-mobile
/Users/egeng/morning-standup  # unrelated; exclude from Delta context
```

Preferred grouped Delta product layout, after a manual move:

```text
/Users/egeng/delta/delta-site
/Users/egeng/delta/delta-backend
/Users/egeng/delta/delta-mobile
/Users/egeng/morning-standup
```

The agent scripts should support both layouts while the workspace is being
cleaned up.

## Manual Product-Repo Move Guidance

Morning-Standup has already been moved out of the old Delta parent path. Do not
move it from agent scripts.

Do not move product repos automatically from an agent script. If the Delta
product repos are moved into the grouped layout later, a human can review and
run commands like:

```bash
mkdir -p /Users/egeng/delta
mv /Users/egeng/delta-site /Users/egeng/delta/delta-site
mv /Users/egeng/delta-backend /Users/egeng/delta/delta-backend
mv /Users/egeng/delta-mobile /Users/egeng/delta/delta-mobile
```

Only run those commands after checking that the target paths do not already
exist and that no relevant repo has uncommitted work.

## Worktree Convention

Use one canonical external worktree root for both supported layouts:

```text
/Users/egeng/delta-worktrees/site-phase-XX-name
```

This keeps worktrees out of `delta-site`, out of the grouped product parent,
and away from unrelated projects. `agent:phase:start` still prints by default
and creates a worktree only with `--run`.

## Context Bundle Rule

Context bundles, repo-map MCPs, and multi-repo orchestration should scan only
the Delta product repos. Unrelated projects such as `/Users/egeng/morning-standup`
are out of scope unless a phase explicitly names them.

Use:

```bash
npm run agent:context
npm run agent:context -- --compact
npm run agent:context -- --json
```

The context script is read-only and script-first. It reports only Delta product
repo context and explicitly excludes Morning-Standup. A future repo-map MCP may
wrap its output, but the script remains the source of truth.
Use `npm --silent run agent:context -- --json` or
`node scripts/agent-context.mjs --json` when another tool needs parser-clean
JSON without npm's command banner.
