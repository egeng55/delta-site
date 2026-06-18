# Agent Finding Briefs

`agent:finding:brief` turns an existing maintenance finding into a structured
remediation phase brief. It is a bridge from the maintenance queue to scoped
Codex implementation.

## Relationship To Maintenance

`agent:maintenance` reports known findings under `agent/findings/`.
`agent:finding:brief` selects one of those findings and produces a phase brief
with objective, evidence, scope, safety boundaries, verification commands, and
handoff expectations.

The brief does not implement the finding.

## Relationship To Phase Briefs

`agent:phase:brief` starts from a phase number, name, and routine.
`agent:finding:brief` starts from a maintenance finding, then derives a phase
contract from the finding metadata.

Both scripts are print-only by default and write only with `--write` under
`agent/phase-briefs/`.

## Selection

Select a specific finding:

```bash
npm run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy
```

Select the highest-priority agent-actionable finding:

```bash
npm run agent:finding:brief -- --top --phase 74
```

`--top` prioritizes `P0` before `P1` before `P2`, excludes `resolved` and
`deferred`, and skips `pending-human` findings unless they are explicitly marked
agent-executable. Ties use the lowest numeric finding id.

## Write Behavior

Print-only by default:

```bash
npm run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy
```

Write a durable brief:

```bash
npm run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy --write
```

Written files use:

```text
agent/phase-briefs/phase-XXX-finding-slug.md
```

Existing files are not overwritten unless `--force` is passed.

## JSON Usage

Use `npm --silent` for parser-clean JSON:

```bash
npm --silent run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy --json
```

## Do Not Close Findings Too Early

- A planning brief does not resolve a finding.
- A finding stays `open` until remediation is implemented and verified.
- A provider/manual-action item stays `pending-human` until a human confirms the
  action.
- Do not mark a finding resolved because a script generated a plan.

## Safety Model

The generator does not:

- implement remediations
- run tests
- create worktrees
- call external services
- mutate Supabase
- run mic, TTS, notifications, or memory writes
- edit files unless `--write` is passed
- overwrite files unless `--force` is passed
