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
- backend integration checks for `/behavioral-os/domains`
- optional LLM-judge experiments behind explicit approval
- background report-only eval runs
- CI integration
- multi-repo eval plans across `delta-backend`, `delta-site`, and
  `delta-mobile`

Do not add those in the current foundation without a dedicated phase brief.

Live evals are explicitly deferred. Future live eval work should define whether
it is checking rendered `/os` UI, local mocked conversation behavior, backend
read-only API behavior, or optional LLM-judge output. Each of those paths needs
its own approval and verification scope.

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
