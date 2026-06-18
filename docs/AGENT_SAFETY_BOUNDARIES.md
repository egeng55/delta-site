# Agent Safety Boundaries

These boundaries apply to agents working in `delta-site`.

## Never Touch Without Explicit Approval

- Supabase mutations or real database writes
- database migrations or schema changes
- backend runtime behavior
- mobile runtime behavior
- live mic, browser mic, or audio recording
- backend local TTS
- desktop notifications
- automatic browser speech
- memory writes
- wake word or always-on/background listening
- auth behavior
- billing/subscription behavior
- privacy, terms, cookies, or legal behavior
- production deployment behavior
- Electron arbitrary command execution

## High-Risk Files

Require explicit phase scope:

```text
src/context/AuthContext.tsx
src/app/(marketing)/privacy/page.tsx
src/app/(marketing)/terms/page.tsx
src/app/(marketing)/cookies/page.tsx
supabase/migrations/*
desktop/main.cjs
desktop/preload.cjs
desktop/fallback.html
```

## Side-Effect Patterns

Treat these as explicit-approval markers:

```text
ENABLE_LOCAL_TTS=true
ENABLE_DESKTOP_NOTIFICATIONS=true
--confirm-side-effects
--mode live
```

They may appear in documentation as warnings or terminal-only future commands.
Do not run them unless the current phase explicitly authorizes that exact
validation.

## Electron Rules

Keep:

```text
nodeIntegration: false
contextIsolation: true
sandbox: true
shell: false
```

Do not add:

```text
exec(
runCommand
nodeIntegration: true
contextIsolation: false
sandbox: false
```

## OS Console Rules

`/os` may display read-only state and ask read-only typed questions. It must not
start live input, send notifications, call backend TTS, write memory, mutate
Supabase, or imply always-on behavior exists.

## Advisory Scanner

`npm run agent:safety-scan` reports suspicious patterns. It is not a substitute
for review and intentionally exits 0 unless the script crashes.
