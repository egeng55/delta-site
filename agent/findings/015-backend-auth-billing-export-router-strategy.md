---
id: "015"
title: "Backend auth billing export router strategy"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-auth-billing-export-router-strategy"
agent_executable: true
security_related: true
source: "phase-112-reconciliation"
last_reviewed: "2026-06-21"
owner: "backend architecture maintenance"
recommended_next_phase: "Plan auth/account, subscription/access, export, privacy, terms, consent, and deletion router boundaries separately from legacy health cleanup."
evidence:
  - "/Users/egeng/delta-backend/docs/REMAINING_API_SURFACE_INVENTORY.md"
  - "/Users/egeng/delta-backend/api_server.py"
  - "/Users/egeng/delta-backend/auth.py"
  - "/Users/egeng/delta-backend/compliance.py"
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

## Current State

Examples include:

- `/auth/*`
- `/user/*`
- `/subscription/*`
- `/access/*`
- `/privacy`, `/terms`, `/disclaimer`
- `/export/*`
- `/user/consent`, `/user/export`, `/user/delete`

## Risk

High. These routes define account access, entitlements, legal/compliance
surfaces, and data-export/deletion behavior.

## Verification Needed

- Public/protected auth boundaries remain unchanged.
- Route/auth snapshot remains stable.
- Existing auth, security, compliance, export, and subscription tests pass.
