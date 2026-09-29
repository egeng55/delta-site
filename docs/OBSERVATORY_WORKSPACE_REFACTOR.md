# Delta workspace refactor

Status: Phase 5 lifecycle implementation delivered locally. Live sign-in activation and hosted connectivity are deferred.
Inspected 2026-09-29: site main d6f4052; agent baseline checkout 35cad02.
These revisions identify inspected source, not running or deployed revisions.

## Product outcome

Delta Site is the public product presence and authenticated operating home.
An owner can request work, observe its execution, inspect evidence, and continue
it without losing the relationship between tasks, changes, tests, and costs.
Developers receive explicitly scoped access. Existing owner checks remain in force
until a separately tested role model exists; signing in alone grants no runtime authority.

## Phase 1: source inventory

Paths below are relative to the named repository. Agent paths were inspected in
delta-worktrees/delta-baseline-20260924, not the older dirty working checkout.

| Source | Existing implementation | Connection and limitation |
| --- | --- | --- |
| Architecture/capabilities | agent config/workspace-architecture.json, config/capabilities.json, config/runtime-tools.json | Existing site scripts/observatory-export.cjs projects committed main refs; does not describe deployment or live readiness. |
| Site report | site src/lib/observatoryServer.ts, src/lib/observatory-contract.cjs | Owner-verified, validated private file; no continuous source or runtime feed. |
| Branches/worktrees | agent src/system-state/integration-graph.mjs | Existing Git comparison and dirty-work classification; adapt read-only output, do not auto-merge or infer intent from path heuristics. |
| Runtime status | agent src/runtime/server.mjs GET /v1/operator/status | Authenticated process status, availability and command metrics; revision attestation still needs an explicit contract. |
| Commands/results | same server POST /v1/commands, GET /v1/sessions/:id | Existing execution path and streamed events; sessions are process-memory maps. Browser results are a transport-specific projection. |
| Operational visibility | agent src/runtime/operator-visibility.mjs | Last 100 commands in memory; eviction disclosed, external activity unknown, costs unknown. Not a durable all-system history. |
| Event lifecycle | agent src/events/hq-projection.mjs and store.mjs | Existing sanitized HQ projection includes producer, deliveries and lifecycle; reuse rather than create a second event bus. |
| Engineering | agent src/missions/engineering-mission.mjs, src/runtime/engineering-progress.mjs | Existing mission control and progress evidence; normalize references to task/run/worktree and expose supported actions only. |
| Approval authority | agent src/session/broker.mjs and owner-session.mjs | Preserve exact-action approval binding; HTTP command callers cannot submit arbitrary approvals. UI observation and UI decision authority are separate integrations. |
| Backend spending | backend provider_limits.py | Candidate source for reservations/settlements and limits; source located, live storage/configuration and billing coverage not yet qualified. |
| Graphs | site components/observatory/ArchitectureGraph.tsx; scripts/observatory-export.cjs | Systems/capabilities already supported; optional Graphify modules importer exists. Original Graphify export not located in inspected workspace paths. |

Do not read arbitrary file paths from browser input. Each adapter reads a fixed,
configured source and returns a bounded, redacted projection. Missing sources
produce unavailable/stale states, never synthetic fallback values in live views.

## Connection design

```mermaid
flowchart LR
  Git[Git refs and worktrees] --> Read[Read-only source adapters]
  Registry[Architecture and capability registries] --> Read
  Runtime[Authenticated runtime] --> Events[Existing events and mission records]
  Events --> Projection[Versioned workspace projection]
  Read --> Projection
  Costs[Usage and spending records] --> Projection
  Projection --> Gate[Site owner and role boundary]
  Gate --> UI[Workspace and architecture explorer]
  UI --> Commands[Scoped command adapter]
  Commands --> Runtime
  Runtime --> Approval[Existing approval authority]
```

The local runtime currently uses loopback authentication and strict origin checks.
A hosted site cannot simply call the owner's localhost or inherit its credentials.
First delivery targets a local site server with a configured, authenticated runtime
adapter. Hosted connectivity requires its own deployment design; do not weaken
origin checks, publish the daemon, or place signing credentials in browser storage.

## Phase 2: shared contracts and connectors

Reuse native identifiers; preserve source-specific IDs in references. Define a
versioned read model for task, run, event, repository revision, worktree, artifact,
verification, approval request, capability availability and cost observation.

Every observation carries source, observed_at, scope, and freshness. Revisions
distinguish branch head, checkout state, integrated main, running build and deployed
build. Unknown identities remain unknown. Never join runs by title alone.

Separate token usage, estimated cost, settled provider cost and billing totals.
Include currency, accounting interval, provider, coverage and reservation state.
Prevent double-counting when the same request appears in multiple ledgers.

Acceptance: disconnected sources, stale timestamps, restart, duplicate events,
missing links and partial billing coverage render correctly. Cross-role reads and
writes are rejected server-side. No new execution authority comes from a read adapter.

## Phase 3: workspace shell

- Home: active work, recent results, attention queue, health and budget summaries.
- Work: composer, tasks, evidence, approvals, failures and supported continuation.
- System: architecture, capabilities, connections and service readiness.
- Engineering: branches, worktrees, changes, verification and integration status.
- Analytics: performance, reliability, usage and spending with coverage labels.

Persistent composer; consistent detail panel; shareable authorized entity URLs.
Keep deep evidence expandable. On small screens prioritize current task and result.
Restore the full request context from history: repository, capability, arguments,
session and execution mode. Distinguish viewing an old run from continuing it.

Acceptance: navigate task to branch to test evidence and back without losing state;
empty, failed, loading and disconnected views have clear next actions.

## Phase 4: architecture explorer

Reuse registry and Graphify data adapters; redesign interaction around progressive
disclosure: domain -> system -> capability -> handler/module. Default to a small,
readable overview. Support search, neighborhood expansion, reverse dependencies,
revision comparison and a keyboard-accessible list equivalent.

Views: declared structure, observed execution, source changes, health and usage.
Static edges never animate as execution without a correlated event. Clicking a node
opens provenance, source revision, associated runs, verification and available costs.
Graphify is supplementary static evidence, not the authoritative runtime graph.

Acceptance: identify an owning system and trace a failed run without examining the
whole graph; render missing mappings and stale module exports explicitly.

## Phase 5: complete live workflow

Submit a bounded task through the existing executor; display correlated events,
actual result and verification. Preserve history after restart using the owning
runtime's existing persistence mechanisms where suitable. Add missing persistence
only after auditing those mechanisms. Connect approvals through existing authority.
Expose continuation/cancellation only when the controller implements them.

Acceptance scenario: submit once, see progress, inspect any blocked approval,
complete through authorized control, inspect changes/tests/result, reload and
recover the run, then explicitly continue it. Duplicate clicks/reconnects must not
create duplicate work. A failed test stays visible; retries obey existing caps.
Start with a deterministic read-only task, then one bounded engineering task.
Paid execution remains separately budgeted; no automatic broad qualification runs.

## Phase 6: presentation and broader rollout

Apply consistent typography, layout and interaction patterns. Unicorn animation
is a separately scoped aesthetic integration after selecting the intended product
and confirming its runtime/accessibility requirements. Keep reduced-motion support
and avoid decorative movement in dense evidence views.

Expand connector coverage after the complete workflow passes. Keep public marketing
separate from private operational data. Hosted deployment is a distinct milestone
with authenticated connectivity, retention and measured operating costs verified.

## Delivery order and completion rule

Phase 2 begins with one read-only overview contract spanning source revisions,
capability availability and process health. Then deliver the workspace shell and
graph increment, followed by the complete task journey and presentation pass.
Each increment needs a visible usable result and focused failure-path checks.
Do not replace existing controllers, authentication, event stores or registries
merely to make their shapes uniform. Unknown coverage is a tracked gap, not a reason
to expand the framework before the current increment works.

## Open evidence gaps

- Locate or regenerate a provenance-checked Graphify export from current source.
- Qualify current spend storage and provider billing coverage read-only.
- Inventory durable mission/event retention before selecting history storage.
- Specify role permissions and the approval UI handshake before enabling decisions.
- Verify runtime/deployed revision identity instead of equating it with local HEAD.

No runtime configuration, credentials, permissions, deployment or executable code
changed in Phase 1. The development server's generated AGENTS.md addition is outside
this document's change scope.

## Phase 2 implementation: read-only foundation (2026-09-29)

Implemented `/api/hq/workspace` behind the existing exact-owner check. It combines
validated source reports with an allowlisted projection of the same daemon status
used by Workbench. Observatory Overview and Activity now include a polling runtime
panel, command evidence, verification meter, and capability observations.

Local site server configuration:
- `DELTA_HQ_REPORT_PATH`: existing private source report configuration.
- `DELTA_HQ_RUNTIME_PORT`: loopback daemon port (for example 4318).
- `DELTA_HQ_RUNTIME_TOKEN`: current daemon workbench token, server environment only.
- Existing owner identity/authentication configuration remains required.

Never commit or use NEXT_PUBLIC for the token. Restarting the daemon rotates it;
update the server environment accordingly. The adapter accepts only a numeric port,
uses a fixed loopback GET path, refuses redirects, bounds response size, applies a
five-second timeout and strips noncontract fields. The preview remains offline.
Polling is sequential at ten-second intervals after completion, stops on lost
owner access, and clears observations on request failure.

Live adapter verification read four commands and 100 capability observations from
the existing daemon. Its sanitized response is partial (the prior registry audit
reported 158), so the panel labels observations rather than claiming a full census.
Costs, running revisions and durable history remain unknown/not connected. This
increment does not implement branch joins, approval decisions or task execution;
those remain subsequent contract/workflow increments. The signed-in page has not
been verified with a real owner session; connector verification used the real daemon
separately. No persistent token configuration or deployment was performed.

## Phase 2 closure and Phase 3 entry

Sign-in/live configuration is deferred by owner instruction. Source revisions now
remain inspectable when runtime is disconnected, with source age and a clear
main-vs-running/deployed distinction. Runtime state enums are validated rather
than treated as arbitrary display text.

Ready for Phase 3: owner-protected read model, source/revision display, runtime
observations, disconnected states and shared Workbench evidence. Build verification
qualifies packaging only; it does not qualify hosted runtime connectivity.

Carry forward (do not silently mark complete):
- Durable history: reuse mission/event persistence; daemon memory is not a history store.
- Branch/task joins: add stable references at the producing controller; names are not IDs.
- Cost integration: engineering progress already reports per-task estimates and pending
  usage, but its existing writer emits HTML, not a machine-readable cross-system feed.
  Backend reservations are not settled invoices. Export a versioned projection before
  adding either to the workspace; never scrape rendered HTML for accounting.
- Hosted operation: local daemon loopback cannot be reached from a hosted site server.
  Keep connector unconfigured until the approved topology and credentials are installed.

Phase 3 should organize Home, Work, System, Engineering and Analytics around the
shared contract. Unconnected sections must explain their missing source. Do not
present synthetic task, billing or branch data as live. Existing architecture graph
remains available while its dedicated redesign proceeds in Phase 4.

## Phase 3 delivery: workspace shell

Navigation now exposes Home, Work, Engineering, System, Analytics and Settings.
Existing overview/architecture/quality hash URLs remain compatible. A persistent
New task link opens Work. Its bounded draft survives in-page navigation and clears
on reload; no browser storage or implicit execution is introduced. Engineering
shows source repositories with explicit missing branch, test and deployed-revision
connections. Work retains shared runtime observations when authenticated/configured.
System preserves the architecture explorer for the Phase 4 redesign.

Verified browser navigation Work -> Engineering -> Work with draft preserved, clear
disabled execution control, narrow-screen layout and no console errors. 245 tests,
production build and lint (four existing warnings, no errors) passed. This is the
workspace shell increment; linked task detail panels, durable history and execution
remain dependent on the later live-workflow contracts. Sign-in configuration and
hosted deployment remain deferred.

## Audience boundary amendment before Phase 4

Public pages remain public product information and shared sign-in. Personal and
Technical are separate authenticated experiences, not an elevated mode selected by
an untrusted browser toggle.

Personal: Ask Delta, My tasks, Results, Connections, Preferences. Return only the
current user's tasks, plain-language progress/failures, relevant approval requests
and applicable budget limits. Never send infrastructure graphs, other users' work,
internal paths, branch inventories or system-wide telemetry to this client.

Technical: Home, Work, Engineering, System, Analytics, Settings. `/hq` and its APIs
remain exact-owner-only today. Future analyst permission permits scoped read-only
telemetry, not source changes or approval decisions; developer permission must bind
explicit repository and execution scope. Neither inherits unrestricted personal data.
Only a server-verified permission may reveal technical navigation or data. Authentication
alone, user profile metadata, query parameters and view preferences cannot grant it.

The separate Personal design preview is available locally at
`/observatory-preview?view=personal`. The selector chooses synthetic presentation
only, behind the existing development-only route; it never switches authority.
The Personal component imports no technical projection or runtime connector.
Production personal routing and server-side user-scoped data are deferred with the
sign-in configuration. No live identity, role, permission or redirect behavior changes.

Phase 4 architecture exploration belongs exclusively in Technical -> System.
The public product narrative and Personal experience do not show its navigation.

## Phase 4: functional graph explorer

Replaced the all-purpose graph toolbar/inspector with a searchable component directory,
focused graph neighborhood and evidence panel. Users can traverse incoming/outgoing
edges at one to three hops, follow relationships, step back through visited components,
reset to the whole layer and carry a shared component across system/capability layers.
Search filters the directory without destroying graph context. Keyboard buttons provide
an equivalent path to selecting canvas nodes. Provenance stays attached to each layer.

The design preview still uses synthetic data. Graphify code is available only when its
validated module graph is supplied. Live execution overlays and revision comparisons
remain unavailable until those evidence sources are connected. No execution or authority
is inferred from structural edges. Final aesthetic design remains deferred.

### Coverage and zoom correction

The local technical preview now uses the existing validated exporter against the
fixed sibling Delta repositories' committed main refs, instead of the illustrative
fixture. It is development-only; projection failure shows unavailable data, not a
synthetic replacement. Current projection: five repositories, 28 systems, 158
capabilities, 138 tools; systems graph 33 nodes/100 edges. Capability mapping remains
incomplete (96 unmapped, two ambiguous); registry coverage is not code-module coverage.
Focused mode explicitly shows subset/total and a Show all Delta components control.
Wheel zoom is applied through a bounded handler at 15%-300%; native unbounded zoom
is disabled, and existing button/fit/reset controls retain the same bounds.

### Readability pass

Added concise display labels while preserving full canonical names and IDs in evidence.
Graph coordinates now use deterministic repository groups and bounded rows, without
force-directed rearrangement. Systems overview displays ownership edges by default;
users can enable cross-system dependencies or focus a component to see its full
neighborhood. All nodes remain present. Search accepts short and canonical labels.

### Full declared-link overview

Overview now enables all declared dependencies by default. It distinguishes solid
ownership edges from dashed dependency edges and includes a complete expandable
source/relation/target inventory with component navigation. Current systems projection
has 28 ownership edges, 72 dependency edges and 14 cross-repository edges. Ownership:
Agent 22 systems, Backend 3, Site 1, Mobile 1, Jobs 1. This is registry evidence only,
not a complete runtime communication inventory. Compact shelf packing bounds group
width and wraps repositories into rows rather than extending one sparse horizontal strip.

## Phase 5 increment: bounded audit execution

Added owner-protected, same-origin POST /api/hq/tasks and a Work task runner for the
fixed agent.capability.audit workflow. Arbitrary capabilities, approval claims and
requester fields are rejected. The connector uses the existing daemon, reports the
returned verification and session reference, and never retries ambiguous outcomes.
Request-ID deduplication is process-local, bounded to 100 requests, and rejects
conflicting payload reuse. Capacity fails closed rather than evicting unresolved work.

Live adapter validation completed the real audit: 158 capabilities, 80 requiring
approval, verification passed. An initial live attempt exposed an incorrect field
name (capability instead of capability_id), resulting in inferred routing and rejected
tool arguments; corrected explicit routing was reverified. No model call was needed.

The preview keeps execution disabled; signed-in browser execution remains deferred
with live configuration. This increment displays submitted/waiting/result states,
not streaming per-tool progress. Engineering edits, approval decisions, durable task
history, restart recovery and continuation remain incomplete Phase 5 work. Existing
mission stores and owner approval controls must be integrated before exposing those
operations; this audit endpoint does not replace them.

### Phase 5 streaming increment

The existing task adapter now consumes daemon NDJSON, projects only recognized stage
names, and streams progress plus a confirmed final result to Work. Raw event payloads
are not forwarded. Interrupted or malformed streams without a final result become
outcome_unknown. Repeated request IDs replay bounded progress and reuse the original
execution; the browser retains its ID when checking the same input again. The runner
stays mounted while navigating between workspace sections so ongoing work/result state
is not discarded by tab changes. No browser persistence is implied.

Live streaming adapter verification observed Governance checked -> Tool running ->
Tool completed -> Verification completed, with completed/passed final status. This
was the deterministic read-only audit; no paid model call or engineering edit.
Encrypted WorkflowStore remains authoritative for engineering records. Site process
restart, full-page reload, durable history, approval decisions and engineering
continuation remain unimplemented integrations, independent of sign-in configuration.

## Phase 5 delivered build: durable execution desk

Work now connects to fixed `/api/hq/lifecycle/*` server routes for history, task
submission, prepared engineering scopes, exact approval decisions, continuation,
cancellation and captured change reviews. Owner verification and same-origin writes
remain enforced. The development preview renders the full interface with execution
disabled; it does not bypass sign-in.

The agent's opt-in `--workspace-controls` controller delegates to the existing
kernel, outcome runner, owner approval broker and encrypted WorkflowStore. History
survives process restart; unfinished tasks become interrupted and require explicit
continuation. Duplicate task IDs and operation IDs cannot create duplicate work.
The browser retains only a submission digest and ID in session storage across reload.
History summaries show the latest 100 of up to 1,000 retained records; each task has
100 bounded events. Failure and unknown-spend evidence remain visible.

Engineering requests are independently reviewed JSON manifests under the agent's
`agent/runtime-state/workspace-requests/<slug>.json`; fields use the existing outcome
request contract (objective, repo, initiative_id, name, areas/files, acceptance_path,
model, daily_cap_usd, request_id). Selection displays that scope and limits. Request
bytes are pinned and rechecked on continuation. Protected effects still require an
exact decision through the original owner broker. No approval proofs or provider
keys are sent to the browser. Incomplete/redacted approval displays fail closed.

Runtime startup: `npm run delta:daemon -- --start --approve-daemon --workbench
--owner-approvals --workspace-controls`. Provider execution additionally requires the
existing explicit OpenAI/provider options and positive reviewed budget. Configure the
local site's existing `DELTA_HQ_RUNTIME_PORT` and server-only `DELTA_HQ_RUNTIME_TOKEN`
from that daemon session. Keep credentials out of URLs, commits and browser storage.

Verification includes a real HTTP lifecycle with fixture model responses: submit
once, approve through the real owner broker, repair a pagination fixture in an isolated
worktree, run independent acceptance checks, inspect the captured diff and reload
retained history. Separate tests cover denial, altered digests/manifests, restart
without replay, explicit continuation, cancellation and encrypted storage. No API
credits are used by that qualification.

Live sign-in activation remains deliberately deferred. Hosted connectivity remains
Phase 6 work: a deployed site cannot reach a desktop loopback listener. These are
activation/rollout limits, not substitutes for the implemented lifecycle tests.

## Phase 6: presentation delivery and rollout boundaries

The personal workspace now has its own responsive presentation, editable request
starters, clear disconnected states and a persistent draft across its navigation.
It does not import technical reports or issue runtime requests. Public marketing
continues to remain separate from owner operational data.

The technical workspace uses consistent light surfaces, readable typography,
control sizing, focus rings, rounded panels and responsive evidence columns across
Work, Engineering, System and Analytics. Runtime verification distribution is derived
only from returned observations. The task stage rail describes current state rather
than inventing a percentage or completion estimate. Unavailable metrics remain dashes.
Reduced-motion rules suppress animation and transitions. Navigation no longer remounts
the execution desk; its selected workflow and in-memory state stay intact.

Unicorn Studio is the confirmed animation product. The owner has no scene ready yet.
No remote animation runtime or invented project ID has been added. When the approved
scene is supplied, mount it in a decorative presentation area, provide a static fallback,
skip loading with reduced motion, and keep operational evidence readable independently.

### Broader rollout acceptance matrix

| Gate | Current delivery | Evidence required before activation |
| --- | --- | --- |
| Personal/technical separation | Separate presentations and owner server checks | Live account and role checks remain deferred |
| Local task lifecycle | Encrypted history, exact decisions, bounded engineering | Existing Phase 5 fixture workflow and site tests |
| Public preview | Development-only source preview, no execution bypass | Production build must continue to reject the preview route |
| Hosted runtime connectivity | Loopback adapter only | Private authenticated transport design, deployment identity, reconnect/replay test; do not expose the desktop daemon publicly |
| Costs | Recorded task budgets; unknown billing stays unknown | Reconcile provider settlements and accounting coverage before calling totals live billing |
| Retention | 100 recent summaries, 1000 task capacity, bounded events | Document owner retention policy and prove encrypted backup/restore in the target environment |
| Animation | Unicorn Studio selected, asset pending | Approved scene/export, reduced-motion and load-failure checks |

Presentation is delivered locally. Hosted rollout and additional live connector
coverage are not claimed by this phase: their activation depends on the deliberately
deferred identity/connectivity configuration and source-specific qualification.

Phase 6 verification: 263 site tests passed; production build passed; lint has no
errors and four existing warnings. Browser checks confirmed the 1280px technical
layout and 360px personal layout have no horizontal document overflow. Personal
request starters preserve editable drafts across tabs, and technical workflow
selection survives Work -> Engineering -> Work navigation. No live auth, provider
calls, account mutations, remote animation assets or hosted deployment were performed.
