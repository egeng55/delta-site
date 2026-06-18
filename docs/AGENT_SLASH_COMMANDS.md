# Slash-Command Style Prompts

These are prompt templates for agents. They are not executable commands.

## /phase-brief

```text
Read AGENTS.md and docs/AGENTIC_DEVELOPMENT.md.
Inspect the requested files.
Produce:
1. repo scope
2. likely files
3. forbidden actions
4. verification commands
5. commit plan
Do not edit files yet.
```

## /safe-site-change

```text
Implement only the requested delta-site change.
Do not touch backend or mobile.
Do not enable mic, TTS, notifications, Supabase writes, memory writes, wake word,
or always-on behavior.
Run the verification matrix for touched files.
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
```

## /handoff

```text
Use docs/AGENT_HANDOFF_TEMPLATE.md.
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
```
