---
id: "004"
title: "Status payload schema enforcement"
priority: "P1"
status: "open"
repo: "multi"
routine: "contract-hardening"
slug: "status-schema-enforcement"
agent_executable: true
security_related: false
recommended_next_phase: "Add explicit status/readiness payload schema validation or typed contract tests across backend and site consumers without changing product behavior."
evidence:
  - "/Users/egeng/delta-backend/docs/STATUS_CONTRACT.md"
  - "/Users/egeng/delta-site/src/lib/systemReadinessApi.ts"
  - "/Users/egeng/delta-site/src/components/OSConsole.tsx"
likely_files:
  - "delta-backend/docs/STATUS_CONTRACT.md"
  - "delta-backend/tests/"
  - "delta-site/src/lib/systemReadinessApi.ts"
  - "delta-site/src/components/OSConsole.test.tsx"
out_of_scope:
  - "schema migrations"
  - "Supabase writes"
  - "mobile runtime changes"
---

Status payloads are consumed by the OS Console and backend tests but should have
clearer schema guarantees before the cockpit grows further.
