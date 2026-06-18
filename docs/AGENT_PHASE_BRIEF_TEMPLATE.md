# Agent Phase Brief Template

Use this before implementation.

```text
Phase:

Objective:

Repos in scope:
- delta-site:
- delta-backend:
- delta-mobile:

Files likely in scope:

Files explicitly out of scope:

Worktree plan:
- Use worktree: yes/no
- Worktree path:
- Branch name:
- Preview command:

Safety constraints:
- No Supabase mutation.
- No live mic.
- No TTS.
- No notifications.
- No memory writes.
- No auth/billing/legal/schema/deployment changes unless explicitly approved.

Expected implementation shape:

Verification plan:

Commit plan:

Stop conditions:

Open questions:
```

## Briefing Rules

- Prefer one repo per phase.
- If backend or mobile are only context, say read-only context.
- Identify high-risk files before editing.
- For larger or parallelizable phases, preview a worktree with
  `npm run agent:phase:start -- --phase <number> --name <slug> --print`.
- Creating a worktree requires `--run` and a clean repo.
- If side effects are requested, list exact command and confirmation required.
- If verification cannot run, say why before committing.
