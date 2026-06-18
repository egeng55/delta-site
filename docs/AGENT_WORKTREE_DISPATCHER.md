# Agent Worktree Dispatcher

`agent:dispatch:worktree` is the approval-gated bridge between maintenance
planning and a future Codex implementation run. It can select a maintenance
finding, apply policy, and prepare an isolated worktree plus a task packet. It
does not implement the finding.

## Safety Model

The dispatcher is print-only by default.

It will not:

- implement findings
- run tests
- call external services
- mutate Supabase
- run mic, TTS, notifications, or product memory writes
- run `npm audit fix`
- merge branches
- delete worktrees or branches

Worktree creation requires `--approve-worktree`. Task packet writing requires
`--write-task`.

## Policy Enforcement

The dispatcher uses the same policy modes as `agent:policy`:

- `human_required`: refuses worktree creation; recommends manual checklist only.
- `blocked`: refuses dispatch.
- `report_only`: refuses worktree creation and task packet writing.
- `brief_allowed`: allows task packet or brief generation only; no worktree.
- `worktree_allowed`: allows a worktree only with `--approve-worktree`.
- `docs_eval_autofix_allowed`: allows docs/eval worktree preparation with
  explicit flags; still no implementation or merge.
- `implementation_requires_approval`: allows worktree/task preparation only
  after explicit approval flags; implementation still requires a separate
  future Codex run.

## Commands

Print the proposed dispatch for the current top actionable finding:

```bash
npm run agent:dispatch:worktree -- --top --phase 80
```

Print a specific finding dispatch:

```bash
npm run agent:dispatch:worktree -- --id 005 --phase 80 --name live-eval-coverage
```

Create a worktree and write a task packet only after explicit approval:

```bash
npm run agent:dispatch:worktree -- --id 005 --phase 80 --name live-eval-coverage --approve-worktree --write-task
```

Parser-clean JSON:

```bash
npm --silent run agent:dispatch:worktree -- --id 005 --phase 80 --json
```

## Task Packets

With `--write-task`, the dispatcher writes:

```text
agent/dispatch-tasks/phase-XXX-<name>-task.md
```

The task packet includes:

- finding id, title, priority, and status
- policy mode and approval status
- source repo, worktree path, and branch name
- objective, evidence, likely files, and out-of-scope areas
- forbidden actions
- implementation instructions for the future Codex run
- verification commands
- handoff and merge policy
- exact first command to run inside the worktree

Existing task packets are not overwritten unless `--force` is passed.

## Repository Targets

The dispatcher can prepare worktrees for:

- `site`: `/Users/egeng/delta-site`
- `backend`: `/Users/egeng/delta-backend`
- `mobile`: `/Users/egeng/delta-mobile`

All worktrees use the canonical root:

```text
/Users/egeng/delta-worktrees
```

`multi` findings should be split into repo-specific phases before worktree
creation.

## How Codex Should Use It

1. Run `agent:maintenance:run` and `agent:policy` to understand the queue.
2. Run `agent:dispatch:worktree` without approval flags to inspect the proposed
   dispatch.
3. Use `--approve-worktree --write-task` only when the user explicitly approves
   a scoped worktree.
4. Start a new Codex run inside the generated worktree and follow the task
   packet.
5. Do not merge until a human reviews the worktree branch.
