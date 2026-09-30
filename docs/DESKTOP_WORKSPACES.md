# Delta desktop workspaces

The desktop product now has a shared `/workspace` surface for Personal, Studio,
and Control. The interface uses Delta blue, light and dark appearance, animated
orbital artwork, page transitions, keyboard navigation, and a command palette.
Ambient motion can be paused, and styles respect reduced-motion preferences.

This document describes the implemented surface and its boundaries. Source
availability and a successful page load are not proof of authenticated runtime
execution, deployment, or a finished desktop release.

## Routes and ownership

| Route | Purpose | Access |
| --- | --- | --- |
| `/workspace` | New three-workspace application shell | Verified account; workspace visibility follows server grants |
| `/workspace?task=<uuid>` | Open the Activity view for a retained task | Same account checks, then owner runtime checks |
| `/workspace-preview` | Interactive design preview with offline simulations | Development builds only; no live data or execution |
| `/workspace-preview?role=developer` | Preview the navigation for a selected role | Development-only presentation fixture; does not grant real permissions |
| `/hq` | Existing detailed Observatory and task evidence | Existing owner-only checks remain in force |
| `/api/workspace/access` | Current verified workspace role and permissions | Authenticated server resolution on each request |
| `/api/workspace/summary` | Restricted source-architecture count/status projection | `control.summary.read` |

The shell reuses existing Observatory components and lifecycle APIs. Its entry
point is [`src/app/workspace/page.tsx`](../src/app/workspace/page.tsx), and the
workspace layout is
[`DesktopWorkspace.tsx`](../src/components/desktop/DesktopWorkspace.tsx).
The preview route supplies a fixed synthetic identity and passes `preview` to
its panels. Changing a preview role does not change the signed-in account.
Preview is unavailable in production builds.

## Personal

- **Overview:** an objective composer and suggested starting points. “Review
  request” opens Activity without executing the request.
- **Activity:** the existing execution desk supports a read-only capability
  audit, repository/worktree review, and an engineering request selected from
  prepared manifests. It exposes retained task history, event stages, exact
  approval envelopes, continuation, cancellation, and captured review evidence.
- **Results:** searchable, paginated retained terminal/review outcomes, including
  budget-stopped and interrupted work. Evidence links open Activity in `/workspace`.
  A failed task is retained
  as an outcome and is not represented as a successful result.
- **Connections:** existing account-settings navigation and explicit connection
  states. Personal memory and additional connectors are not newly provisioned
  by this shell.

An engineering manifest supplies the actual objective, repository scope,
acceptance checks, and spending cap. Free text is currently a task label for
that mode; this interface does not implement unrestricted intent-to-execution
for arbitrary requests. Runtime access must be separately configured. Provider
execution remains subject to the existing runtime session, budgets, and exact
approvals.

Consumer accounts can enter Personal, but do not receive access to the owner's
local runtime. Until per-user runtime tenancy is implemented, they see a clear
unprovisioned state for task execution and retained results.

## Studio

- **Workbench:** reuses the execution desk for owner-authorized work.
- **Test lab:** fixed read-only endpoint inspector plus six offline contract
  simulations, implemented in [`StudioLab.tsx`](../src/components/desktop/StudioLab.tsx)
  and [`studioLab.ts`](../src/lib/studioLab.ts).
- **Engineering:** existing repository/worktree evidence, owner-only.
- **Runtime:** existing runtime observations and capability coverage, owner-only.

### Endpoint inspector

The inspector has five fixed GET destinations:

| Label | Route |
| --- | --- |
| Runtime observation | `/api/hq/workspace` |
| Architecture report | `/api/hq/report` |
| Engineering inventory | `/api/hq/engineering` |
| Backend & budget | `/api/hq/operations` |
| Owner session | `/api/hq/lifecycle/session` |

It performs one read per click, uses a 12-second deadline, prevents overlapping
requests, and does not automatically retry. Only an allowlisted response
projection is shown. Raw payloads, request headers, task text, local paths, and
credentials are not retained by the lab. Authentication errors remain denied;
missing or malformed observations are not displayed as healthy.

Live inspection requires owner access and is disabled in design preview. This
is not a general HTTP client: it does not accept arbitrary URLs, custom headers,
request bodies, or mutation verbs. A successful endpoint response verifies its
response contract, not the correctness of the capability behind it.

### Offline simulations

The available scenarios exercise the client parsers and accounting/error
contracts with fixed local input:

1. Valid runtime observation.
2. Request timeout classification.
3. Access-denied classification.
4. Budget-stop accounting, including missing costs.
5. Duplicate command rejection.
6. Malformed-response rejection and exclusion of unexpected fields.

These scenarios use no provider calls. They do not run backend tests, inject
real network outages, qualify model intelligence, test concurrent customers,
or prove runtime approval enforcement. The latest 30 runs remain in the current
tab; JSON export contains fixture assertions and measured local duration only.
It is not a durable test registry or CI runner.

## Control

- **Overview/Reports:** read a closed summary projection of source counts,
  structural mapping coverage, and snapshot freshness. Export downloads that
  permitted projection with its limitations.
- **Costs:** existing provider-cost component, owner-only. Recorded provider
  usage is distinct from runtime reservations, request caps, and invoices.
- **Access:** shows the current verified role, workspaces, and permissions.
  It does not edit memberships, transfer ownership, or recover accounts.

The summary endpoint excludes private task content, prompts, credentials,
repository paths, and raw reports. It does not measure customer activity,
execution success, runtime health, or deployment. Those values remain
unobserved instead of being inferred from a source registry. Existing hosted
observation access checks still apply; unavailable source evidence remains
unavailable for a nonowner summary request.

## Roles and authorization

The server resolves a current verified identity through `getWorkspaceAccess`.
It uses confirmed account identity rather than client-supplied metadata, query
parameters, or renderer role claims. Workspace visibility is one presentation
of the permission model, not the enforcement boundary.

| Role | Workspaces | Granted work |
| --- | --- | --- |
| Consumer | Personal | Personal shell; no shared owner runtime |
| Developer | Personal, Studio | Personal shell and offline Studio simulations |
| Stakeholder | Control | Restricted read-only source summaries |
| Admin | Personal, Studio, Control | Combined nonowner workspace access; no owner runtime or provider billing |
| Owner | Personal, Studio, Control | Existing owner inspection/execution/approval paths, within runtime policy |

`DELTA_HQ_OWNER_USER_ID` identifies the platform owner by verified account UUID.
Optional `DELTA_WORKSPACE_GRANTS` is a server-held JSON object mapping verified
user UUIDs to `consumer`, `developer`, `stakeholder`, or `admin`. It cannot assign
`owner`. Absent explicit grants, other confirmed accounts receive the consumer
role. Invalid configuration fails closed. Do not put these administrative
configuration values into public client configuration or commit private account
identifiers to documentation.

The access endpoint returns `{access:{userId,role,workspaces,permissions}}` with
private/no-store headers. The summary endpoint independently checks
`control.summary.read`; existing owner APIs keep their existing server checks.
Owner permission does not bypass a runtime's per-task scope, budget, or approval
requirements. The source policy is
[`workspaceAccess.ts`](../src/lib/workspaceAccess.ts) and server resolution is
[`workspaceAccessServer.ts`](../src/lib/workspaceAccessServer.ts).

## Native desktop boundary

Electron now defaults to `http://127.0.0.1:3000/workspace`.
`DELTA_HQ_URL`, `DELTA_DESKTOP_URL`, and `DELTA_OS_CONSOLE_URL` overrides remain
supported, in that precedence order. Explicit `/hq` overrides continue to work.
Credential-bearing URL userinfo is rejected.

All bridge calls validate the originating window, exact main frame, and
configured origin. Privileged service start/stop/status/log/config calls also
make a fresh, main-process request to `/api/workspace/access` using the owning
Electron session. Both `role: owner` and `runtime.execute` are required. Cookie
values and renderer identity claims are not passed as IPC authorization inputs.
Authorization rejects redirects, malformed/non-JSON/oversized responses and
timeouts, and rechecks the originating frame after the request.

Native clipboard and browser actions have bounded input. External navigation
is origin-restricted; arbitrary files and webviews are blocked. Service changes
are serialized and bounded to prevent simultaneous duplicate launches.
Diagnostics redact known environment credentials and common credential formats;
raw credentials should never be logged by services in the first place.

The shell retains context isolation, sandboxing, disabled Node integration,
denied runtime permission requests, fixed service definitions, and `shell:
false`. It does not provide arbitrary command execution, microphones, backend
TTS, or notifications. See [`ipc-policy.cjs`](../desktop/ipc-policy.cjs) and
[`main.cjs`](../desktop/main.cjs).

If the application service is unreachable, a bundled blue recovery screen
supports reconnect, opening the configured workspace in a browser, and copying
connection details. Recovery mode cannot inspect or start services without a
verified application session. Bootstrap the configured application service
outside the disconnected recovery page.

## Local launch

Run from the intended site checkout with its existing approved authentication
and runtime configuration available to the process. Do not copy credentials
into the URL or add shared environment-file writes for this launch.

Start the local application service:

```bash
DELTA_HQ_SITE_ORIGIN=http://127.0.0.1:4340 npm run dev -- --webpack --hostname 127.0.0.1 --port 4340
```

The configured origin must match the served origin for same-origin mutation
checks. The design preview is then available at
`http://127.0.0.1:4340/workspace-preview`; authenticated use starts at
`http://127.0.0.1:4340/workspace`.

Start Electron in a second terminal in the same checkout:

```bash
DELTA_HQ_URL=http://127.0.0.1:4340/workspace npm run desktop:dev
```

Electron has a separate cookie session from a browser tab, so sign in inside
Electron as well. A signed-in browser tab does not establish native owner
access. Development service-manager commands remain fixed to their original
local service definitions; this command points the shell at an already running
service on port 4340 rather than changing those definitions.

For a bounded shell load check that does not start backend services:

```bash
DELTA_HQ_URL=http://127.0.0.1:4340/workspace npm run desktop:smoke
```

A smoke result of `hq_loaded` reports that the configured document loaded. It
can be the sign-in/configuration gate and does not prove owner authorization or
live runtime execution. `fallback_loaded` reports recovery UI availability.

## Remaining product and release work

- Per-user and per-organization runtime tenancy, task storage, resource scopes,
  and execution grants. Nonowners cannot share the owner's runtime as a shortcut.
- Membership editing, owner recovery/transfer, and operational administration.
- Consumer general-purpose command routing and personal memory provisioning.
- A broader endpoint/test catalog, durable saved scenarios, paid qualification
  campaigns, and controlled CI integration.
- Business analytics, customer usage, aggregate outcomes, production health,
  and richer reporting backed by the appropriate authoritative data.
- Mobile migration to the shared identity/task contracts. This desktop pass does
  not upgrade the Expo app.
- Packaged service delivery, signing/notarization, installers, automatic updates,
  and release publishing. Packaged mode remains a shell for a separately running
  service and does not launch local development services.

## Verified in this worktree — 2026-09-30

- Full repository suite: 81 suites passed; 452 tests passed and 5 skipped.
- Production webpack build and TypeScript passed. Webpack retains an existing
  `localArchitecturePreview.ts` createRequire warning. Lint has zero errors and
  four existing warnings outside this feature; changed page files also lint clean.
- Desktop syntax/config checks and service smoke passed. Native Electron smoke
  loaded `/workspace` (`hq_loaded`); authenticated native IPC was tested with
  fixtures, not a newly signed-in Electron user.
- The browser recognized the existing owner account. Renewing its existing
  Keychain-backed runtime session succeeded with the matching local site origin.
  One read-only capability audit completed and was retained as task
  `415feee2-e6eb-4c6b-9f26-428fa4cfdf39`: 158 registered capabilities, 80 requiring
  explicit approval. Paid provider execution stayed disabled.
- All six Studio scenarios passed interactively. A real runtime-observation GET
  returned HTTP 200 with `connection: unavailable`; the inspector retained that
  distinction. Lifecycle execution worked, but this broader status source was
  not verified connected.
- Control displayed the live source census (158 capabilities, 28 system
  definitions, 5 repositories), coverage bars and its source timestamp. These
  are source measurements, not business analytics or capability qualification.
- Browser checks covered light/dark appearance, 390px layout without page
  overflow, empty command-palette search, Escape/focus return, retained stopped
  results, and Results-to-Activity task navigation in the production build.
- Unauthenticated access and summary API calls returned 401/private no-store.
  The production preview rendered Next's not-found fallback without the app;
  its streamed document returned HTTP 200. Server page/API gates enforce the
  new boundaries independently of routing middleware. The existing root
  middleware was not emitted in this Next build and its migration remains a
  separate integration concern; middleware unit checks alone do not prove a
  live routing redirect.

Implementation is isolated on `feature/desktop-workspaces-20260930`. Existing
historian edits in the source checkout were preserved. The source declaration
and ADR accompany this worktree; canonical agent-registry reconciliation,
merge, push, deployment and packaged release are not claimed by this validation.
