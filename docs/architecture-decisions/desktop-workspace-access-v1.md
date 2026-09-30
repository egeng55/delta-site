# Desktop workspace access V1

Date: 2026-09-30

Status: Implemented in the site feature worktree. Live owner identity and a provider-free audit were verified through the new workspace. Canonical architecture reconciliation remains an integration step.

## Context

The desktop product needs Personal, Studio and Control experiences. The existing HQ and local runtime serve one authenticated owner. Product subscription roles, UI selection and the agent executor registry are different authority boundaries; none alone authorizes a second user to read owner history or execute against the owner's local runtime.

## Decision

Reuse the site/Electron surface and existing runtime handlers. Add a site-owned access projection resolved from a fresh Supabase `getUser()` record, requiring a confirmed nonanonymous account. The server-only `DELTA_HQ_OWNER_USER_ID` is the sole platform-owner identity. `DELTA_WORKSPACE_GRANTS` maps verified user IDs to consumer, developer, stakeholder or admin; it cannot grant owner. Valid verified users without a grant receive consumer access. Missing authentication/owner configuration and malformed grant configuration fail closed.

Role names select explicit permissions. Consumer access includes Personal; developer includes Personal and fixture-only Studio; stakeholder includes Control summaries; admin includes all three without runtime authority. Only owner has `runtime.execute`, `runtime.approve` and private owner inspection. Grants are resolved per request and never inferred from email, user metadata, subscription status or a client-supplied role.

`GET /api/workspace/access` returns the caller's access projection. `GET /api/workspace/summary` independently requires `control.summary.read`, then returns only closed census counts, observation time and explicit freshness/unobserved statuses. This shares registered-source totals with deliberately granted Control viewers; it does not expose task prompts, account data, paths, raw errors, graphs, source contents or owner report payloads. The existing hosted reader's owner gate remains in force, so nonowners can receive unavailable data rather than bypassing that boundary.

The workspace page verifies access before instantiating the application. API responses are private and uncached. `/workspace-preview` uses a fixed synthetic identity, skips private authentication/data calls and is rejected outside development. A role selection in that preview is presentation only.

Desktop privileged IPC retains fixed allowlisted operations, validates the sending frame and verifies the current server-resolved owner role plus runtime permission. Renderer claims never authorize native operations. Existing exact-action runtime approvals, repository scope and spending constraints remain in force.

## Consequences and limits

- The owner can enter all three experiences, while other accounts receive explicitly granted surfaces and data projections.
- No user, membership, database schema, provider budget or environment value is changed by this feature.
- Server environment grants are a bounded first implementation, not a membership editor or tenant administration service. Persisted deployment configuration changes require the deployment process to restart/reload the server environment.
- Consumer/developer accounts cannot run against the owner's local daemon. Per-user runtime provisioning, tenant-scoped history, delegated execution, recovery and step-up authentication need separate implementation and evidence.
- Offline simulations validate fixtures and parsers. Source census counts do not prove execution quality, live availability, deployment or billing totals.
- Existing owner-only HQ routes retain their original authorization. This decision does not promote a capability or extend agent autonomy.

## Verification

The focused access/API tests cover metadata spoofing, malformed or overprivileged grants, grant removal, cookie refresh, nonowner runtime denial, summary authorization and redaction. Page and middleware tests cover denial before application instantiation, unauthenticated workspace routing, production preview rejection and disconnected development previews. Electron tests cover sender validation and fresh owner permission checks. Repository tests/build and live authenticated-owner validation are reported separately by the integrating task.
