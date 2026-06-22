# Local Domain Live Evals

This runbook explains how to run the backend readiness command and the site
live eval command together for the read-only Behavioral OS domain metadata
surface.

The workflow verifies the local contract for:

```text
GET /behavioral-os/domains
```

It does not evaluate LLM answer quality, render the `/os` browser UI, inspect
private user state, or prove production readiness.

## Purpose

Local domain live evals check that a local backend can expose authenticated,
read-only Behavioral OS domain metadata in the shape expected by the site.

The current expected domain is `late_caffeine`, Delta's first proof-backed
behavioral domain. The eval path exists to catch obvious local contract drift
before a human or future agent relies on `/os` domain metadata.

## What It Checks

The backend readiness command checks local backend readiness:

- repo status and HEAD
- domain registry file presence
- `late_caffeine` registration
- domain introspection imports
- status contract imports
- known domain/status tests
- `.env` file presence without reading values
- live-eval bearer token presence as yes/no only

The site live eval checks the backend metadata endpoint when it is reachable:

- `late_caffeine` is registered
- lifecycle metadata is present
- privacy metadata is present
- feedback capabilities are present
- expected late-caffeine feedback labels are present
- the payload normalizes through the site contract parser
- metadata-only and no-side-effect flags are preserved
- event taxonomy metadata is checked through current `event_types`, including
  `substance.caffeine_intake` for Late caffeine
- optional event taxonomy, feedback policy, and capability-matrix fields are
  validated when exposed and reported as `not_exposed` when absent

## What It Does Not Do

This workflow does not:

- mutate Supabase
- write product memory
- run live microphone capture
- run TTS
- send notifications
- run browser automation
- call external LLM APIs
- run LLM judges
- read private user state
- change intervention or feedback policy
- run in CI or normal `agent:eval`, test, lint, or build commands

## Terminal Setup

Most commands in this runbook exit when done. Only the backend server terminal
must stay open while live evals run.

- Backend readiness commands exit immediately.
- Site live eval commands exit immediately.
- Backend uvicorn must keep running in its own terminal while HTTP live evals
  run.
- Normal `agent:*`, test, lint, and build commands do not need persistent
  terminals unless they explicitly start a local service.

Use `Ctrl+C` in the backend uvicorn terminal to stop the server after testing.

## Backend Readiness

Static readiness, no HTTP calls:

```bash
cd /Users/egeng/delta-backend
.venv/bin/python scripts/live_eval_readiness.py
```

Compact static readiness:

```bash
cd /Users/egeng/delta-backend
.venv/bin/python scripts/live_eval_readiness.py --compact
```

Explicit HTTP probing, only after a backend server is already running:

```bash
cd /Users/egeng/delta-backend
.venv/bin/python scripts/live_eval_readiness.py --check-http
```

`--check-http` probes `/health` and `/behavioral-os/domains`. If the backend is
not running, it reports unavailable/skipped unless `--require-live` is passed.

## Start The Backend Manually

Start the backend in a dedicated terminal:

```bash
cd /Users/egeng/delta-backend
set -a; source .env; set +a
.venv/bin/python -m uvicorn api_server:app --host 127.0.0.1 --port 8000
```

Keep this terminal open while running live evals.

Do not paste secrets into logs, docs, prompts, commits, screenshots, or issue
comments. The command sources `.env` locally so the backend can authenticate
requests, but `.env` values must remain ignored and unprinted.

## Site Live Eval

Run the unauthenticated optional live eval:

```bash
cd /Users/egeng/delta-site
npm run agent:eval:live -- --backend-url http://127.0.0.1:8000
```

Parser-clean JSON:

```bash
cd /Users/egeng/delta-site
npm --silent run agent:eval:live -- --backend-url http://127.0.0.1:8000 --json
```

Optional durable result recording:

```bash
cd /Users/egeng/delta-site
npm run agent:eval:live -- --backend-url http://127.0.0.1:8000 --write
```

`--write` saves a timestamped Markdown report under `agent/runs/`. A report can
record pass, fail, or skipped states. It is evidence for local quality review,
not a CI gate and not a replacement for deterministic `agent:eval`.

JSON can be combined with report writing:

```bash
cd /Users/egeng/delta-site
npm --silent run agent:eval:live -- --backend-url http://127.0.0.1:8000 --json --write
```

Existing report paths are not overwritten unless `--force` is passed.

This command is optional and separate from deterministic evals:

```bash
npm run agent:eval
```

Normal `npm run agent:eval` remains deterministic and does not call the
backend.

The daily maintenance wrapper can include the same skip-safe live eval status
without making live evals required:

```bash
cd /Users/egeng/delta-site
npm run agent:daily:maintenance -- --include-live-eval
```

Without `--include-live-eval`, the daily wrapper only reports existing live eval
evidence from `agent/runs/`.

## Authenticated Mode

If the domain endpoint is protected and a developer intentionally has a local
bearer token, run:

```bash
cd /Users/egeng/delta-site
DELTA_LIVE_EVAL_BEARER_TOKEN=<token> npm run agent:eval:live -- --backend-url http://127.0.0.1:8000 --require-live
```

Authenticated report recording:

```bash
cd /Users/egeng/delta-site
DELTA_LIVE_EVAL_BEARER_TOKEN=<token> npm run agent:eval:live -- --backend-url http://127.0.0.1:8000 --require-live --write
```

Token rules:

- never commit tokens
- never paste tokens into docs, prompts, logs, or screenshots
- never print request headers
- scripts may report token presence only as yes/no
- a rejected token should be reported as `token_unauthorized` without echoing
  the token
- live eval reports must not store token values, request headers, or sensitive
  backend payloads

## Expected Outcomes

`backend_unavailable`
: The backend is not reachable. This is a successful skip for optional live
evals and a failure only with `--require-live`.

`protected_token_missing`
: The backend returned `401` or `403` and no
`DELTA_LIVE_EVAL_BEARER_TOKEN` was provided. This is expected for protected
local endpoints unless `--require-live` is used.

`token_unauthorized`
: A token was provided but the backend rejected it with `401` or `403`. The
token value must not appear in output.

`malformed_payload`
: The endpoint responded, but the payload did not normalize through the site
domain metadata contract parser.

`assertion_failure`
: Normalized metadata was present, but one or more read-only domain assertions
failed.

`live_domain_metadata_passed`
: The endpoint returned domain metadata satisfying the local read-only
assertions.

Coverage status fields:

- `domain_metadata`
- `event_taxonomy_metadata`
- `feedback_policy_metadata`
- `capability_matrix_metadata`

Each coverage area reports `passed`, `skipped`, `not_exposed`, or `failed`.
`not_exposed` is not a failure; it means an optional metadata area is not part
of the current endpoint response. `--require-live` requires the live backend
and auth path only, not optional metadata fields.

## Troubleshooting

Port 8000 already in use:

- confirm whether another backend instance is already running
- use the existing instance if it is the intended Delta backend
- otherwise stop the unrelated process outside this runbook before starting
  uvicorn

Backend unavailable:

- confirm the uvicorn terminal is still open
- confirm it is bound to `127.0.0.1:8000`
- run backend readiness with `--check-http`

Missing `.env`:

- backend readiness reports `.env` presence without reading values
- recreate local `.env` from secure local setup notes or provider dashboards
- do not commit `.env`

Protected endpoint without token:

- `protected_token_missing` is expected unless authenticated live verification
  is required
- use `DELTA_LIVE_EVAL_BEARER_TOKEN` only when intentionally available

Unauthorized token:

- confirm the token is current and belongs to the expected local auth context
- do not print or paste the token while debugging
- rerun with a new local token after manual auth refresh

Build or test failures:

- normal tests, lint, build, and deterministic evals are not part of the live
  eval path
- do not treat a live-eval skip as a build/test failure
- do not add live backend requirements to default test/build scripts

Report path already exists:

- rerun after the timestamp changes, or pass `--force` only when intentionally
  replacing a local report
- do not use `--force` to hide a failed or skipped result

## Future Work Deferred

Still deferred:

- Playwright `/os` UI evals
- browser transcript evals
- LLM judges
- CI or background live eval runners
- multi-domain live eval expansion beyond `late_caffeine`
- user-state or feedback-policy evals
- CI live eval gating
- production/service live checks
- exposed feedback-policy/capability-matrix metadata checks beyond
  `not_exposed` once a future backend phase intentionally exposes those fields

Each deferred path needs a separate phase with explicit safety boundaries.

For the current coverage inventory, see
`docs/LIVE_EVAL_COVERAGE_INVENTORY.md`.
