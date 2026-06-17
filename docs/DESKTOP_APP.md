# Delta OS Desktop Shell

Phase 50 adds a local Mac desktop shell and narrow service manager for the Delta OS Console.

The shell uses Electron because Tauri is blocked in the current development environment: Rust and Cargo are not installed. The shell loads the existing `/os` cockpit from:

```text
http://127.0.0.1:3000/os
```

Phase 51 redesigns `/os` to feel more like a Mac desktop command center: the
conversation workspace is primary, live readiness and Behavioral OS state are
secondary inspector context, and developer commands, proof data, and safety
details are grouped behind collapsible sections. The redesign does not add
microphone, TTS, notification, memory-write, wake-word, or background-listener
capabilities.

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
