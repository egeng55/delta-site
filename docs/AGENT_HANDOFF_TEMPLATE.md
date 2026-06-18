# Agent Handoff Template

Use this when context is compacted, work is paused, or another agent must
continue.

```text
Current phase:

Goal:

Repos touched:

Files changed:

Files inspected but not changed:

Commands run:

Passing checks:

Failing checks or warnings:

Current git status:

Uncommitted changes:

Worktree state:
- Worktree path:
- Branch:
- Created by agent script:
- Cleanup requested:

Safety confirmations:
- Supabase mutation:
- Live mic:
- Backend TTS:
- Desktop notification:
- Memory writes:
- Backend behavior:
- Mobile behavior:

Important implementation details:

Known risks:

Next safest command:
```

## Handoff Rules

- Be concrete; include exact paths.
- Do not say "all tests passed" unless listing commands.
- Include process IDs or server status if local services are still running.
- Include worktree path, branch, commit, and integration status when work
  happened outside the primary checkout.
- State whether `npm ci` was needed in the worktree and whether build required
  `NEXT_PUBLIC_DELTA_API_URL=http://127.0.0.1:8000 npm run build`.
- Do not remove worktrees, delete branches, or clean files as part of handoff.
- Include the latest user request and any newer redirecting instruction.
