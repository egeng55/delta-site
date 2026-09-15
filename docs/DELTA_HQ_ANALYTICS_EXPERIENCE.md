# Delta HQ Analytics and Organizational Health Experience

Status: Experience and product contract; Organizational Observability mapping pending  
Owner surface: Delta HQ  
Primary delivery: Web HQ, compatible with the future Delta.app desktop shell  
Date: 2026-08-06

## 1. Purpose

This document defines how Delta HQ presents organizational performance and
health to the owner.

Delta HQ must answer two distinct questions:

1. **What is happening?** — Brief, Organization, Initiatives, Activity, and
   Reviews.
2. **How well is Delta performing?** — Analytics and contextual performance
   views.

Organizational Observability owns metric definitions, telemetry, health
classification, baselines, targets, time-series storage, aggregation, and
read-only analytics projections. HQ consumes that truth. It does not derive a
competing score, parse logs into metrics, or define performance thresholds.

## 2. Decision

Add **Analytics** as a first-class Delta HQ destination.

Revised primary HQ navigation:

1. Brief
2. Organization
3. Initiatives
4. Analytics
5. Activity
6. Reviews

Ask Delta remains persistent. Operator Mode remains visually and
architecturally separate from normal HQ navigation.

Analytics is justified as a first-class surface because it is a durable,
cross-organizational management lens used repeatedly across departments,
initiatives, costs, reliability, and autonomy. It is not a capability catalog
and is not organized around internal tools.

This does not revise Delta's canonical consumer navigation of Today, Activity,
You, and Ask Delta. Delta HQ is an owner/operator organizational product. If HQ
is later exposed as the normal consumer shell, first-class Analytics would
require a separate Product Specification review.

## 3. Product model

Analytics does not create a new canonical user object. It is a read-only lens
over existing organizational objects and approved projections.

| Analytics concept | Product mapping | Rule |
| --- | --- | --- |
| Executive performance summary | Brief projection | Time-bounded synthesis that references current organizational state and analytic evidence. |
| Material performance change | Insight | Durable interpretation only when the authoritative system publishes or confirms it. A chart movement alone is not an Insight. |
| Department or agent | Organization entity | Identity, responsibility, lifecycle, and qualification come from canonical organization contracts. |
| Initiative progress | Initiative/Plan projection | Analytics adds history and comparison; it does not own initiative lifecycle. |
| Workflow, failure, decision, milestone | Activity reference | Charts link to durable events instead of duplicating their truth. |
| Owner attention | Recommendation or Review reference | Analytics may surface an existing decision but must not generate an ungoverned recommendation from a threshold crossing. |
| Metric, series, baseline, target | Supporting analytic evidence | Defined by Organizational Observability and referenced by stable identity/version. |
| Explanation | Persistent Ask Delta conversation | Carries selected scope, metric, chart, and time range while linking back to the source view. |

Analytics state is read-only. Filters, selected ranges, display preferences,
and open panels may be local UI state; they do not become organizational truth.

## 4. Revised HQ information architecture

### 4.1 Brief — what deserves attention now

Brief remains the executive starting point. It may show at most three compact
analytic signals when they materially affect the current management picture:

- health direction;
- current bottleneck;
- autonomy or cost change requiring attention.

Each signal includes a plain-language takeaway and opens the relevant
Analytics view with scope and time range preserved. Brief must not become a
miniature analytics dashboard.

### 4.2 Organization — who owns what and current health

Organization remains the current-state map. Department and agent cards show:

- canonical lifecycle state;
- current health classification;
- qualification state;
- last meaningful activity;
- measurement coverage;
- one material trend or limitation.

Selecting a department or agent opens its organizational detail. A
`Performance` section deep-links to the corresponding Analytics view.

### 4.3 Initiatives — current portfolio and progress

Initiatives remains the portfolio surface. Each initiative shows current
lifecycle, owner, dependencies, blockers, qualification, and recent movement.
Its `Progress history` opens a scoped Analytics timeline.

### 4.4 Analytics — performance across time

Analytics contains four internal views:

- **Overview** — executive organizational health;
- **Departments** — department and Agent Health performance;
- **Initiatives** — historical progress and flow;
- **Autonomy** — composition and causes of autonomous operation.

These are tabs or scoped views inside Analytics, not additional primary
navigation destinations.

### 4.5 Activity — what changed

Activity remains the immutable event history. Analytics annotations and
drill-downs link to Activity records. Analytics does not duplicate an event
ledger or expose raw telemetry samples.

### 4.6 Reviews — what needs owner judgment

Reviews remains the decision surface. Analytics may identify that a metric or
health state has an associated Review, but owner disposition happens in the
Review object. A chart selection never functions as approval.

### 4.7 Ask Delta — explanation in context

Ask Delta accepts the currently selected organizational entity, chart, metric,
time range, comparison, data point, and milestone as context. The durable
answer links back to those objects and projections.

### 4.8 Operator Mode — diagnostic truth

Operator Mode owns raw samples, telemetry provenance, detailed distributions,
queue internals, low-level failures, model/tool diagnostics, exact cost
breakdowns, schema mapping, and integrity diagnostics. Normal Analytics may
summarize these only through approved projections.

## 5. Analytics surface design

### 5.1 Persistent controls

The Analytics header contains:

- scope breadcrumb: Organization, Department, Agent, or Initiative;
- time range: Today, 7 days, 30 days, Since milestone, Since qualification, or
  All time;
- comparison: Prior period, Baseline, Target, or None;
- data freshness and measurement coverage;
- `Ask Delta about this view`.

Only ranges and comparisons supported by the projection are enabled. The UI
must not calculate a baseline, select a target, or manufacture a “since” date.

### 5.2 Result-first summary

Every Analytics view begins with a short management synthesis:

- current health and direction;
- the most important change;
- the current bottleneck;
- the one issue requiring owner attention;
- material data limitations.

The synthesis is a projection supplied or supported by Organizational
Observability. HQ does not infer causal explanations from chart shape.

### 5.3 Drill-down model

Every chart supports the same path:

`Executive question -> department/initiative -> metric series -> supporting Activity/evidence -> Ask Delta`

Drill-down preserves scope, range, comparison, and selected point. It never
silently changes the denominator or time window.

## 6. Executive analytics layout

The executive view should answer the owner's core questions in under one
minute with four high-information visualizations.

### 6.1 Header: organizational health statement

The first viewport contains:

- `Healthy`, `Degraded`, `Blocked`, or `Insufficient data`, supplied by the
  canonical health projection;
- improving, stable, or deteriorating direction when canonically supported;
- the primary bottleneck;
- the largest material change;
- owner attention count, linked to Reviews;
- operating cost summary and coverage period.

There is no composite “Delta score.” Health is explained through its component
conditions.

### 6.2 Visualization 1 — Is organizational health improving?

**Recommended form:** department health matrix with time along the horizontal
axis and departments along the vertical axis.

It shows state intervals and transitions, not an averaged score. Owners can see
which department changed, when, and whether poor health is persistent or
isolated. Selecting a cell opens the department view and relevant evidence.

Missing telemetry uses `Insufficient data`, never healthy coloring.

### 6.3 Visualization 2 — Where is work slowing down?

**Recommended form:** organizational flow view showing canonical transitions
such as implementation, qualification, and integration.

The view combines:

- volume entering and leaving each stage;
- transition-time distribution or canonical latency projection;
- backlog at each stage;
- blocked work and dominant blocker category.

The UI consumes stage names and measures from the canonical projection. It
does not define workflow stages or calculate organizational throughput from
repository activity.

### 6.4 Visualization 3 — Why is autonomy changing?

**Recommended form:** Autonomy Ledger described in section 11.

The executive view shows composition and change reasons, never a standalone
percentage or gauge.

### 6.5 Visualization 4 — Is operation becoming more economical?

**Recommended form:** two vertically aligned trends sharing the same time axis:

- successful workflows;
- operating cost and canonical cost-per-success projection.

Alignment permits comparison without a misleading dual axis. Annotations show
qualification events, model/configuration changes when approved for owner
display, and material regressions.

### 6.6 Material changes rail

A compact rail beside or below the four visualizations lists no more than five
material changes:

- what changed;
- affected department or initiative;
- magnitude or state transition as supplied;
- relevant milestone;
- owner consequence;
- link to Activity or Review.

## 7. Agent Health pattern

Agent Health is a reusable detail pattern inside Organization and Analytics.
It is not a new top-level destination.

### 7.1 State model

The visible state must come from the Organizational Observability health
projection. HQ supports these explicit display states:

| State | Meaning in the experience |
| --- | --- |
| Healthy | Canonical measurements support normal operation for the selected period. |
| Degraded | The agent is operating, but one or more material dimensions are below their canonical baseline or target. |
| Blocked | The agent cannot make meaningful progress under current conditions. |
| Insufficient data | Coverage or freshness is inadequate to classify health. Never styled as healthy. |
| Sleeping | Lifecycle says no active work is expected. This is not automatically healthy or unhealthy. |
| Unqualified | The agent has not met its required qualification contract. This is not equivalent to failure. |

Sleeping and Unqualified are lifecycle/qualification conditions that may
coexist with a health limitation. If the canonical contract supplies separate
dimensions, the UI presents both rather than forcing them into one score.

### 7.2 Header

The header communicates:

- agent name and department;
- responsibility in owner language;
- lifecycle state;
- qualification state and last qualification change;
- current health state and trend versus baseline;
- last meaningful Activity;
- measurement coverage and freshness.

### 7.3 Health dimensions

Use a compact diagnostic summary for:

- reliability;
- workload;
- latency;
- economics;
- human intervention;
- safety;
- recent failures.

Each dimension shows canonical status, trend, comparison, coverage, and one
short interpretation. It does not show a metric when the registry does not
declare that metric relevant to the agent.

### 7.4 Historical body

The body contains:

1. health state history;
2. responsibility-specific performance panels;
3. workload and latency distributions when owner-relevant;
4. recent failures and recovery outcomes;
5. qualification timeline;
6. Historian milestones;
7. linked Activity and Reviews.

Raw runs, stack traces, queue records, prompts, and tool calls stay in Operator
Mode.

### 7.5 No-data behavior

When measurement coverage is absent or stale:

- status is `Insufficient data`;
- the page says which dimensions cannot be evaluated;
- last known state is timestamped and visually secondary;
- comparisons and trend arrows are removed;
- Ask Delta can explain the limitation from trusted metadata;
- the page does not infer health from last activity or qualification alone.

## 8. Department dashboard pattern

Every department uses shared structure but responsibility-specific questions.
Departments do not receive identical metric grids.

### 8.1 Shared structure

1. **Department outcome** — health, direction, mission, current bottleneck.
2. **Responsibility questions** — three to five canonical panels selected by
   the department analytics projection.
3. **Agents** — Agent Health summaries and workload distribution.
4. **Flow and dependencies** — incoming work, outgoing work, blocked
   dependencies, and handoffs where canonically defined.
5. **Progress history** — qualification, milestones, regressions, and recovery.
6. **Economics and intervention** — cost and owner involvement when relevant.
7. **Evidence and Ask Delta** — source coverage, freshness, and contextual
   explanation.

### 8.2 Responsibility-specific management questions

These questions guide visualization selection; they do not define metrics.

| Department | Questions its canonical projection should answer |
| --- | --- |
| Core Intelligence | Are decisions becoming more reliable and economical? Is context sufficient? Where does reasoning stop or require review? |
| Mission Control | Are routes and handoffs correct and terminally complete? Is authority preserved? Where is human escalation increasing? |
| Event Bus | Are events delivered completely and on time? Where do duplicates, schema incompatibility, or lag constrain the organization? |
| Historian | Is meaningful history covered, fresh, and trustworthy? Where are conflicts or milestone gaps accumulating? |
| Architecture | Is structural drift controlled? How quickly are material decisions adjudicated? Where are invariant or evidence gaps? |
| Integration | What is waiting to integrate, for how long, and on which dependencies? Where do qualified capabilities regress before integration? |
| Security | Where is risk concentrated? Are material findings resolving? Are authority and secret boundaries holding? |
| Evaluation | Is qualification coverage expanding? Are results stable across repetition? Where are cost or reliability regressions emerging? |
| Perception | Are required sources available, fresh, and trustworthy? Where does incomplete or conflicting evidence limit decisions? |
| Execution / Career Intelligence | Are approved workflows completing successfully? What blocks or fails? How long and how costly is recovery? |
| Product Governance | Are capabilities mapping cleanly to product objects? Where is product drift or migration debt accumulating? |
| Experience Governance | Are promoted capabilities coherent and understandable? Where are cross-surface inconsistency and trust debt growing? |

Organizational Observability decides which canonical definitions answer these
questions. HQ only renders panels present in the department projection.

### 8.3 Comparison

Department comparison is allowed only for commensurable canonical metrics.
HQ must not rank departments using unlike responsibilities or normalize them
into a synthetic productivity score.

## 9. Initiative progress pattern

Every major initiative receives a `Progress history` view reachable from both
Initiatives and Analytics.

### 9.1 Initiative summary

Show:

- objective and owner;
- current lifecycle and qualification state;
- current bottleneck and blocked dependencies;
- change since the selected comparison;
- measurement coverage;
- one next owner decision when an existing Review or Recommendation is linked.

### 9.2 Progress timeline

Use a layered timeline rather than a percent-complete ring:

- lifecycle state intervals;
- qualification progression;
- integration stages;
- milestones;
- regressions and recoveries;
- blocker intervals;
- owner interventions;
- cost and autonomy annotations when canonical data supports them.

The timeline communicates what changed and when. It does not invent a linear
completion percentage for research or qualification work.

### 9.3 Supporting views

- throughput or completed workflow trend;
- backlog/burn-down only when a canonical scope and total exist;
- dependency health map;
- cost evolution;
- intervention and autonomy evolution;
- related Activity and Reviews.

An initiative with no canonical total uses milestone and state history, not a
fabricated burn-down chart.

## 10. Organizational analytics views

Analytics Overview can drill into five organizational lenses.

### 10.1 Flow

Answers:

- How long does work take from implementation to qualification?
- How long from qualification to integration?
- How quickly does an event become a decision?
- Where is the current integration backlog?
- Which dependencies constrain throughput?

Recommended visuals: stage flow, transition-time distribution, backlog trend,
and dependency health map.

### 10.2 Reliability and recovery

Answers:

- How many canonical workflows succeeded?
- Where are regressions occurring?
- How quickly does Delta recover?
- Which failures recur?

Recommended visuals: success/failure trend, regression timeline, recovery-time
distribution, and failure-category comparison.

### 10.3 Economics

Answers:

- What does Delta cost to operate?
- What is the canonical cost per successful workflow?
- Which departments or workflow classes explain material cost changes?
- Is higher cost producing more successful work or only more attempts?

Recommended visuals: aligned cost/outcome trends, cost distribution, and
change decomposition. Provider- or model-level cost stays in Operator Mode
unless explicitly approved for owner display.

### 10.4 Owner load

Answers:

- Where is owner intervention structurally required?
- Where is eligible autonomous work still requiring intervention?
- Which departments produce repeated escalations or reviews?
- Are owner decisions resolving bottlenecks?

Recommended visuals: intervention composition, review queue trend, and
time-to-owner-decision projection.

### 10.5 Integration health

Answers:

- What is qualified but not integrated?
- How old is the backlog?
- Which dependencies block integration?
- Where did integrated capabilities regress?

Recommended visuals: backlog aging bars, qualification-to-integration
timeline, dependency graph, and regression markers.

All measures and category definitions come from Organizational Observability.

## 11. Autonomy visualization

### 11.1 Autonomy Ledger

The primary autonomy visualization is a time-based composition called the
**Autonomy Ledger**.

For each period, it first separates:

- work structurally requiring owner approval;
- work eligible for autonomous operation.

Eligible work is then separated into:

- successful autonomous completion;
- blocked autonomous work;
- owner intervention;
- safety stop.

The visualization is a stacked composition over time with absolute volume
available alongside the share. Structurally approval-required work remains
visible but outside the eligible autonomy denominator supplied by the
canonical projection.

### 11.2 Why autonomy changed

A change-decomposition panel explains the difference from the selected prior
period, baseline, or milestone:

- eligibility mix changed;
- successful autonomous completions changed;
- blockers changed;
- owner interventions changed;
- safety stops changed;
- measurement coverage changed.

Each contribution drills into the affected workflows, departments, and
Activity. The interface says “Autonomy increased because…” only when the
projection supplies a supported explanation. Otherwise it says what changed
without claiming cause.

### 11.3 Required safeguards

- Never show a single autonomy score without composition and denominator.
- Never classify approval-required work as an autonomy failure.
- Never classify a safety stop as ordinary failure or hide it inside blocked.
- Never reward lower owner intervention when eligible work simply disappeared.
- Always show absolute volume, eligibility, and measurement coverage.
- Treat unknown or incomplete categorization as `Insufficient data`.

## 12. Historian milestone integration

Historian milestones appear as annotations on relevant analytic timelines when
the canonical projection links them to the selected organization, department,
agent, initiative, or metric.

### 12.1 Annotation behavior

- A diamond marker denotes a milestone.
- Selecting it shows name, time, significance summary, affected scope, and
  linked Activity/evidence.
- Dense milestones cluster by period and expand on selection.
- Milestones preserve canonical timestamp and identity.
- `Since milestone` uses the selected canonical milestone timestamp.
- `Since qualification` uses the canonical qualification event, not the first
  healthy sample.

### 12.2 Causality boundary

A milestone annotation shows temporal relationship, not causation. Copy uses
“after” or “since” unless Organizational Observability or an approved Insight
supports a causal claim.

Ask Delta may answer “What changed after Event Bus qualification?” by comparing
approved before/after projections and citing the milestone. It must not claim
that qualification caused the change without supporting evidence.

## 13. Contextual Ask Delta analytics flow

### 13.1 Context package

When the owner invokes Ask Delta from Analytics, HQ passes a read-only context
reference containing:

- selected organization, department, agent, or initiative reference;
- chart and visualization reference;
- canonical metric definition reference and version;
- selected series or category;
- time range and timezone;
- comparison basis;
- selected point, interval, anomaly, or milestone;
- projection version, freshness, trust, and coverage;
- deep link back to the same analytic state.

Exact field names and the analytics conversation contract require
Organizational Observability and Conversation Experience confirmation.

### 13.2 Interaction

1. The owner selects a chart, series, period, or annotation.
2. `Ask Delta` opens with a visible context chip such as
   `Mission Control · Cost · 7 days vs prior period`.
3. Suggested questions use the selected context:
   - Why did this change?
   - What contributed most?
   - Which workflows are affected?
   - What changed after this milestone?
   - What evidence is incomplete?
4. Delta answers with a concise conclusion, material evidence, uncertainty,
   and links to the relevant department, initiative, Activity, or Review.
5. Changing the chart does not silently replace conversation context. The
   owner chooses `Use current selection` when needed.

### 13.3 Boundaries

- Ask Delta cannot promote a chart correlation into canonical causation.
- Ask Delta does not query raw telemetry from the normal owner experience.
- Missing metric definitions or coverage remain explicit.
- Analytic questions do not trigger execution or notifications.
- Important conclusions become canonical Insights only through their owning
  contract, not merely because a conversation stated them.

## 14. Visualization design system

### 14.1 Every chart answers a question

Every visualization contains:

1. a management question as its title;
2. a one-sentence current takeaway;
3. the chart;
4. range and comparison;
5. freshness and measurement coverage;
6. source/trust disclosure;
7. `Ask Delta` and drill-down affordances.

Charts without a management question do not belong in normal HQ Analytics.

### 14.2 Chart selection

| Management relationship | Preferred visualization |
| --- | --- |
| Change over time | Line or stepped-state chart |
| Department comparison | Ordered bars when measures are commensurable |
| Latency or cost spread | Distribution, histogram, or percentile band supplied by the projection |
| Qualification progression | State timeline with milestone markers |
| Organizational health | Department-by-time state matrix |
| Throughput and backlog | Aligned throughput bars and backlog line, separated if scales differ |
| Planned finite work | Burn-down only with canonical scope and total |
| Dependency condition | Bounded dependency map or adjacency health list |
| Autonomy composition | Stacked composition with absolute volume and reasons |
| Lifecycle history | State intervals with event annotations |

### 14.3 Semantic visual grammar

- Healthy: green plus `Healthy` text/icon.
- Degraded: amber plus `Degraded` text/icon.
- Blocked: red plus `Blocked` text/icon.
- Insufficient data: neutral gray with pattern and explicit label.
- Sleeping: blue-gray with pause/sleep label; not a success color.
- Unqualified: violet with explicit qualification label.
- Owner intervention: blue.
- Safety stop: amber/black patterned marker, distinct from failure.
- Historian milestone: diamond marker.
- Anomaly: outlined marker with explanation on focus/selection.
- Baseline: dashed reference line.
- Target: solid reference line with target label.
- Prior period: lower-emphasis comparison series.

Color never carries meaning alone. Department identity uses labels and stable
ordering rather than assigning every department a decorative color.

### 14.4 Number and comparison rules

- Units and precision come from the metric definition.
- Direction arrows appear only when the metric declares directionality and a
  valid comparison exists.
- Better/worse language requires canonical interpretation; otherwise use
  increased/decreased.
- Absolute values accompany percentages when available.
- Changes identify the comparison and period.
- Truncated axes require explicit indication and are avoided for comparisons.
- Dual axes are not used in normal HQ.

### 14.5 Prohibited visualizations

- decorative gauges, speedometers, and score rings;
- pie charts with many categories;
- composite health or autonomy vanity scores;
- department productivity leaderboards;
- red/green-only encoding;
- sparklines without scale, period, or status;
- heatmaps that treat missing data as zero or healthy;
- burn-down charts without canonical scope;
- charts reconstructed from logs or repository activity;
- causal annotations inferred from temporal proximity.

### 14.6 Chart states

Every chart supports:

- loading;
- ready;
- partial coverage;
- stale;
- insufficient data;
- metric unavailable;
- comparison unavailable;
- access restricted;
- integrity failure.

An empty result is distinct from unavailable telemetry. Integrity failure
hides untrusted values and links authorized operators to diagnostics.

## 15. Responsive web behavior

### 15.1 Wide web and future desktop shell

At wide widths:

- persistent HQ navigation remains on the left;
- Analytics content uses a responsive 12-column main canvas;
- Ask Delta may remain as the right rail;
- header controls remain sticky;
- the four executive visualizations use a two-column grid;
- department and initiative selection may use a master-detail layout.

No Electron-native API is required. The same `/hq` renderer works in the web
runtime and future Delta.app shell.

### 15.2 Medium widths

- left navigation collapses to a compact rail or menu;
- Ask Delta opens as an overlay panel;
- executive charts become a single column;
- filters wrap into two rows without hiding freshness or coverage;
- comparison detail remains visible beneath chart titles.

### 15.3 Narrow widths

- summary and owner-attention items precede charts;
- range and comparison controls open from one `Time and comparison` control;
- department matrix becomes a labeled state list with a time scrubber;
- flow views become stage cards with transition detail;
- Autonomy Ledger becomes stacked period cards with category values;
- wide distributions use horizontal scrolling only inside the chart region;
- Ask Delta opens as a full-height sheet with the analytic context pinned;
- no trust, coverage, uncertainty, or denominator information is removed.

### 15.4 Accessibility

- Every chart has a textual takeaway and accessible data-table alternative.
- Keyboard focus can select points, series, annotations, and drill-downs.
- Tooltips are also available by focus and touch.
- State is never communicated by color alone.
- Motion is limited and respects reduced-motion preferences.
- Trend announcements state measure, period, comparison, and direction.

## 16. Organizational Observability contract requirements

This section defines UI needs, not runtime field names. Every symbolic mapping
requires confirmation when Organizational Observability publishes its
read-only projection contract.

### 16.1 Projection envelope

HQ needs:

- projection identity and schema version;
- generation time and data-through time;
- requested and effective time range;
- timezone;
- scope identity and scope type;
- comparison type and supported comparisons;
- projection status;
- source authority;
- trust and integrity state;
- freshness state;
- measurement coverage summary;
- visibility class;
- authorized Operator diagnostic reference.

### 16.2 Metric definition reference

Every displayed measure needs a canonical registry reference containing or
resolving to:

- stable metric ID and definition version;
- owner-readable label and management question;
- organizational scope and applicable entity types;
- unit, precision, and formatting;
- directionality or explicit absence of directionality;
- aggregation and comparison semantics;
- baseline and target references when supported;
- qualification or maturity status;
- owner versus Operator visibility;
- deprecation or supersession state.

HQ must not display an unregistered measure as real telemetry.

### 16.3 Series and comparison projection

Each chart needs:

- chart/projection identity;
- canonical metric references;
- series and category identities with owner labels;
- timestamps or intervals;
- display-ready values and units;
- current, prior, baseline, and target values when supported;
- comparison result and canonical interpretation, if available;
- missing, partial, or excluded-value representation;
- coverage and freshness per series;
- anomaly references supplied by Observability;
- supporting event, evidence, Activity, Review, and entity references.

Whether HQ may perform display-only totals or percentages must be explicitly
defined. Health, causality, anomaly, target attainment, and better/worse
classification must remain upstream.

### 16.4 Organization and Agent Health projection

HQ needs:

- organization, department, and agent stable identities;
- owner-readable responsibility and ownership;
- lifecycle state and source authority;
- qualification state, qualification event, and history;
- canonical health state and health-state history;
- relevant health dimensions and metric references;
- workload, latency, economics, intervention, safety, and reliability panel
  descriptors where applicable;
- recent failure and recovery references;
- last meaningful Activity;
- baseline/target comparison;
- coverage and freshness;
- blocker and dependency references.

HQ must not derive health from these fields if the canonical health state is
absent.

### 16.5 Initiative progress projection

HQ needs:

- initiative identity, objective, owner, and scope;
- lifecycle and state interval history;
- qualification and integration progression;
- canonical milestone references;
- blocker and dependency intervals;
- regression and recovery references;
- relevant throughput, cost, autonomy, and intervention projections;
- canonical total/scope before a burn-down is allowed;
- linked Activity, Review, Recommendation, and evidence.

### 16.6 Autonomy projection

HQ needs a preclassified, auditable projection containing:

- total work volume in scope;
- structurally approval-required work;
- autonomy-eligible work;
- successful autonomous completion;
- blocked autonomous work;
- owner intervention;
- safety stops;
- unknown or unclassified work;
- absolute values and display shares;
- eligibility and category definition references;
- change contributions for supported comparisons;
- department, workflow, Activity, and Review drill-down references;
- coverage, freshness, trust, and integrity.

HQ does not assign work to these categories from event text.

### 16.7 Historian annotation projection

HQ needs:

- milestone identity and canonical timestamp;
- owner-readable title and significance summary;
- affected organization, department, agent, initiative, and metric refs;
- Activity and evidence refs;
- trust/integrity state;
- whether before/after comparison is supported;
- causal claim reference only when canonically supported.

### 16.8 Ask Delta context contract

HQ and Conversation Experience must agree on:

- immutable analytic context reference;
- projection and metric versions;
- selected scope, series, category, point, and annotation;
- time and comparison semantics;
- trusted evidence links;
- freshness and coverage disclosure;
- canonical deep link;
- retention and cross-device behavior;
- behavior when the underlying projection is superseded.

### 16.9 Contract safeguards

- Projection access is read-only.
- Missing fields return explicit unavailable states.
- Unknown enums fail closed.
- Raw runtime files are not an analytics source.
- Fixture and real projection data cannot be mixed without row/series-level
  labeling.
- Trust and integrity apply before rendering.
- Owner and Operator visibility are enforced upstream and in the adapter.
- Targets, baselines, health, anomaly, and causality are never inferred by HQ.

## 17. Fixture-safe implementation boundary

The following can be implemented immediately after the active HQ worktree is
reconciled:

| UI portion | Fixture-safe now | Constraint |
| --- | --- | --- |
| Add Analytics to HQ navigation | Yes | Route/view remains read-only and owner-only. |
| Analytics Overview shell | Yes | Every value and chart carries a persistent `Illustrative data` banner. |
| Time and comparison controls | Yes | UI-only selection; disabled options explain when canonical data is required. |
| Executive four-chart layout | Yes | Use invented, obviously illustrative series; no claim about Delta performance. |
| Agent Health pattern | Yes | Exercise all explicit states and coverage behavior with fixtures. |
| Department dashboard structure | Yes | Panels are framed as management questions, not invented metric definitions. |
| Initiative progress timeline | Yes | Fixture milestones and states are visibly illustrative. |
| Autonomy Ledger | Yes | Categories and denominator are labeled as a design fixture, not a measured autonomy ratio. |
| Historian annotation interactions | Yes | Fixture annotation; no binding to raw Historian files. |
| Ask Delta context chip | Yes | Local UI context only until the conversation contract is confirmed. |
| Loading, stale, partial, unavailable, and integrity states | Yes | State fixtures should be first-class test cases. |
| Live health, cost, throughput, autonomy, or comparison values | No | Wait for canonical Observability projections. |
| Real metric registry browsing | No | Wait for registry identity/version contract. |
| Raw telemetry drill-down | No in normal HQ | Operator Mode only after authorization contract. |
| Causal explanations | No | Require approved projection or Insight support. |

### 17.1 Proposed component boundary

Fixture-backed implementation should use reusable presentation components:

- `AnalyticsWorkspace`
- `AnalyticsHeader`
- `ExecutiveAnalyticsSummary`
- `ManagementQuestionChart`
- `DepartmentHealthMatrix`
- `OrganizationalFlowView`
- `AutonomyLedger`
- `EconomicsOutcomeView`
- `MaterialChangesRail`
- `AgentHealthPanel`
- `DepartmentAnalyticsView`
- `InitiativeProgressTimeline`
- `HistorianMilestoneAnnotation`
- `AnalyticsAskDeltaContext`
- `AnalyticsDataState`

Components consume a presentation adapter, not runtime files. Chart components
receive an explicit data-state and source-kind property. Fixture mode places an
unmissable page-level banner and chart-level badge; hiding fixture labels is not
a supported component option.

### 17.2 Why implementation is not included in this change

The current Delta HQ component and view model are uncommitted, actively changed
files that already contain partial Organizational Observability fixture seams.
Modifying them in this review would risk overwriting or entangling active HQ
work. This contract provides the implementation boundary without changing that
worktree. UI implementation should follow after those files are reconciled or
isolated in a dedicated worktree.

## 18. Experience and product compliance

### 18.1 Experience assessment

**Outcome: Compliant with safeguards.**

The design:

- answers management questions before exposing measures;
- uses a small number of purposeful visualizations;
- exposes uncertainty, freshness, coverage, and trust at the point of use;
- keeps diagnostic machinery in Operator Mode;
- connects every analytic view to persistent Ask Delta;
- distinguishes correlation, temporal sequence, and supported causality;
- treats unavailable telemetry as insufficient data rather than health;
- preserves the same semantics in web and future desktop delivery.

### 18.2 Product assessment

**Outcome: Compliant for Delta HQ. No canonical object change required.**

Analytics is a read-only management lens over organization entities,
initiatives, Activity, Reviews, Briefs, and approved evidence. It does not
create parallel lifecycle or metric objects in the product model.

First-class Analytics is permitted specifically within owner-facing Delta HQ.
It must not leak into Delta's normal consumer navigation without a Product
Specification revision.

### 18.3 P0 release safeguards

- Consume only versioned, read-only Organizational Observability projections.
- Never display missing telemetry as healthy.
- Never infer health, targets, anomalies, autonomy classes, or causality.
- Keep fixtures unmistakably labeled at page and visualization level.
- Keep raw telemetry and technical diagnostics in Operator Mode.
- Preserve scope, time range, comparison, and metric identity through
  drill-down and Ask Delta.
- Provide accessible nonvisual equivalents for every chart.

### 18.4 P1 coherence requirements

- Add contextual performance links to Brief, Organization, Initiatives,
  Activity, and Reviews.
- Share department, agent, initiative, metric, and milestone identities across
  all surfaces.
- Persist Analytics deep links and Ask Delta context across web and future
  desktop.
- Establish consistent loading, partial, stale, unavailable, and integrity
  states.

## 19. Governing references

This contract is constrained by:

- Delta Product Specification V1 for object identity, Activity, Brief,
  Insight, Recommendation, Ask Delta, cross-device consistency, and
  consumer/Operator separation;
- Delta Experience Specification V1 for answer-first hierarchy, evidence,
  uncertainty, dashboards, failures, progressive disclosure, and contextual
  conversation;
- Delta HQ Desktop Architecture for the shared `/hq` renderer and future
  Delta.app shell boundary;
- the future Organizational Observability contract for all metric, health,
  telemetry, time-series, baseline, target, and projection truth.
