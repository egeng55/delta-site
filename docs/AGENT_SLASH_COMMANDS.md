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
4. verification scope and commands, using npm run agent:verify -- --<scope>
   where possible
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
Use npm run agent:verify -- --desktop to print the expected command set.
```
