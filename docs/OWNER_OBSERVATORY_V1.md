# Owner Observatory V1

## Boundary

`/hq` is an owner-only reporting surface. Both the server page and
`GET /api/hq/report` independently call Supabase `getUser()` and require a
confirmed, non-anonymous user whose ID equals server-only
`DELTA_HQ_OWNER_USER_ID`. Client roles, emails, and user metadata grant no access.
Missing configuration fails closed. The report is never a public asset, static
page, browser-storage entry, or client environment variable.

The design-only `/observatory-preview` route uses conspicuously synthetic data
and is blocked with HTTP 404 by middleware outside development. It cannot fetch
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
layout rebuilds. Wheel, touch, keyboard, and button zoom share a 15%-300% limit.
Fit frames the current graph; Reset restores its initial viewport. The original
`/delta-logo.svg` is used unchanged. Overview, Architecture, Activity & quality,
and Settings are separate destinations with browser history support. Node
selection opens a dismissible inspector. Chat starts closed.
Rebuild changes the client layout only. Refresh rereads the last
validated report; it does not scan repositories. The chat panel is deterministic
local view control, not an LLM: no provider cost, execution, authority changes,
or arbitrary commands. Chat is ephemeral and is not persisted.

Sign-in acknowledges missing Supabase configuration before collecting credentials.
Configured sign-in prevents duplicate submission, has a bounded deadline, and
performs a full navigation after session establishment. Optional profile queries
run outside the Supabase auth callback lock; they cannot hold login open. Server
authorization remains mandatory. Sign-out requires a same-origin POST, clears
the displayed report, and revokes only the local session with cleared cookies.

Private pages have no-store/noindex headers, restricted CSP and no third-party
visual embeds. The Monte reference was inspected directly at
`/Users/egeng/Documents/Monte Management` without modifying its source. The
workspace uses its numbered top-navigation, Georgia/Inter typography contrast,
fine dividing rules, understated hover motion and clock treatment. The actual
Delta SVG remains unchanged. The overview now includes an interactive source
map; the detailed Architecture view retains filtering and node inspection.
No Monte portraits, private data, external scripts, custom cursor, or blocking
intro animation were copied. Reduced-motion preferences are preserved.
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

The fixture-only browser journey is reproducible with:

```sh
node scripts/observatory-journey-smoke.cjs
```

It requires Playwright (or `PLAYWRIGHT_MODULE` pointing to the installed module)
and Chrome. It starts a loopback auth fixture and a separate dev server on 3112;
stop other dev servers in this worktree first. It checks real browser cookies,
owner/non-owner access, sign-out, navigation, wheel zoom limits, filters, node
inspection, history, local chat and responsive overflow. It does not authenticate
a real account or use real report data. Temporary fixture files are removed.

Real owner sign-in and hosted daily delivery remain untested/unactivated.
Neither the mock journey nor advisory scans are a security certification.
