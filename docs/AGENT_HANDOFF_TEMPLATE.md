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
- Include the latest user request and any newer redirecting instruction.
