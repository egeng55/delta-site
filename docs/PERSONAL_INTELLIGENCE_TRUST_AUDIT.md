# Delta Personal Intelligence Trust Audit

Last reviewed: August 3, 2026.

## Current Product Decision

Delta is a private personal-intelligence preview. It is not currently a
startup sales funnel, paid subscription, team product, medical device, or
always-on autonomous assistant.

The canonical machine-readable source for public capability maturity and
access claims is:

- `src/lib/publicCapabilityManifest.ts`

Public access is request-based and manually approved. Open self-service account
creation is closed. A request does not guarantee access, and approved access
covers only capabilities marked `private_preview` in the manifest. Capabilities
marked `proof` or `research` may be explained publicly but are not included in
preview access. Capabilities marked `internal` must not appear as consumer
product claims.

The first production-facing capability chain is:

```text
authenticated Delta owner
  -> encrypted WHOOP OAuth connection
  -> owner-scoped normalized WHOOP records
  -> seven read-only MCP tools
  -> ChatGPT custom app
```

## Controls Implemented In This Cycle

- Consent, account export, and account deletion request bodies are checked
  against the authenticated owner in the backend.
- New WHOOP syncs do not persist raw provider response bodies and purge
  historical raw rows for the owner.
- WHOOP refresh is explicit and bounded.
- WHOOP disconnect calls the provider revocation endpoint and deletes stored
  encrypted credentials.
- Deleting normalized WHOOP history is a separate destructive confirmation.
- `/command` is a production-authenticated personal control surface; `/os`
  remains a local-only development cockpit.
- Public terms, privacy, browser-storage, pricing, research, navigation, and
  account copy no longer claim paid plans, fictional publications, marketing
  cookies, enterprise readiness, or end-to-end encryption.

## Current Trust Boundaries

- ChatGPT WHOOP tools are read-only.
- Tool inputs do not accept a user ID or WHOOP token.
- Owner identity comes from authenticated Delta/Supabase context.
- No background polling, webhook worker, always-listening microphone, or
  autonomous provider mutation is enabled.
- Refresh updates normalized health records and therefore requires a direct
  user command.
- Disconnect and history deletion are consequential controls with explicit
  confirmation.

## Remaining High-Value Gaps

1. **WHOOP retention policy gate**: WHOOP's API Terms restrict permanent copies
   and caches kept longer than provider permissions. Obtain written provider or
   qualified legal confirmation for normalized-history retention, or implement
   cache-header-driven expiry before another production rollout. Raw-response
   minimization does not settle this question.
2. **Production rollout evidence**: after the retention gate is closed, deploy
   site/backend changes together, then
   verify privacy version, `/command`, refresh, disconnect, and MCP behavior.
3. **Account-wide data lifecycle**: build one owner-scoped export/deletion
   service that covers Supabase Auth, product tables, WHOOP tables, and any
   local legacy stores before exposing an automated complete control.
4. **Activity ledger**: record compact, non-sensitive connector/tool activity
   so the owner can see what was read, by which capability, and when.
5. **Text operator loop**: route a user request through the capability registry,
   policy, tool execution, verifier, and evidence report from one interface.
6. **Voice operator**: add streaming speech only after it uses the same text
   operator contracts, approval gates, and interruption behavior.
7. **Daily briefing**: generate a user-requested or scheduled briefing from
   current connectors only after activity, scheduling, and notification
   controls are explicit.

## Acceptance Standard

A capability is not described as available until its owner boundary,
mutability, approval rule, failure state, test evidence, and user-visible
control are all explicit. A passing test is evidence for a defined behavior,
not proof that the entire personal-intelligence system is production-ready.
