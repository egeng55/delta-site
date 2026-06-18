#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));

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

function defaultWorktreeRootForRepo() {
  const repoParent = path.dirname(repoRoot);
  const homeCandidate = path.basename(repoParent) === "delta" ? path.dirname(repoParent) : repoParent;
  return path.join(homeCandidate, "delta-worktrees");
}

function parseArgs(argv) {
  const values = {
    phase: null,
    name: null,
    routine: null,
    repo: DEFAULT_REPO,
    mode: DEFAULT_MODE,
    print: false,
    json: false,
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
    } else if (arg === "--print") {
      values.print = true;
    } else if (arg === "--json") {
      values.json = true;
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

function usagePayload(message = null) {
  return {
    title: "Delta Site Agent Orchestration Planner",
    message,
    required: ["--phase <number>", "--name <slug>", "--routine <routine>"],
    optional: ["--repo <site|backend|mobile>", "--mode <single|parallel-plan>", "--print", "--json"],
    supportedRoutines: SUPPORTED_ROUTINES,
    examples: [
      "npm run agent:orchestrate -- --phase 62 --name orchestration --routine docs-only",
      "npm run agent:orchestrate -- --phase 63 --name repo-map --routine site",
      "npm run agent:orchestrate -- --phase 64 --name parallel-docs --routine worktree-experiment --mode parallel-plan",
      "npm --silent run agent:orchestrate -- --phase 62 --name orchestration --routine docs-only --json",
      "node scripts/agent-orchestrate.mjs --phase 62 --name orchestration --routine docs-only --json",
    ],
    safety: [
      "Print-only by default.",
      "Does not execute scripts.",
      "Does not create worktrees.",
      "Does not write files.",
      "Does not start servers.",
      "Does not commit.",
    ],
  };
}

function printUsage(payload) {
  console.log(payload.title);
  console.log("======================================");
  if (payload.message) {
    console.log(payload.message);
    console.log("");
  }
  console.log("Required:");
  for (const item of payload.required) console.log(`- ${item}`);
  console.log("");
  console.log("Optional:");
  for (const item of payload.optional) console.log(`- ${item}`);
  console.log("");
  console.log("Supported routines:");
  for (const routine of payload.supportedRoutines) console.log(`- ${routine}`);
  console.log("");
  console.log("Examples:");
  for (const example of payload.examples) console.log(example);
  console.log("");
  console.log("Safety:");
  for (const item of payload.safety) console.log(`- ${item}`);
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
    "test-fix": ["npm test -- --runInBand", "npm run agent:verify -- --site"],
    "safety-review": ["npm run agent:safety-scan", "npm run agent:eval"],
    "eval-update": ["npm run agent:eval", "npm run agent:verify -- --docs-only"],
    "phase-start": [worktreePrint, "npm run agent:status"],
    handoff: [`npm run agent:phase:handoff -- --phase ${phase}`, "npm run agent:status"],
    "worktree-experiment": [
      worktreePrint,
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --desktop",
    ],
  };

  return plans[routine] || plans["docs-only"];
}

function buildPlan(args) {
  const worktreeRoot = defaultWorktreeRootForRepo();
  const branch = `phase-${args.phase}-${args.name}`;
  const worktreePath = path.join(worktreeRoot, `${args.repo}-phase-${args.phase}-${args.name}`);
  const phaseStartCommand = `npm run agent:phase:start -- --phase ${args.phase} --name ${args.name} --print`;
  const routineCommand = `npm run agent:routine -- --routine ${args.routine}`;

  const plan = {
    generatedBy: "scripts/agent-orchestrate.mjs",
    safetyModel: {
      printOnly: true,
      executesCommands: false,
      createsWorktrees: false,
      writesFiles: false,
      startsServers: false,
      commits: false,
    },
    phaseIdentity: {
      phase: args.phase,
      name: args.name,
      repo: args.repo,
      routine: args.routine,
      mode: args.mode,
    },
    contextCommands: [
      "npm run agent:preflight",
      "npm run agent:status",
      "npm run agent:context",
      routineCommand,
    ],
    worktreePlan: {
      command: phaseStartCommand,
      expectedWorktreePath: worktreePath,
      expectedBranch: branch,
      note: "No worktree is created unless a user separately runs agent:phase:start with --run.",
    },
    suggestedAgentRoles: roleMapping(args.routine),
    preChangeChecklist: [
      "repo clean",
      "context reviewed",
      "routine reviewed",
      "forbidden files identified",
      "verification scope chosen",
      "evals reviewed when relevant",
    ],
    forbiddenActionsReminder: [
      "no backend/mobile unless explicitly scoped",
      "no Supabase mutation",
      "no mic/TTS/notifications",
      "no memory writes",
      "no auth/billing/legal/schema/deployment changes",
      "no autonomous commits",
    ],
    verificationPlan: verificationCommands(args.routine, args.phase, args.name),
    handoffPlan: {
      command: `npm run agent:phase:handoff -- --phase ${args.phase}`,
      finalReportFields: [
        "files changed",
        "orchestration or implementation behavior",
        "verification results",
        "backend/mobile untouched unless scoped",
        "no Supabase/mic/TTS/notification/write actions",
        "commit hash if committed",
        "final repo status",
        "exact safest next command",
      ],
    },
    packageScriptsChecked: {
      "agent:preflight": Boolean(packageJson.scripts?.["agent:preflight"]),
      "agent:status": Boolean(packageJson.scripts?.["agent:status"]),
      "agent:context": Boolean(packageJson.scripts?.["agent:context"]),
      "agent:routine": Boolean(packageJson.scripts?.["agent:routine"]),
      "agent:orchestrate": Boolean(packageJson.scripts?.["agent:orchestrate"]),
      "agent:verify": Boolean(packageJson.scripts?.["agent:verify"]),
      "agent:phase:start": Boolean(packageJson.scripts?.["agent:phase:start"]),
      "agent:phase:handoff": Boolean(packageJson.scripts?.["agent:phase:handoff"]),
    },
  };

  if (args.mode === "parallel-plan") {
    plan.parallelPlan = {
      advisoryOnly: true,
      warning: "Final integration must be sequential. Parallel outputs require human review before merge.",
      fileCollisionWarnings: [
        "Avoid multiple agents editing package.json, package-lock.json, or shared docs at the same time.",
        "Avoid multiple implementation agents editing src/components/OSConsole.tsx concurrently.",
        "Only one final integrator should stage and commit.",
      ],
      roleSplits: [
        {
          role: "Coordinator",
          worktree: path.join(worktreeRoot, `${args.repo}-phase-${args.phase}-${args.name}-coord`),
          responsibility: "phase brief, file ownership, final integration plan",
        },
        {
          role: "Docs agent",
          worktree: path.join(worktreeRoot, `${args.repo}-phase-${args.phase}-${args.name}-docs`),
          responsibility: "docs and handoff copy only",
        },
        {
          role: "Eval agent",
          worktree: path.join(worktreeRoot, `${args.repo}-phase-${args.phase}-${args.name}-eval`),
          responsibility: "eval fixture review or updates",
        },
        {
          role: "Safety reviewer",
          worktree: path.join(worktreeRoot, `${args.repo}-phase-${args.phase}-${args.name}-safety`),
          responsibility: "read-only diff and safety boundary review",
        },
        {
          role: "UI implementation agent",
          worktree: path.join(worktreeRoot, `${args.repo}-phase-${args.phase}-${args.name}-ui`),
          responsibility: "isolated frontend implementation only when routine scope allows it",
        },
        {
          role: "Test fixer",
          worktree: path.join(worktreeRoot, `${args.repo}-phase-${args.phase}-${args.name}-tests`),
          responsibility: "focused test repair after implementation handoff",
        },
      ],
    };
  }

  return plan;
}

function printSection(title, lines) {
  console.log(`## ${title}`);
  console.log("");
  for (const line of lines) {
    console.log(line);
  }
  console.log("");
}

function printPlan(plan) {
  console.log("# Delta Site Agent Orchestration Plan");
  console.log("");
  console.log("Print-only: no commands executed, no worktrees created, no files written.");
  console.log("");

  printSection("Phase Identity", [
    `- Phase: ${plan.phaseIdentity.phase}`,
    `- Name: ${plan.phaseIdentity.name}`,
    `- Repo: ${plan.phaseIdentity.repo}`,
    `- Routine: ${plan.phaseIdentity.routine}`,
    `- Mode: ${plan.phaseIdentity.mode}`,
  ]);

  printSection(
    "Context Commands",
    plan.contextCommands.map((command) => `- \`${command}\``),
  );

  printSection("Worktree Plan", [
    `- Preview command: \`${plan.worktreePlan.command}\``,
    `- Expected path: \`${plan.worktreePlan.expectedWorktreePath}\``,
    `- Expected branch: \`${plan.worktreePlan.expectedBranch}\``,
    `- Note: ${plan.worktreePlan.note}`,
  ]);

  printSection(
    "Suggested Agent Roles",
    plan.suggestedAgentRoles.map((role) => `- ${role}`),
  );

  printSection(
    "Pre-Change Checklist",
    plan.preChangeChecklist.map((item) => `- [ ] ${item}`),
  );

  printSection(
    "Forbidden Actions Reminder",
    plan.forbiddenActionsReminder.map((item) => `- ${item}`),
  );

  printSection(
    "Verification Plan",
    plan.verificationPlan.map((command) => `- \`${command}\``),
  );

  printSection("Handoff Plan", [
    `- Command: \`${plan.handoffPlan.command}\``,
    "- Final report fields:",
    ...plan.handoffPlan.finalReportFields.map((field) => `  - ${field}`),
  ]);

  if (plan.parallelPlan) {
    printSection("Parallel-Plan Mode", [
      `- Advisory only: ${plan.parallelPlan.advisoryOnly}`,
      `- Warning: ${plan.parallelPlan.warning}`,
      "- File collision warnings:",
      ...plan.parallelPlan.fileCollisionWarnings.map((warning) => `  - ${warning}`),
      "- Suggested split:",
      ...plan.parallelPlan.roleSplits.map(
        (split) => `  - ${split.role}: \`${split.worktree}\` — ${split.responsibility}`,
      ),
    ]);
  }

  printSection("JSON Usage", [
    "- `npm --silent run agent:orchestrate -- --phase 62 --name orchestration --routine docs-only --json`",
    "- `node scripts/agent-orchestrate.mjs --phase 62 --name orchestration --routine docs-only --json`",
  ]);
}

const args = parseArgs(process.argv.slice(2));

if (
  !validPhase(args.phase) ||
  !validSlug(args.name) ||
  !SUPPORTED_ROUTINES.includes(args.routine) ||
  !SUPPORTED_REPOS.includes(args.repo) ||
  !SUPPORTED_MODES.includes(args.mode)
) {
  const message = "Missing or invalid phase, name, routine, repo, or mode.";
  const payload = usagePayload(message);
  if (args.json) {
    console.log(JSON.stringify({ ok: false, usage: payload }, null, 2));
  } else {
    printUsage(payload);
  }
  process.exit(0);
}

const plan = buildPlan(args);

if (args.json) {
  console.log(JSON.stringify({ ok: true, plan }, null, 2));
} else {
  printPlan(plan);
}
