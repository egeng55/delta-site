# Delta public site rebuild

## Scope and ownership

Candidate: `feature/delta-intelligence-site-rebuild`, based on delta-site
`941a6dee3573307c9858bedfbcb4c0f9a0ee6720`.

Rebuild the public home, product, development/research, about, access, and contact
pages. Use isolated CSS modules and public components, leaving the legacy
authenticated application, legal documents, backend endpoints, middleware,
deployment configuration, packages, and access policy unchanged.

The public website describes the wider Delta system. It does not grant access to
internal engineering or research tooling. The existing access manifest remains
the source for preview entitlement. Request and invitation behavior is unchanged.

## Content provenance

The deployed homepage was inspected read-only on September 16, 2026. Its emphasis
on two early proofs and prospective personal briefs no longer described the full
committed implementation. The rebuilt copy distinguishes implementation from
availability and measured quality.

Content was checked against delta-agent committed source at
`42a84b853ba3fc903ef47337f54c27cee5e6ad1b`, including:

| Public subject | Committed reference in delta-agent | Boundary |
| --- | --- | --- |
| Briefs and current evidence | `docs/DAILY_INTELLIGENCE_BRIEF_V1.md` | Owner read; dated or unavailable evidence; no medical-quality claim |
| Weather and continuity | `docs/CONTEXT_CAPABILITY_ACTIVATION_V1.md` | Material context only; separate authorization; history is not current truth |
| Engineering | `docs/DELTA_DURABLE_ENGINEERING.md`, `docs/DELTA_CHANGE_IMPACT_REPORT.md` | Native tools and declared impact exist; autonomous task quality is not established |
| Research | `docs/PROSPECT_INTELLIGENCE_OPERATIONAL_SYSTEM_V1.md`, `docs/PROSPECT_GOVERNED_DISCOVERY_V1.md` | Source-backed research is separate from contact and publishing authority |
| Financial/career context | Architecture decisions 0022 and 0023 | Education/read-only context, not trading, applications, or outreach |
| Synthesis | `docs/INTELLIGENCE_SYNTHESIS_V1.md` | Bounded evaluation, not general collaboration or performance guarantees |
| Preview, people, contact | Existing site access manifest and About/Contact pages | Same access scope, names, public contact, and location |

No private runtime artifacts, real health values, client records, credentials,
or unpublished worktree changes are used as marketing evidence. No numeric
capability count or test count is used as a product-performance claim.

## Product walkthrough

The interactive examples are static, authored illustrations, visibly labeled
as not live data. Tabs change local component state only. There is no prompt
submission, tool dispatch, connector access, persistence, or model call.

The contact form retains the existing `/support/submit` contract and submits
only after a visitor sends the form. Rejection and network errors retain their
input without displaying server payloads. A 15-second abort bounds the request;
the site does not retry automatically or claim delivery after an uncertain result.

## Verification and release boundary

Run focused public-site and public-identity tests, the complete Jest suite,
lint, TypeScript, production build, site advisory verification, and diff checks.
Check all public routes and interactive tabs, navigation, FAQ, and mocked contact
states at mobile/tablet/desktop sizes. Do not submit a real contact request or
authenticate to test the public pages.

Local preview uses no copied secret files. Login/account/provider integrations
must be verified in the approved deployment environment during a separately
authorized release; a public-site rebuild does not authorize deployment.

## Candidate results

- Focused public UI/identity: 12 passed.
- Full Jest suite: 25 suites; 146 passed, 5 pre-existing skips.
- Lint: zero errors; four existing effect warnings in untouched dashboard,
  OSConsole, and AuthContext code.
- TypeScript and production build: passed with the non-secret public setting
  `NEXT_PUBLIC_DELTA_API_URL=https://delta-80ht.onrender.com`. Without this
  required existing setting, production build correctly stops. No secret files
  were copied into the worktree.
- Browser: six rebuilt routes at 320, 390, 768, 1280, 1440, and 1920 pixels
  (36 checks), no horizontal overflow or browser exceptions. Loaded images
  resolve. The three mobile example panels remain exactly 475 pixels high.
- Tab keyboard selection, mobile navigation, Escape focus return, FAQ expansion,
  and contact rejection/success passed. Two support requests were intercepted
  locally; zero support requests or connector calls went to a live service.
- Site verification selection, preflight, advisory safety scan, and diff check
  completed. The advisory scanner reports existing safety wording across the
  repository; it is not a security certification.
- Scope check: no changes to auth routes/context, API routes, middleware,
  legal documents, Supabase, desktop, package/lockfiles, or CI/deployment config.

Development preview: `http://127.0.0.1:3108`. Public identity and copy still need
owner review before a separately approved merge/push/deployment.
