# Connected sites delivery

Release candidate approved for publication on November 5, 2026. Based on the
currently deployed `3295782`, with the retained-history publication prerequisite
and this connected-sites change only. Unreleased Gmail and Organization changes
on local main are intentionally excluded. No authentication-policy, database,
provider-execution or canonical history changes are part of this release.

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

- `npm test -- --runInBand --watchman=false`: 492 Jest tests passed, five skipped,
  across 90 suites, plus two Node tests. The standard command now selects the
  correct runner for CommonJS Node tests rather than treating them as Jest tests.
- Typechecked production build passed with a dummy loopback backend URL and no
  production credentials. Existing webpack createRequire warnings remain.
- Clean dependency installation completed. Next.js and its ESLint configuration
  are pinned to 16.4.5 to resolve the production dependency audit findings.
  `npm audit --omit=dev --audit-level=moderate` reports zero vulnerabilities.
- Repository-wide lint passes with zero errors and four existing effect warnings.
  CommonJS import rules are scoped to Node script tests and the publication script.
- Playwright checked public navigation at 390, 820, 900, 1024, 1100 and 1440px,
  mobile menu navigation, redirects, and denied unconfigured private endpoints.
- History screenshots were rendered locally from the component and bounded
  archive, not through an authenticated production session. Interactive selection
  and metric changes are covered by component tests. No auth bypass route added.
- Geng clean install, production build, 12 checks and production dependency audit
  pass. The demo change is rebased on the current live `c3b5938`; 15 bounded demo
  tests and 86 JavaScript tests pass. Demo tests use disposable fictional databases
  with outbound access denied; no live database is accessed.

Logs and screenshots: `/tmp/connected-*`. Portrait intentionally deferred until
Eric supplies the selected image. Deployment completion requires provider READY
or live status, exact source-commit verification and post-release browser checks.
