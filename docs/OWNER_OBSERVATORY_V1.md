# Owner Observatory V1

## Boundary

`/hq` is an owner-only reporting surface. Both the server page and
`GET /api/hq/report` independently call Supabase `getUser()` and require a
confirmed, non-anonymous user whose ID equals server-only
`DELTA_HQ_OWNER_USER_ID`. Client roles, emails, and user metadata grant no access.
Missing configuration fails closed. The report is never a public asset, static
page, browser-storage entry, or client environment variable.

The design-only `/observatory-preview` route uses conspicuously synthetic data
and invokes the not-found boundary outside development. Next's streamed response
may retain HTTP 200, but it contains no preview/report content. It cannot fetch
the private report.

## Data and daily updates

The local exporter reads committed `main` trees from the five canonical roots,
not dirty files or whichever branch happens to be checked out. It projects only
repository SHAs, file/test-file counts, explicit architecture/capability/tool
registry mappings and static edges. These are declarations, not runtime usage,
qualification, production parity, CI success, or autonomous collaboration.

```sh
node scripts/observatory-export.cjs \
  --workspace /Users/egeng/delta \
  --graphify /Users/egeng/delta-visualizations/graphify-agent-2026-09-16 \
  --out .owner-reports/latest.json
```

Graphify's optional module graph retains its own original extraction SHA/date.
The current system/capability views use the same graph contract but are registry
projections, not a fresh AST extraction. Export never invokes a model or runs
another repository's scripts. The producer validates a closed, bounded schema,
uses an exclusive lock, private permissions, file/directory synchronization,
atomic replacement and readback verification. An existing lock is not stolen.
Ninety prior census snapshots are retained; missing history is not fabricated.
Reports older than 26 hours are visibly stale. Source commits still need review
to determine deployment parity.

A trusted local daily runner can invoke this command after existing checks. No
scheduler, automatic repair, deployment, or paid service is enabled by this
candidate. A hosted server must receive the validated report through a reviewed
private delivery process before it can show daily changes. Local files are not
automatically available on Vercel. Do not put the report in `public/` or add an
unauthenticated upload endpoint. Quality and runtime telemetry remain explicitly
unavailable until separately integrated; test-file counts are not test passes.

## Activation

Set the existing Supabase URL/anon configuration and server-only
`DELTA_HQ_OWNER_USER_ID` to the owner's authenticated user UUID. Set server-only
`DELTA_HQ_REPORT_PATH` to the absolute private report path on the serving host.
Do not use `NEXT_PUBLIC_` for either setting. The reader rejects symlink files,
oversized/malformed reports and synthetic reports. No credential is embedded in
the exporter or report. Authentication and deployment activation are separate;
this implementation does not configure or change production secrets.

## Interaction and privacy

Graphs support search, repository filters, selection, zoom, fitting and seeded
layout rebuilds. Rebuild changes the client layout only. Refresh rereads the last
validated report; it does not scan repositories. The chat panel is deterministic
local view control, not an LLM: no provider cost, execution, authority changes,
or arbitrary commands. Chat is ephemeral and is not persisted.

Private pages have no-store/noindex headers, restricted CSP and no third-party
visual embeds. Monte's spacing/motion/clock treatment informed the design;
Unicorn is not integrated. Navigation clears private data after a rejected
refresh. Previously delivered browser content cannot be remotely erased.
The CSP retains Next's inline script allowance; this is not a claim of complete
security certification. No health records, contacts, calendar content, raw run
artifacts, credentials, or runtime error payloads are exported.

## Verification

Focused tests cover exact owner checks, authorization-before-read, closed schema,
synthetic/stale states, exporter history/locking/rollback, dirty-source exclusion,
safe local chat commands and unavailable states. Run the full site Jest suite,
lint and production build before promotion. Browser verification must include
desktop/mobile graph rendering, filtering, empty results, clock, chat, and the
unauthenticated gate. No live Supabase session or production mutation is required.

Candidate verification on 2026-09-16: 35 Jest suites passed (199 tests passed,
5 existing skips); production build/typecheck passed; lint passed with four
pre-existing warnings in unchanged files; production dependency audit reported
zero advisories. Browser checks passed at 320, 390, 768, 1440 and 1920 pixels,
including nonblank graph pixels, filtering, tabs, zoom, clock, local commands and
the unconfigured owner gate. Production rendering exposed no preview data.
Preflight and the advisory safety scan ran; neither is a security certification.
Real owner sign-in and hosted daily delivery remain untested/unactivated.
