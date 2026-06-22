---
id: "015"
title: "Backend auth billing export router strategy"
priority: "P1"
status: "resolved"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-auth-billing-export-router-strategy"
agent_executable: true
security_related: true
source: "phase-112-reconciliation, phase-120-control-plane-strategy"
last_reviewed: "2026-06-22"
owner: "backend architecture maintenance"
recommended_next_phase: "Use the Phase 120 control-plane strategy before any future auth/account, subscription/access, export, or compliance router movement."
evidence:
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/docs/AUTH_BILLING_EXPORT_ROUTE_STRATEGY.md"
  - "/Users/egeng/delta-backend/api_server.py"
  - "/Users/egeng/delta-backend/auth.py"
  - "/Users/egeng/delta-backend/compliance.py"
  - "/Users/egeng/delta-backend/scripts/route_inventory.py"
  - "/Users/egeng/delta-backend/tests/test_auth_billing_export_route_strategy.py"
likely_files:
  - "api_server.py"
  - "auth.py"
  - "compliance.py"
  - "subscriptions.py"
  - "tests/test_security_fixes.py"
  - "tests/test_route_auth_snapshot.py"
out_of_scope:
  - "auth behavior changes"
  - "billing behavior changes"
  - "privacy/terms text changes"
  - "data deletion behavior changes"
  - "secret handling"
---

Phase 112 found that many remaining routes are auth/account,
subscription/access, export, consent, deletion, privacy, and terms surfaces.
These are intentionally not part of legacy health read-router cleanup.

Phase 120 resolved this strategy finding by adding explicit control-plane
metadata to the backend static route inventory, a dedicated route strategy
document, and focused tests. No route handlers moved and no auth, billing,
export, compliance, account, API, rate-limit, Supabase, provider, or response
behavior changed.

## Current State

The backend control-plane strategy now classifies `30` routes into:

- `auth_account_read`
- `auth_account_mutation`
- `subscription_billing_read`
- `subscription_billing_mutation`
- `access_entitlement_check`
- `export_data_action`
- `compliance_data_action`
- `privacy_account_action`

The strategy also assigns data-access profiles such as `session_or_account_identity`,
`account_profile`, `subscription_entitlement`, `sensitive_export`,
`consent_audit`, `destructive_account_deletion`, and `public_legal_text`.

## Risk

Reduced but still high. The route families are now documented and tested, but
future extraction or behavior changes still need focused tests for session,
account, entitlement, export, consent, deletion, privacy, terms, and rate-limit
behavior.

## Verification Needed

- Public/protected auth boundaries remain unchanged.
- Route/auth snapshot remains stable.
- `tests/test_auth_billing_export_route_strategy.py` remains green.
- Existing auth, security, compliance, export, and subscription tests pass
  before any future movement.
- No Supabase/provider semantics change.
