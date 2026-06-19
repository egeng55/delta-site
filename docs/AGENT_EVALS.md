# Agent Eval Fixtures

Delta site evals are deterministic fixtures for future coding agents. They
describe important expected behavior, especially `/os` explainability and safety
language, without running a live backend, browser automation, external LLM, or
side-effect path.

## Why Evals Exist

The OS Console is now a working local command center, but it has a few behaviors
that are easy to regress:

- visible internal labels should be explained in plain English
- safety answers should not overclaim unsupported voice, notification, memory,
  or always-on capabilities
- handoffs should preserve repo boundaries and verification results

Eval fixtures make those expectations explicit for Codex and other optional
tools. They are a review aid and regression guardrail, not autonomous
development logic.

## What They Protect

Current fixtures cover:

- `/os` explanations for `good_call`, cooldown, suppression, persisted state,
  intent, and late-caffeine learning
- `/os` safety answers about always-on listening, notifications, memory writes,
  and voice enablement
- `/os` domain metadata answers that identify Late caffeine as the current
  proof-backed Behavioral OS domain while preserving the metadata-only,
  no-user-state, no-mutation boundary
- agent handoff quality for site-only phases, cross-repo boundaries, and safety
  scan reporting

These fixtures should stay aligned with the product posture:

- `/os` is read-only
- no automatic memory writes
- no live browser mic
- no backend TTS from the browser
- no desktop notification from `/os`
- no wake word or always-on listening

## Deterministic Now

Run:

```bash
npm run agent:eval
```

The runner validates two local, deterministic layers.

Structure validation checks that fixture JSON files are well formed and contain
the required fields:

- `id`
- `category`
- `prompt`
- `expected_behavior`
- `must_include`
- `must_not_include`
- `notes`

Sample-response validation runs when a fixture includes `sample_response`.
For those fixtures, the runner checks:

- every `must_include` string appears in the sample response
- no `must_not_include` string appears in the sample response
- optional fields such as `sample_response` and `expected_policy` are non-empty
  strings when present

It prints fixture counts by file and category plus the number of sample
responses and sample assertions checked. It does not call the real OS Console,
the backend, a browser, Supabase, or an external LLM.

## Optional Local Live Eval

Phase 90 adds an explicit local live eval skeleton, and Phase 91 hardens the
authenticated local path:

```bash
npm run agent:eval:live
```

This command is separate from `npm run agent:eval`. It is local-only,
read-only, and opt-in. It does not start services, render `/os`, run browser
automation, call LLM APIs, mutate files, mutate Supabase, send notifications,
run TTS, open the microphone, or write memory.

The live skeleton checks only the backend domain metadata endpoint:

```text
GET ${NEXT_PUBLIC_DELTA_API_URL || http://127.0.0.1:8000}/behavioral-os/domains
```

When the endpoint returns metadata, the script normalizes the response and
asserts that:

- the expected domain exists, defaulting to `late_caffeine`
- lifecycle and privacy fields are present
- feedback capabilities are present
- `late_caffeine` includes the expected feedback labels when it is the selected
  domain
- the response says no user state is included
- side-effect flags for Supabase, memory writes, notifications, TTS, and live
  mic are false

The selected domain can be overridden for future local metadata checks:

```bash
npm run agent:eval:live -- --expected-domain late_caffeine
```

Output distinguishes these local states:

- `backend_unavailable`: the local backend is not reachable.
- `protected_token_missing`: the endpoint returned `401` or `403` and no
  `DELTA_LIVE_EVAL_BEARER_TOKEN` was provided.
- `token_unauthorized`: a token was provided but the endpoint returned `401` or
  `403`.
- `malformed_payload`: the endpoint responded, but the payload did not normalize
  through the site contract parser.
- `assertion_failure`: normalized metadata was present, but a read-only domain
  assertion failed.
- `live_domain_metadata_passed`: the endpoint returned metadata satisfying the
  read-only domain assertions.

If the backend is unavailable, the command reports `skipped` and exits
successfully by default. If the endpoint returns `401` or `403` without a token,
the command treats that as expected protected behavior and reports
`protected_token_missing` as a skipped state.

Use `--require-live` only when a local backend and valid auth context are
intentionally available:

```bash
npm run agent:eval:live -- --require-live
```

For authenticated local checks, provide a bearer token through the environment:

```bash
DELTA_LIVE_EVAL_BEARER_TOKEN=<do-not-print-token> npm run agent:eval:live -- --require-live
```

The script never prints token values, request headers, or auth payloads. It
reports only whether a token was provided. If a token is rejected, output says
`token_unauthorized` without echoing the token.

Parser-clean JSON is available for future report-only automation:

```bash
npm --silent run agent:eval:live -- --json
```

JSON output distinguishes `passed`, `skipped`, and `failed` and includes the
same classification labels as text output. Skips are for unavailable/protected
local services. Failures are reserved for rejected provided tokens, assertion
failures, malformed responses, or required live checks that cannot reach a valid
local endpoint.

## Domain Metadata Fixtures

`evals/os-console/domain-metadata.json` protects the Phase 86 domain-aware
console behavior with deterministic local examples. These fixtures assert that
domain metadata language:

- names the Behavioral OS domains surface clearly
- identifies Late caffeine as the current proof-backed domain
- explains proof-backed status without claiming all domains are production-ready
- states that metadata display reads no user state
- states that metadata display performs no memory write, feedback mutation,
  Supabase mutation, notification, TTS, voice, or intervention-policy action
- handles unavailable metadata as a graceful unavailable state instead of
  inventing user state

These checks validate only fixture text and sample responses. They do not call
`/behavioral-os/domains`, do not render `/os`, and do not prove backend
availability.

## Deferred

Later phases may add:

- browser-level `/os` transcript checks
- broader authenticated backend integration checks beyond the local domain
  metadata skeleton
- optional LLM-judge experiments behind explicit approval
- background report-only eval runs
- CI integration
- multi-repo eval plans across `delta-backend`, `delta-site`, and
  `delta-mobile`

Do not add those in the current foundation without a dedicated phase brief.

Broader live evals remain explicitly deferred. Future work should define
whether it is checking rendered `/os` UI, local mocked conversation behavior,
authenticated backend read-only API behavior beyond domain metadata, browser
automation, or optional LLM-judge output. Each of those paths needs its own
approval and verification scope.

## How Future Agents Should Use Fixtures

Before changing `/os` explainability, conversation copy, safety language, or
agent handoff behavior:

1. Read the relevant fixture file under `evals/`.
2. Confirm the intended behavior in plain English.
3. Update Jest tests when product behavior changes.
4. Update fixtures when expectations intentionally change.
5. Run `npm run agent:eval`.
6. Run the normal verification scope from `docs/AGENT_VERIFICATION_MATRIX.md`.

Fixtures are advisory. Passing `agent:eval` does not prove product behavior; it
proves the eval definitions are structurally valid and that any included sample
responses satisfy deterministic local assertions.

## Evaluating OS Console Explainability

Good `/os` explanations should:

- answer the exact term or safety question asked
- translate raw labels into human language
- connect the answer to current visible state when available
- state read-only/no-write posture when relevant
- avoid generic capability answers for direct clarification questions

Poor explanations:

- repeat only raw labels such as `good_call` or `state: persisted`
- imply unsupported background listening or write behavior
- claim notifications, TTS, or memory writes happened from the browser console
- hide whether data is fallback/demo or persisted/read-only

Use fixtures as examples of the desired behavior, then verify real UI behavior
with Jest and manual smoke checks when product code changes.
