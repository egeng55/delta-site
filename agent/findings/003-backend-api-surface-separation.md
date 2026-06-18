---
id: "003"
title: "Backend API surface separation"
priority: "P1"
status: "open"
repo: "backend"
routine: "backend-architecture-plan"
slug: "backend-api-surface-separation"
agent_executable: true
security_related: false
recommended_next_phase: "Plan or implement a minimal separation between Behavioral OS endpoints and legacy health platform endpoints without changing runtime behavior unexpectedly."
evidence:
  - "/Users/egeng/delta-backend/api_server.py"
  - "/Users/egeng/delta-backend/docs/CURRENT_STATE.md"
likely_files:
  - "api_server.py"
  - "docs/CURRENT_STATE.md"
  - "tests/test_conversation_api.py"
out_of_scope:
  - "mobile changes"
  - "site UI changes"
  - "database schema changes"
---

The audit noted that Behavioral OS and legacy health platform routes share the
same backend app surface. This needs a scoped architecture phase before broad
runtime changes.
