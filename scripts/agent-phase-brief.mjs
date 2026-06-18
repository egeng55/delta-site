#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SUPPORTED_ROUTINES = [
  "docs-only",
  "site",
  "desktop",
  "test-fix",
  "safety-review",
  "eval-update",
  "phase-start",
  "handoff",
  "worktree-experiment",
];

const SUPPORTED_REPOS = ["site", "backend", "mobile"];
const SUPPORTED_MODES = ["single", "parallel-plan"];
const DEFAULT_REPO = "site";
const DEFAULT_MODE = "single";

function parseArgs(argv) {
  const values = {
    phase: null,
    name: null,
    routine: null,
    repo: DEFAULT_REPO,
    mode: DEFAULT_MODE,
    objective: "TODO: state the phase objective in one or two concrete sentences.",
    write: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--phase") {
      values.phase = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--name") {
      values.name = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--routine") {
      values.routine = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--repo") {
      values.repo = argv[index + 1] || DEFAULT_REPO;
      index += 1;
    } else if (arg === "--mode") {
      values.mode = argv[index + 1] || DEFAULT_MODE;
      index += 1;
    } else if (arg === "--objective") {
      values.objective = argv[index + 1] || values.objective;
      index += 1;
    } else if (arg === "--write") {
      values.write = true;
    } else if (arg === "--force") {
      values.force = true;
    }
  }

  return values;
}

function validPhase(value) {
  return typeof value === "string" && /^[0-9]+$/.test(value);
}

function validSlug(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value);
}

function paddedPhase(phase) {
  return String(phase).padStart(3, "0");
}

function defaultWorktreeRootForRepo() {
  const repoParent = path.dirname(repoRoot);
  const homeCandidate = path.basename(repoParent) === "delta" ? path.dirname(repoParent) : repoParent;
  return path.join(homeCandidate, "delta-worktrees");
}

function roleMapping(routine) {
  const roles = {
    "docs-only": ["Docs/Handoff Agent"],
    site: ["Delta Site Frontend Agent"],
    desktop: ["Delta Site Frontend Agent", "Electron Safety Reviewer"],
    "test-fix": ["Delta Test Fixer"],
    "safety-review": ["Delta Safety Reviewer"],
    "eval-update": ["Eval Maintainer"],
    "phase-start": ["Coordinator"],
    handoff: ["Docs/Handoff Agent"],
    "worktree-experiment": ["Coordinator", "Isolated Implementation Agent"],
  };
  return roles[routine] || ["Coordinator"];
}

function expectedFileAreas(routine) {
  const areas = {
    "docs-only": [
      "AGENTS.md",
      "docs/AGENT_*.md",
      "scripts/agent-*.mjs when the phase explicitly touches agent tooling",
      "package.json when adding or changing agent scripts",
    ],
    site: [
      "src/app/",
      "src/components/",
      "src/lib/",
      "component or route tests beside touched behavior",
    ],
    desktop: [
      "src/components/OSConsole.tsx",
      "src/components/OSConsole.test.tsx",
      "desktop/",
      "docs/DESKTOP_APP.md when desktop behavior changes",
    ],
    "test-fix": [
      "the failing test file",
      "the smallest product file needed to fix verified behavior",
    ],
    "safety-review": [
      "current git diff",
      "high-risk paths listed in AGENTS.md",
      "agent safety scan output",
    ],
    "eval-update": [
      "evals/",
      "docs/AGENT_EVALS.md",
      "related explainability or safety-language docs",
    ],
    "phase-start": [
      "docs/AGENT_WORKTREE_STRATEGY.md if guidance changes",
      "no product files by default",
    ],
    handoff: [
      "handoff text",
      "docs/AGENT_HANDOFF_TEMPLATE.md if template changes",
      "no product files by default",
    ],
    "worktree-experiment": [
      "explicitly assigned files only",
      "one repo per worktree",
      "no shared package metadata unless coordinated",
    ],
  };
  return areas[routine] || ["TODO: define expected file areas."];
}

function verificationCommands(routine, phase, name) {
  const worktreePrint = `npm run agent:phase:start -- --phase ${phase} --name ${name} --print`;
  const plans = {
    "docs-only": [
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --docs-only",
    ],
    site: [
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --site",
      "npm run agent:verify -- --site --run",
    ],
    desktop: [
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --desktop",
      "npm run agent:verify -- --desktop --run",
    ],
    "test-fix": [
      "npm test -- --runInBand",
      "npm run agent:verify -- --site",
    ],
    "safety-review": [
      "npm run agent:safety-scan",
      "npm run agent:eval",
    ],
    "eval-update": [
      "npm run agent:eval",
      "npm run agent:verify -- --docs-only",
    ],
    "phase-start": [
      worktreePrint,
      "npm run agent:status",
    ],
    handoff: [
      `npm run agent:phase:handoff -- --phase ${phase}`,
      "npm run agent:status",
    ],
    "worktree-experiment": [
      worktreePrint,
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --desktop",
    ],
  };

  return plans[routine] || plans["docs-only"];
}

function outOfScopeRepos(repo) {
  return SUPPORTED_REPOS.filter((candidate) => candidate !== repo);
}

function formatList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function generateBrief(args) {
  const phase = args.phase;
  const name = args.name;
  const worktreeRoot = defaultWorktreeRootForRepo();
  const worktreePath = path.join(worktreeRoot, `${args.repo}-phase-${phase}-${name}`);
  const branchName = `phase-${phase}-${name}`;
  const orchestrateCommand = `npm run agent:orchestrate -- --phase ${phase} --name ${name} --routine ${args.routine}`;
  const orchestrateWithMode = args.mode === DEFAULT_MODE ? orchestrateCommand : `${orchestrateCommand} --mode ${args.mode}`;
  const phaseStartCommand = `npm run agent:phase:start -- --phase ${phase} --name ${name} --print`;
  const handoffCommand = `npm run agent:phase:handoff -- --phase ${phase}`;

  return `# Delta Phase ${phase}: ${name}

Generated by: \`scripts/agent-phase-brief.mjs\`

This is a planning artifact. It does not authorize autonomous execution,
side-effect validation, worktree creation, or commits.

## Phase Identity

- Phase: ${phase}
- Name: ${name}
- Repo: ${args.repo}
- Routine: ${args.routine}
- Mode: ${args.mode}
- Objective: ${args.objective}

## Current Context Commands

\`\`\`bash
npm run agent:preflight
npm run agent:status
npm run agent:context
${orchestrateWithMode}
\`\`\`

## Scope

Intended repo:
- ${args.repo}

Expected file areas:
${formatList(expectedFileAreas(args.routine))}

Explicitly out-of-scope repos:
${formatList(outOfScopeRepos(args.repo))}

Sibling repo boundaries:
- Treat sibling repos as read-only context unless the phase explicitly scopes them.
- Do not edit backend or mobile behavior from a site-scoped phase.
- Do not include unrelated projects such as /Users/egeng/morning-standup in Delta context.

## Suggested Roles

${formatList(roleMapping(args.routine))}

## Safety Boundaries

- No backend/mobile unless explicitly scoped.
- No Supabase mutation.
- No mic/TTS/notifications.
- No memory writes.
- No auth/billing/legal/schema/deployment changes.
- No autonomous commits.
- No worktree creation unless separately requested.

## Worktree Plan

Suggested preview command:

\`\`\`bash
${phaseStartCommand}
\`\`\`

- Expected branch: \`${branchName}\`
- Expected worktree path: \`${worktreePath}\`
- Actual creation requires re-running the phase-start helper with \`--run\`.
- Do not delete worktrees, clean files, or remove branches automatically.

## Implementation Checklist

- [ ] Read \`AGENTS.md\`.
- [ ] Run and review the current context commands.
- [ ] Read the selected routine guidance.
- [ ] Inspect relevant files before editing.
- [ ] Make scoped changes only.
- [ ] Update tests/docs if needed.
- [ ] Avoid scope creep.
- [ ] Review safety boundaries before staging.

## Verification Plan

\`\`\`bash
${verificationCommands(args.routine, phase, name).join("\n")}
\`\`\`

## Handoff Expectations

\`\`\`bash
${handoffCommand}
\`\`\`

Final report should include:
- files changed
- phase brief behavior or implementation behavior
- verification results
- backend/mobile untouched unless explicitly scoped
- no Supabase/mic/TTS/notification/write actions
- generated brief path if written
- commit hash if committed
- final repo status
- exact safest next command

## Open Questions

- TODO: list unresolved design decisions.
- TODO: list unclear file ownership boundaries.
- TODO: list verification risks or skipped checks.
`;
}

function printUsage() {
  console.log("Delta site phase brief generator");
  console.log("================================");
  console.log("Prints a structured markdown phase brief by default.");
  console.log("");
  console.log("Required:");
  console.log("- --phase <number>");
  console.log("- --name <slug>");
  console.log("- --routine <routine>");
  console.log("");
  console.log("Optional:");
  console.log("- --repo <site|backend|mobile> (default: site)");
  console.log("- --mode <single|parallel-plan> (default: single)");
  console.log("- --objective \"text\"");
  console.log("- --write (write agent/phase-briefs/phase-XXX-name.md)");
  console.log("- --force (allow overwrite when used with --write)");
  console.log("");
  console.log("Examples:");
  console.log("npm run agent:phase:brief -- --phase 64 --name repo-map --routine site");
  console.log("npm run agent:phase:brief -- --phase 64 --name repo-map --routine site --write");
  console.log("npm run agent:phase:brief -- --phase 65 --name parallel-docs --routine worktree-experiment --mode parallel-plan");
  console.log("");
  console.log("Supported routines:");
  for (const routine of SUPPORTED_ROUTINES) console.log(`- ${routine}`);
  console.log("");
  console.log("Default behavior is print-only. No files are written unless --write is passed.");
}

const args = parseArgs(process.argv.slice(2));

if (
  !validPhase(args.phase) ||
  !validSlug(args.name) ||
  !SUPPORTED_ROUTINES.includes(args.routine) ||
  !SUPPORTED_REPOS.includes(args.repo) ||
  !SUPPORTED_MODES.includes(args.mode)
) {
  printUsage();
  process.exit(0);
}

const markdown = generateBrief(args);

if (!args.write) {
  console.log(markdown);
  console.log("Print-only: no phase brief file was written. Re-run with --write to create one.");
  process.exit(0);
}

const targetDirectory = path.join(repoRoot, "agent", "phase-briefs");
const targetPath = path.join(targetDirectory, `phase-${paddedPhase(args.phase)}-${args.name}.md`);

if (existsSync(targetPath) && !args.force) {
  console.error(`Refusing to overwrite existing phase brief: ${targetPath}`);
  console.error("Re-run with --force only if replacing this planning artifact is intentional.");
  process.exit(1);
}

mkdirSync(targetDirectory, { recursive: true });
writeFileSync(targetPath, markdown);
console.log(`Phase brief written: ${targetPath}`);
console.log("No commands executed, no worktrees created, no tests run, and no commits made.");
