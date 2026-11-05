# Connected sites delivery

Local implementation only. No merge, push, deployment, authentication changes,
provider calls or canonical history writes were performed.

## History

- Complete retained census timeline leads the History view; the prior narrative
  and comparison-specific evidence remain below it.
- Both live-store and committed publication adapters now enumerate census
  snapshots independently of comparison records. Only bounded numeric fields,
  scope, dates, quality and source hashes are projected.
- Default summary compares the first and latest complete, comparable records;
  recent change is separate. Missing values, incompatible scope/methodology and
  conflicting comparison records are not treated as growth.
- The pinned publication has three canonical censuses (August 7, August 12,
  October 28), not a claim that every census ever created was retained.
- `/hq/history` uses the existing owner-gated HQ implementation. `/history`
  redirects there. In production the old `/dashboard` redirects to `/hq`; its
  local-only development implementation is unchanged.

## Navigation and relationship

Shared destinations connect conversation, desktop workspace, connections,
settings and HQ. HQ links back to workspace/conversation/connections. Public
navigation includes About and Ecosystem; the latter explains Geng Systems and
links to its site and fictional demo without publishing owner data.

Related isolated worktrees:

- `connected-geng-20261105`: diagrams, colored section bands, persistent
  navigation, breadcrumbs, Delta relationship, About and discreet portfolio link.
- `connected-geng-demo-20261105`: fixed public return link in the demo banner.

## Verification

- 511 Jest assertions passed, five skipped, across 95 suites. Run the two
  `scripts/export-*.test.cjs` files with Node's test runner, not Jest: four pass.
- Typechecked production build passed with a dummy loopback backend URL and no
  production credentials. Existing webpack createRequire warnings remain.
- Preflight and advisory safety scan completed. Repository-wide lint retains
  14 pre-existing CommonJS import errors in three untouched script files and
  existing effect warnings; touched-code lint is checked separately.
- Playwright checked public navigation at 390, 820, 900, 1024, 1100 and 1440px,
  mobile menu navigation, redirects, and denied unconfigured private endpoints.
- History screenshots were rendered locally from the component and bounded
  archive, not through an authenticated production session. Interactive selection
  and metric changes are covered by component tests. No auth bypass route added.
- Geng production build and 12 checks pass; its demo return-link test uses static
  AST inspection only (no app, SQLite database or provider started).

Logs and screenshots: `/tmp/connected-*`. Portrait intentionally deferred until
Eric supplies the selected image. Live sites are unchanged.
