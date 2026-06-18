# Agent Maintenance Findings

Maintenance findings are durable audit/remediation records under
`agent/findings/`. They keep known issues visible without letting agents
silently expand phase scope.

## Purpose

Use findings to track issues that are real but not yet implemented, such as
credential rotation confirmation, mobile sensitive cache remediation, backend
surface separation, status contract hardening, live eval coverage, and Electron
production readiness.

Findings are not executable tasks by themselves. A finding should become a
scoped phase brief before implementation.

## Finding Format

Each finding is a markdown file with frontmatter:

```yaml
---
id: "002"
title: "Mobile large sensitive cache strategy"
priority: "P1"
status: "open"
repo: "mobile"
routine: "mobile-cache-policy"
slug: "mobile-cache-strategy"
agent_executable: true
security_related: true
recommended_next_phase: "Implement a scoped remediation phase."
evidence:
  - "/absolute/or/repo/path"
likely_files:
  - "likely file path"
out_of_scope:
  - "explicit exclusion"
---
```

Statuses:

- `open`: unresolved and potentially agent-actionable.
- `pending-human`: requires provider, credential, account, or manual human
  action before an agent can close it.
- `deferred`: intentionally postponed.
- `resolved`: completed and verified.

Priorities:

- `P0`: security or data-risk item that should be handled before product
  expansion.
- `P1`: important remediation or architecture hardening.
- `P2`: useful but not currently blocking.

## Maintenance Report

Print the queue:

```bash
npm run agent:maintenance -- --report
```

Machine-readable report:

```bash
npm --silent run agent:maintenance -- --json
```

The report is read-only. It does not update statuses, implement fixes, run
tests, create worktrees, or commit.

## Policy Classification

Classify findings before generating implementation plans:

```bash
npm run agent:policy -- --report
npm run agent:policy -- --id 002
npm run agent:policy -- --top-actionable
npm --silent run agent:policy -- --json
```

The policy engine maps findings to action modes such as `report_only`,
`brief_allowed`, `docs_eval_autofix_allowed`,
`implementation_requires_approval`, `human_required`, and `blocked`.

Policy rules live in `agent/policies/maintenance-policy.json`; the canonical
definitions live in `docs/AGENT_MAINTENANCE_POLICY.md`.

## Relationship To Finding Briefs

Use `agent:finding:brief` to turn a finding into a scoped remediation brief:

```bash
npm run agent:finding:brief -- --top --phase 74
npm run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy --write
```

Findings should not be marked `resolved` until implementation is complete and
verification passes. Planning-only phases leave the finding `open`. Items that
need provider-side or manual confirmation remain `pending-human`.

`agent:finding:brief` checks the policy first. It refuses `blocked` findings,
labels `human_required` findings as manual/checklist work, and labels
`implementation_requires_approval` findings as planning-only until a human
explicitly approves implementation.
