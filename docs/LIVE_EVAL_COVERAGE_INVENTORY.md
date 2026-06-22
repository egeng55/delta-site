# Live Eval Coverage Inventory

Last updated: June 22, 2026.

This inventory reconciles current Delta live eval coverage. It is documentation
for local humans and future agents. It does not add browser automation, LLM
judges, CI live requirements, Supabase mutation, notifications, TTS, live mic,
or product-memory writes.

## Current Coverage Summary

Delta has two eval layers in `delta-site`:

- deterministic fixture evals through `npm run agent:eval`
- optional local live domain metadata evals through
  `npm run agent:eval:live`

The deterministic layer is always local and service-free. The live layer is
also local-only, opt-in, skip-safe, and not part of default tests, lint, build,
or CI.

## Deterministic Eval Coverage

`npm run agent:eval` validates fixture structure and deterministic
sample-response assertions under `evals/`.

Current fixture coverage includes:

- OS Console explainability for terms such as `good_call` and cooldown
- OS Console safety language for always-on listening, notifications, memory
  writes, and voice/TTS overclaims
- Behavioral OS domain metadata language for Late caffeine, proof-backed
  status, metadata-only behavior, no user state, and no mutation
- agent handoff quality expectations

This command does not call the backend, render `/os`, use browser automation,
call LLMs, or mutate anything.

## Optional Live Eval Coverage

`npm run agent:eval:live` checks:

```text
GET /behavioral-os/domains
```

when a local backend is reachable and authorized. It checks:

- expected domain exists, default `late_caffeine`
- lifecycle metadata is present
- privacy metadata is present
- feedback capabilities are present
- expected late-caffeine feedback capabilities are present
- metadata-only/no-user-state/no-side-effect flags are preserved
- event taxonomy metadata through `event_types` when available
- optional event taxonomy fields when exposed later
- optional feedback policy metadata fields when exposed later
- optional capability matrix metadata fields when exposed later

Current backend domain introspection exposes `event_types`, so live eval can
check that Late caffeine includes `substance.caffeine_intake`. It does not yet
expose capability-matrix event categories, feedback policy signals, feedback
learning modes, or capability-matrix readiness fields. Those optional areas
are reported as `not_exposed`, not failed.

## Coverage Status Fields

Live eval JSON and Markdown reports include coverage sections:

- `domain_metadata`
- `event_taxonomy_metadata`
- `feedback_policy_metadata`
- `capability_matrix_metadata`

Possible statuses:

- `passed`: the area was exposed and assertions passed.
- `skipped`: the live endpoint was unavailable or protected before assertions.
- `not_exposed`: optional metadata was not present in the current endpoint
  response and is not required.
- `failed`: metadata was exposed but malformed, unsafe, or missing required
  values.

`--require-live` only requires backend/auth availability. It does not require
optional metadata fields that the backend does not currently expose.

## Backend Readiness Coverage

Backend readiness is provided by:

```bash
cd /Users/egeng/delta-backend
.venv/bin/python scripts/live_eval_readiness.py --compact
```

The command is read-only and static by default. It reports repo status, domain
registry/import readiness, status contract imports, recommended test commands,
`.env` file presence without reading values, and token presence as yes/no.
HTTP checks require explicit `--check-http`.

## Report Recording

Optional local report recording is available with:

```bash
npm run agent:eval:live -- --write
```

Reports are written under `agent/runs/` and may record pass, fail, or skipped
states. Reports include coverage status, classification, assertions checked,
token presence as yes/no, and side-effect flags. They never store token values,
request headers, or sensitive payload dumps.

## Current Gaps

Current intentional gaps:

- browser `/os` UI live evals
- Playwright or other browser automation
- LLM judges
- CI live eval gating
- production/service live checks
- user-state live checks
- feedback mutation live checks
- provider-ingestion live checks
- multi-domain live checks beyond `late_caffeine`

These gaps are intentionally deferred. They should not be added without a
separate phase, explicit safety boundaries, and clear verification scope.

## Safety Posture

Live evals must remain:

- optional
- local-only
- read-only
- skip-safe when services are unavailable
- token-safe
- excluded from default tests/build/lint/CI

They must not start services automatically, mutate Supabase, use live mic,
run TTS, send notifications, call provider actions, call external LLM APIs, or
write product memory.
