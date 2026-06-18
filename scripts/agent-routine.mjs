#!/usr/bin/env node

const args = process.argv.slice(2);

function valueFor(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] || null;
}

const selectedRoutine = valueFor("--routine");
const phase = valueFor("--phase") || "<number>";
const name = valueFor("--name") || "<slug>";
const shouldList = args.includes("--list") || !selectedRoutine;

function commandList(commands) {
  return commands.map((command) => `  ${command}`).join("\n");
}

const routines = {
  "docs-only": {
    purpose: "Docs or advisory-agent tooling copy with no product behavior change.",
    preChange: [
      "npm run agent:status",
      "npm run agent:preflight",
    ],
    guidance: [
      "Keep changes in AGENTS.md, docs/, evals/, scripts/, or package metadata as scoped.",
      "Do not edit /os, Electron runtime code, backend, mobile, auth, legal, schema, or deployment files.",
    ],
    postChange: [
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --docs-only",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Advisory scripts do not replace human review.",
      "Use site verification if package scripts or executable tooling changed.",
    ],
  },
  site: {
    purpose: "Frontend site/component work outside high-risk Electron service management.",
    preChange: [
      "npm run agent:status",
      "npm run agent:preflight",
    ],
    guidance: [
      "Keep changes within the requested frontend scope.",
      "Preserve read-only /os behavior and user-triggered browser TTS boundaries.",
    ],
    postChange: [
      "npm run agent:safety-scan",
      "npm run agent:verify -- --site",
      "npm test -- --runInBand",
      "npm run lint",
      "npm run build",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Do not add Supabase writes, browser mic, backend TTS, notifications, or memory writes.",
    ],
  },
  desktop: {
    purpose: "/os, Electron shell, service-manager, or desktop smoke-check work.",
    preChange: [
      "npm run agent:status",
      "npm run agent:preflight",
    ],
    guidance: [
      "Keep Electron security settings strict.",
      "Preserve /os as a read-only cockpit.",
      "Avoid arbitrary shell execution or broader desktop permissions.",
    ],
    postChange: [
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --desktop",
      "npm run agent:verify -- --desktop --run",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Do not enable live mic, backend TTS, notifications, wake word, always-on mode, or memory writes.",
    ],
  },
  "test-fix": {
    purpose: "Focused loop for a failing test or stale assertion.",
    preChange: [
      "npm run agent:status",
    ],
    guidance: [
      "Inspect the failing test and covered behavior before editing.",
      "Classify root cause: product bug, stale test, brittle assertion, or environment issue.",
      "Make the smallest safe fix and avoid unrelated refactors.",
    ],
    postChange: [
      "npm test -- --runInBand",
      "npm run lint",
      "npm run build",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Do not weaken tests to hide real regressions.",
    ],
  },
  "safety-review": {
    purpose: "Diff review for risky behavior before commit or handoff.",
    preChange: [
      "npm run agent:status",
      "npm run agent:safety-scan",
    ],
    guidance: [
      "Review source/config risks before documentation mentions.",
      "Check for Supabase writes, schema/auth/legal/billing changes, Electron permission broadening, shell execution, mic/TTS/notification enablement, and memory writes.",
    ],
    postChange: [
      "npm run agent:phase:handoff -- --phase <number>",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Safety scan is advisory and does not replace human diff review.",
    ],
  },
  "eval-update": {
    purpose: "Eval fixture or /os explainability/safety-language expectation changes.",
    preChange: [
      "npm run agent:status",
    ],
    guidance: [
      "Read docs/AGENT_EVALS.md and update fixtures only when expectations intentionally change.",
      "Keep fixtures deterministic JSON and do not call live systems.",
    ],
    postChange: [
      "npm run agent:eval",
      "npm run agent:safety-scan",
      "npm run agent:verify -- --site",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Do not call external LLM APIs, backend services, browser automation, Supabase, mic, TTS, notifications, or write paths.",
    ],
  },
  "phase-start": {
    purpose: "Start-of-phase status check and optional worktree preview.",
    preChange: [
      "npm run agent:status",
      `npm run agent:phase:start -- --phase ${phase} --name ${name} --print`,
    ],
    guidance: [
      "Use print mode first.",
      "Create a worktree only with explicit approval and --run from a clean repo.",
    ],
    postChange: [
      `npm run agent:phase:handoff -- --phase ${phase}`,
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Do not create worktrees by default. Do not delete worktrees or branches.",
    ],
  },
  handoff: {
    purpose: "Pause, context compaction, or transfer to another agent.",
    preChange: [
      "npm run agent:status",
      `npm run agent:phase:handoff -- --phase ${phase}`,
    ],
    guidance: [
      "Fill in files changed, commands run, warnings, safety confirmations, git status, and next safest command.",
    ],
    postChange: [
      "No automatic command execution required.",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Do not write handoff files, clean files, commit, or touch sibling repos unless explicitly scoped.",
    ],
  },
  "worktree-experiment": {
    purpose: "Broad or exploratory work that should be isolated from the primary checkout.",
    preChange: [
      "npm run agent:status",
      `npm run agent:phase:start -- --phase ${phase} --name ${name} --print`,
    ],
    guidance: [
      "Review the printed worktree path and branch before creation.",
      "Use --run only with explicit approval and a clean repo.",
      "After creation, cd into the worktree and run npm run agent:status.",
    ],
    postChange: [
      `npm run agent:phase:handoff -- --phase ${phase}`,
      "npm run agent:verify -- --desktop",
    ],
    handoff: `npm run agent:phase:handoff -- --phase ${phase}`,
    safety: [
      "Do not create worktrees by default.",
      "Never delete worktrees, delete branches, clean files, or commit automatically.",
    ],
  },
};

function printAvailable() {
  console.log("Delta site agent routines");
  console.log("=========================");
  console.log("Print-only routine guidance for composing existing agent commands.");
  console.log("");
  console.log("Available routines:");
  for (const routine of Object.keys(routines).sort()) {
    console.log(`- ${routine}`);
  }
  console.log("");
  console.log("Examples:");
  console.log("npm run agent:routine -- --routine docs-only");
  console.log("npm run agent:routine -- --routine desktop");
  console.log("npm run agent:routine -- --routine worktree-experiment --phase 58 --name example");
  console.log("");
  console.log("No commands are executed by this script.");
}

function printRoutine(name, routine) {
  console.log(`Delta site routine: ${name}`);
  console.log("=".repeat(`Delta site routine: ${name}`.length));
  console.log(`Purpose: ${routine.purpose}`);
  console.log("");
  console.log("Pre-change commands:");
  console.log(commandList(routine.preChange));
  console.log("");
  console.log("Implementation guidance:");
  console.log(commandList(routine.guidance));
  console.log("");
  console.log("Post-change commands:");
  console.log(commandList(routine.postChange));
  console.log("");
  console.log("Handoff command:");
  console.log(`  ${routine.handoff}`);
  console.log("");
  console.log("Safety reminders:");
  console.log(commandList(routine.safety));
  console.log("");
  console.log("Print-only: no commands were executed, no worktrees were created, and no files were changed.");
}

if (shouldList) {
  printAvailable();
  process.exit(0);
}

const routine = routines[selectedRoutine];
if (!routine) {
  console.error(`Unknown routine: ${selectedRoutine}`);
  console.error(`Available routines: ${Object.keys(routines).sort().join(", ")}`);
  process.exit(1);
}

printRoutine(selectedRoutine, routine);
