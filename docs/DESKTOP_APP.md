# Delta OS Desktop Shell

Phase 50 adds a local Mac desktop shell and narrow service manager for the Delta OS Console.

The shell uses Electron because Tauri is blocked in the current development environment: Rust and Cargo are not installed. The shell loads the existing `/os` cockpit from:

```text
http://127.0.0.1:3000/os
```

`/os` is local-development-only by default. The site middleware allows it for
local Next.js/Electron development, but production builds return a clear 403 so
the OS Console is not exposed as a public marketing route by accident.

Phase 51 redesigns `/os` to feel more like a Mac desktop command center: the
conversation workspace is primary, live readiness and Behavioral OS state are
secondary inspector context, and developer commands, proof data, and safety
details are grouped behind collapsible sections. The redesign does not add
microphone, TTS, notification, memory-write, wake-word, or background-listener
capabilities.

Phase 52 adds usability and explainability on top of that layout. `/os` now has
separate Chat, State, Readiness, Proof, and Developer views, keeps Chat as the
default view, presents Behavioral OS state in plain English before raw fields,
and answers visible state-term questions such as `good_call`, cooldown,
suppression, persisted state, intent, delivered count, and success rate without
requiring users to decode implementation labels. Developer commands and proof
metadata remain available, but they are secondary to normal conversation.

Phase 63 tightens the visual hierarchy again: the header is more app-like, the
conversation workspace is calmer, readiness/proof/command surfaces are more
compact, developer commands are collapsed by default, and the service-manager
fallback page uses the same restrained desktop aesthetic. No desktop runtime
capability changed.

Phase 64 makes a stronger app-layout decision: conversation is the product
surface, while system context lives in a compact right inspector. The inspector
uses State, Readiness, Proof, and Safety tabs so those details stay available
without crowding the chat. Developer commands, response metadata, proof reports,
and local session summary remain in a collapsed developer drawer. No desktop
runtime capability changed.

Phase 61 polishes usability without changing capabilities. The chat empty state
now explains the console in plain English, suggested prompts emphasize common
state and safety questions, inspector tabs include helper descriptions, and
common safety questions such as always-on listening or notification support are
answered locally as read-only explanations. Proof and Developer surfaces remain
available but secondary.

You can override that URL for local development:

```bash
DELTA_OS_CONSOLE_URL=http://127.0.0.1:3000/os npm run desktop:dev
```

## Safety model

The desktop shell may:

- open a Mac desktop window titled `Delta OS`
- load the existing OS Console URL
- show a local service-manager page if the console is unavailable
- start the allowlisted local backend development service
- start the allowlisted local Next.js site development service
- stop backend/site processes only if this desktop app launched them
- show in-memory service logs
- copy local start commands
- open the OS Console URL in the system browser
- refresh the shell window

The desktop shell does not:

- record audio
- run backend local TTS
- send desktop notifications
- write memory
- mutate Supabase
- run migrations
- create a wake word or always-on listener
- stop unrelated processes that were already running before the desktop app opened

The Electron window denies runtime permission requests, keeps `nodeIntegration` disabled, keeps `contextIsolation` enabled, and runs the renderer sandbox. The renderer does not receive arbitrary shell access. It can only call named IPC methods such as `startBackend`, `startSite`, `startAll`, `stopAll`, `getServiceStatus`, and `getServiceLogs`.

## Allowlisted service commands

The commands below reflect the current flat local layout. If the repos are
manually moved under `/Users/egeng/delta`, use the corresponding
`/Users/egeng/delta/delta-backend` and `/Users/egeng/delta/delta-site` paths.
See `docs/AGENT_WORKSPACE_LAYOUT.md`.

Backend:

```bash
cd /Users/egeng/delta-backend
set -a; source .env; set +a
.venv/bin/python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

The app implements this without exposing `.env` contents to the renderer. The main process reads `.env` and launches the fixed Python command with `child_process.spawn` and `shell: false`.

Site:

```bash
cd /Users/egeng/delta-site
npm run dev -- --hostname 127.0.0.1 --port 3000
```

If either service is already running outside the desktop app, the service manager reports it as external and does not stop it.

## Development flow

Open the desktop app:

```bash
cd /Users/egeng/delta-site
npm run desktop:dev
```

If backend/site are down, the service manager appears. Click `Start Services`, or run the commands manually:

```bash
cd /Users/egeng/delta-backend
set -a; source .env; set +a
.venv/bin/python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

```bash
cd /Users/egeng/delta-site
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Checks

Run the desktop shell syntax and safety checks:

```bash
cd /Users/egeng/delta-site
npm run desktop:check
```

Run the service-manager static smoke check directly:

```bash
cd /Users/egeng/delta-site
npm run desktop:smoke:services
```

Run a non-visual smoke launch. If the site is not running, this should load the offline fallback:

```bash
cd /Users/egeng/delta-site
npm run desktop:smoke
```

## Current limits

This is not a signed, notarized, or App Store-ready app. It does not bundle the Python backend into the app, does not manage production services, and does not package the Next.js site as offline static assets. It is a local developer desktop shell and service-manager foundation for Delta OS Console.
