# Agent Workspace Layout

Delta product context includes only these repos:

- `delta-site`
- `delta-backend`
- `delta-mobile`

`morning-standup` is a separate project and must not be included in Delta
context bundles, MCP repo maps, multi-repo orchestration, worktree planning, or
agent verification summaries.

The folder may still appear locally as `/Users/egeng/delta/Morning-Standup`
until a human performs the filesystem cleanup. Treat that folder as unrelated
even while it is physically under `/Users/egeng/delta`.

## Supported Layouts

Current flat layout:

```text
/Users/egeng/delta-site
/Users/egeng/delta-backend
/Users/egeng/delta-mobile
/Users/egeng/delta/Morning-Standup  # unrelated; exclude from Delta context
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

## Manual Move Guidance

Do not move repos automatically from an agent script. If the workspace has not
been moved yet, a human can review and run commands like:

```bash
# First move the unrelated project out of the Delta product parent if present.
mv /Users/egeng/delta/Morning-Standup /Users/egeng/morning-standup

# Then move the Delta product repos under the Delta parent.
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

Future context bundles, repo-map MCPs, and multi-repo orchestration should scan
only the Delta product repos. Unrelated projects under `/Users/egeng/delta` or
nearby folders are out of scope unless a phase explicitly names them.
