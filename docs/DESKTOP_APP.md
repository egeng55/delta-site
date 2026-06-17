# Delta OS Desktop Shell

Phase 49 adds a local Mac desktop shell for the Delta OS Console.

The shell uses Electron because Tauri is blocked in the current development environment: Rust and Cargo are not installed. The shell is intentionally narrow. It loads the existing `/os` cockpit from:

```text
http://127.0.0.1:3000/os
```

You can override that URL for local development:

```bash
DELTA_OS_CONSOLE_URL=http://127.0.0.1:3000/os npm run desktop:dev
```

## Safety model

The desktop shell may:

- open a Mac desktop window titled `Delta OS`
- load the existing OS Console URL
- show a local fallback page if the console is unavailable
- copy local start commands
- open the OS Console URL in the system browser
- refresh the shell window

The desktop shell does not:

- start the backend
- start the Next.js site
- record audio
- run backend local TTS
- send desktop notifications
- write memory
- mutate Supabase
- run migrations
- create a wake word or always-on listener

The Electron window denies runtime permission requests, keeps `nodeIntegration` disabled, keeps `contextIsolation` enabled, and runs the renderer sandbox.

## Development flow

Terminal 1:

```bash
cd /Users/egeng/delta-backend
set -a; source .env; set +a
.venv/bin/python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

Terminal 2:

```bash
cd /Users/egeng/delta-site
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Terminal 3:

```bash
cd /Users/egeng/delta-site
npm run desktop:dev
```

## Checks

Run the desktop shell syntax and safety checks:

```bash
cd /Users/egeng/delta-site
npm run desktop:check
```

Run a non-visual smoke launch. If the site is not running, this should load the offline fallback:

```bash
cd /Users/egeng/delta-site
npm run desktop:smoke
```

## Current limits

This is not a signed, notarized, or App Store-ready app. It does not bundle the Python backend, it does not manage long-running services, and it does not package the Next.js site as offline static assets. It is a local developer desktop shell foundation for Delta OS Console.
