This is the Delta web app built with Next.js.

## Delta OS Console

The local command center lives at:

```text
http://127.0.0.1:3000/os
```

`/os` is intentionally a local developer cockpit. The middleware keeps it
available during local development and Electron usage, but production
deployments return a clear 403 instead of exposing the OS Console publicly by
accident. It is not a public marketing page.

The console supports multi-turn typed chat against the read-only backend
conversation API, a command palette, local session summary, proof report copy,
readiness refresh, command cards, recommended next-step logic, and user-triggered
browser TTS preview for assistant responses.

Recent UI passes redesigned the console into a calmer desktop app layout:
conversation is the primary workspace, Behavioral OS state and readiness are
secondary inspector context, and developer commands/proof details are grouped
behind secondary or collapsible sections. The current layout keeps the main chat
wide, moves State/Readiness/Proof/Safety into a compact right inspector, and
keeps developer commands in a collapsed drawer instead of the normal app flow.
It translates internal labels like `good_call`, cooldown, suppression, and
persisted state into plain English, and keeps raw metadata behind read-only
details. No runtime capability changed during these design passes.

The current usability pass makes the default chat state more self-explanatory:
Delta opens with a plain-English description of the console, suggested questions
focus on common state and safety clarifications, and safety answers such as
always-on listening or notifications are handled locally as read-only
explanations. Proof and Developer details remain secondary.

All OS Console chat/session state is browser-local. The page does not start
microphone capture, backend local TTS, desktop notifications, background
listening, wake word, automatic memory writes, or Supabase mutations. Browser
speech playback uses `window.speechSynthesis` only after the user clicks Speak.
Browser mic remains disabled/coming soon.

The legacy `/api/chat` site proxy is not public. It now requires an incoming
`Authorization` bearer token and forwards that token to the backend `/chat`
endpoint. The OS Console continues to use the read-only `/conversation/turn`
backend API directly for local development.

## Delta OS Desktop Shell

Phase 50 adds a local Mac desktop shell foundation for the OS Console. The shell
uses Electron because Tauri is blocked in this environment without Rust/Cargo.
It loads the existing local console URL:

```text
http://127.0.0.1:3000/os
```

If the console is unavailable, it shows a local service manager. The service
manager can start the allowlisted local backend and Next.js site development
services, show service readiness, display in-memory logs, and stop only
processes that the desktop app launched.

Development flow:

```bash
cd /Users/egeng/delta-backend
set -a; source .env; set +a
.venv/bin/python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

```bash
cd /Users/egeng/delta-site
npm run dev -- --hostname 127.0.0.1 --port 3000
npm run desktop:dev
```

You can also open the desktop app first and click `Start Services` from the
service manager. The renderer cannot send arbitrary shell commands; it can only
invoke named service actions exposed by the preload bridge.

Desktop safety checks:

```bash
npm run desktop:check
npm run desktop:smoke
npm run desktop:smoke:services
```

The desktop shell blocks runtime permission requests and does not record audio,
run TTS, send notifications, write memory, mutate Supabase, create a wake word,
or run an always-on listener. It stops only backend/site child processes that it
started. It is not signed, notarized, packaged, or App Store-ready.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
