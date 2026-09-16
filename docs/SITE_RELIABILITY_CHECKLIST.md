# Site reliability follow-up

Scope: the public-site rebuild candidate and its existing access-request flow.
This is not a claim that all Delta production services are hardened. No service,
database, billing setting, monitoring subscription, or deployment was changed.

## Implemented in this candidate

| Requested control                | Implementation and boundary                                                                                                                                                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate and API limits              | Access submissions: 5 requests per IP per 15 minutes per running instance; bounded 10,000-key limiter, 429 and Retry-After. This is NOT a fleet-wide quota. Trusted proxy header handling and distributed limits require deployment review.                          |
| Request size limits              | Access submission accepts JSON only, at most 8 KiB including streamed bodies; a 5-second body-read deadline. Multipart uploads are rejected on this endpoint.                                                                                                        |
| Timeouts and failed requests     | Shared browser helper: one attempt, 15-second deadline including JSON decoding, abort support, fixed errors, no automatic write retries. Access-admin transport: 10-second deadline, including owner authentication.                                                 |
| Duplicate submissions            | Immediate in-flight locks on access/contact/review actions; existing database email uniqueness arbitrates simultaneous access inserts. A duplicate insert returns the same generic accepted response. No new database schema.                                        |
| Loading, empty, and error states | Public route loading/error boundaries; forms preserve input on failure; owner review distinguishes pending, failed, valid empty, and paginated results. A query-window limit is disclosed rather than presented as a complete list.                                  |
| Query/output bounds              | Owner list selects six review fields instead of all columns, returns 50 rows plus a one-row lookahead, orders by submitted time and ID, and caps offset at 10,000. No expensive total-count query. Offset pages are not a snapshot if concurrent submissions arrive. |
| Safe logging                     | Access submit/list failures and public render failures emit fixed event codes only, not submitted values, credentials, database error objects, or provider payloads. This is scoped to the touched paths, not a system-wide logging audit.                           |
| Simultaneous users               | Mocked concurrency tests cover 30 duplicate-email requests, 25 same-IP requests, and a 100-request limiter burst; tests assert bounds and one stored fixture identity. These are not real database/load benchmarks.                                                  |

## Existing controls retained

- Next compression, static page generation/caching, and AVIF/WebP image support
  are already configured. No compression middleware or dependency was added.
- Personal, authenticated, and access-request responses use `no-store`; the new
  client helper never caches them. No shared cache of personal context was added.
- The existing chat route has a 64 KiB input limit, a 30-second deadline, and a
  local 10/minute limiter. It is not a global provider-spending cap.
- The committed access schema already declares a unique lowercased-email index,
  a status/submitted-time index, and an event-history lookup index. Deployment of
  those indexes was NOT inspected in this pass. The all-status list sort is not
  assumed covered by the status-leading index; confirm an EXPLAIN plan in an
  approved DB lane before adding a new `(submitted_at, id)` index or keyset paging.
- `/api/health` exists for site health/revision checks. It is not proof of healthy
  backend dependencies or an installed uptime monitor.

## Not implemented or claimed

| Request                       | Remaining prerequisite                                                                                                                                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global spending caps          | Owner must choose a hard amount and billing window. Enforce atomically at the paid-provider boundary, accounting for concurrent reservations and uncertain outcomes; provider-account alerts alone are not a hard cutoff. Public pages/examples make no model calls. No pricing or provider settings changed.        |
| Fleet-wide rate limiting      | Review the existing Vercel/edge or backend shared limiter and approved cost/configuration before activation. In-memory IP buckets can be bypassed across instances and are not a spending defense.                                                                                                                   |
| Duplicate payments            | No checkout/payment execution is exposed by this site scope. A future payment flow must use provider idempotency keys and durable webhook/order uniqueness. Disabled buttons alone are not payment protection.                                                                                                       |
| Exactly-once external writes  | Contact submission and owner invitation still need backend/provider-side idempotency for cross-tab, cross-instance, or uncertain-delivery retries. The existing invitation flow can race across owners. Client locks do not solve that race; use the owning backend's durable mechanism, not another in-memory lock. |
| Upload policy                 | No new upload endpoint exists. Do not add one merely to add limits. Before activation, require server-side byte/type limits, content validation, decompression limits, and private storage policy.                                                                                                                   |
| DB index/optimization rollout | No migration, live EXPLAIN, database write, or schema change was performed. Inspect actual workload/query plans before creating indexes; validate write overhead and rollback separately.                                                                                                                            |
| Uptime monitoring             | Not activated. Requires a chosen existing monitor, cadence, alert destination, and deployment approval. Monitor site plus backend readiness separately and test an alert without exposing personal data. No paid service or recurring model job was created.                                                         |
| Production error collection   | Fixed local/host log events are implemented for touched paths. No new external collector, retention policy, or alert integration was activated.                                                                                                                                                                      |
| Backup restoration            | NOT tested. Requires an approved existing backup and an isolated disposable restore target. Verify schema, row counts, constraints/RLS, checksums where supported, and recovery duration against agreed RPO/RTO. Never restore over production for a test. No backup was read or altered.                            |

## Verification and release

Automated tests mock storage and HTTP. No model, live Supabase, email, payment,
or other production calls are required. Run full Jest, lint, a production build,
the site advisory verification, and `git diff --check`. Browser checks use local
pages and mocked submissions. Keep this candidate isolated until reviewed;
commit does not authorize merge, push, deployment, or operational configuration.

Verified locally on 2026-09-16:

- Focused request, authorization, form, pagination, and public-page tests: 34 pass.
- Full site Jest: 30 suites, 170 pass, 5 existing skips.
- Lint: zero errors, four existing warnings in unchanged dashboard, OS Console,
  and AuthContext files.
- Production build and TypeScript: pass, using the public backend URL as build
  configuration only; no credentials or backend requests.
- Browser: 36 public route/viewport checks at widths 320 through 1920; zero
  overflow, broken images, or page errors. Contact rejection/success simulated;
  zero live support deliveries or external browser requests.
- Site preflight and advisory safety scan completed; the scan reports existing
  safety-related wording and is not a security certification.
- `git diff --check`: pass.
