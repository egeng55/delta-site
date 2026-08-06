# Delta HQ Delivery Architecture

Status: first-pass implementation contract  
Primary surface: website `/hq`  
Future desktop path: Delta.app loading the same `/hq` experience  
Date: 2026-08-06

## Decision

Delta HQ is now delivered first as a browser-based owner operating surface at
`/hq`.

The product model is:

```text
shared HQ contracts/view models
-> Web HQ now
-> Delta.app later using the same HQ experience plus native/local-runtime capabilities
```

HQ must not fork into separate web and desktop products. The React HQ
experience and `DeltaHqViewModel` remain shared. Delta.app is preserved as a
future delivery path that can add native chrome, local runtime inspection, and
desktop-only controls through the existing Electron bridge.

The existing `delta-site` Electron foundation remains valid for that later
path because it already provides a sandboxed renderer, context isolation,
disabled Node integration, denied permissions, origin-restricted navigation,
narrow preload IPC, and fixed local service definitions. Native desktop work
must not block Web HQ progress.

## Web HQ First Pass

The `/hq` website route provides:

- Executive Brief;
- Organization with department pages;
- Initiatives;
- Evolution;
- Analytics;
- Activity;
- Reviews;
- persistent Ask Delta;
- explicit Operator Mode boundary.

`/hq` is an owner web app route, not a local-only technical cockpit. It should
be protected by the site authentication boundary in production. `/os`, local
demos, and technical cockpits stay local-only and must not become HQ.

Normal HQ shows summarized organizational state, blockers, evidence, reviews,
historical evolution, and analytics projections. Operator Mode owns raw service
health, command previews, diagnostic references, contract mapping gaps, and
local runtime controls. Operator diagnostics are not inputs for owner-facing
analytics unless Core later publishes an authorized observability reference.

## Shared View Model

HQ consumes `DeltaHqViewModel` from `src/lib/deltaHqViewModel.ts`.

The adapter is presentation-facing. It does not claim to be the Core Event Bus,
Agent Lifecycle Manager, or Organizational Observability source of truth. Fields
are labeled as:

- `real`: read-only projection from current source artifacts or reports;
- `fixture`: development projection used for first-pass UI;
- `awaiting_core`: unavailable until Core publishes the contract.

Missing fields must render unavailable or disabled. HQ must not parse freeform
logs to invent canonical runtime truth, metrics, costs, productivity scores,
or performance definitions.

## Evolution

Evolution is a first-class HQ destination, not an Operator diagnostic and not a
second history store.

The view consumes Historian's read-only milestone projections:

- `inspectHistorianMilestones(...)` for detailed claim and evidence state;
- `buildEvolutionTimeline(...)` for the canonical milestone sequence.

Evolution renders date, milestone, significance, lineage tracks, concise
description, major capability gained, predecessors, successors, evidence
confidence, and evidence references from Historian. The UI preserves direct,
inferred, and unresolved claim classifications. It never promotes inferred
claims to fact and never writes Historian records.

The timeline shows Product / Intelligence and Engineering / Agentic tracks as
separate lanes. A convergence lane is rendered only when Historian explicitly
projects a milestone as `converged_platform` or multi-track; otherwise the lane
states that convergence is not evidenced in the current projection.

Ask Delta receives the selected Evolution milestone, lineage, confidence, and
timeline window as read-only context.

## Observability Preparation

Organizational Observability is now a first-class information architecture
concern in HQ.

The first pass reserves:

- a small set of Executive Brief trend visualizations;
- department pages with historical performance dashboard panels;
- a dedicated Analytics surface for deeper observability;
- a milestone annotation seam for future trends;
- contract integration points for metric identity, definitions, rollups,
  freshness, trust, time windows, and drill-through refs.

Until the canonical Observability contract exists, these surfaces use
fixture/adaptor data only. Every trend and department dashboard keeps
`canonicalMetricRef` unavailable and explains that the definition is awaiting
the contract. HQ must not define telemetry in the UI.

## Contracts Needed

Once Core finishes the Event Bus, Agent Lifecycle Manager, and Organizational
Observability contracts, HQ needs:

- canonical event identity, type, version, timestamps, actor, source, trust,
  and integrity;
- agent lifecycle snapshots, active run refs, authority class, blocker refs,
  and wake conditions;
- initiative objective, owner, lifecycle, dependency refs, blocker refs, and
  recent movement;
- Mission Control terminal status, stop reason, escalation, route proposal,
  handoff proposal, and owner-review state;
- Activity, Recommendation, and optional Action refs;
- evidence refs with availability, freshness, source authority, and relevance;
- structured notification and approval requirements;
- model usage, tool usage, estimated cost, and pricing basis;
- department refs, metric IDs, canonical definitions, rollup basis, time
  windows, trend point values, units, freshness, trust class, and unavailable
  reasons;
- authorized Operator diagnostic refs.

## Desktop Path

Delta.app later loads the same `/hq` route and may add:

- persistent macOS window and native-feeling app chrome;
- Electron preload bridge for local runtime status;
- development-only start/stop for fixed backend and site commands;
- packaged-mode read-only service status;
- service-manager fallback when HQ cannot load.

The desktop path must not introduce a second HQ interface or a competing
organizational state source.

## Deferred Native Capabilities

Later phases may add:

- signed and notarized Delta.app packaging;
- bundled offline renderer assets;
- packaged backend/runtime distribution;
- launch at login;
- background daemon or menu bar agent;
- desktop notifications;
- global shortcuts;
- microphone, push-to-talk, TTS, wake word, and always-on listening;
- auto-update and crash reporting;
- native Swift/AppKit rewrite only if Electron becomes a concrete blocker.

Each deferred capability needs its own approval, security review, and runtime
contract before implementation.
