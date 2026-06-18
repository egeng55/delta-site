#!/usr/bin/env node

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const defaultWorktreeRoot = path.join(path.dirname(repoRoot), "delta-worktrees");

function parseArgs(argv) {
  const values = {
    phase: null,
    name: null,
    worktreeRoot: defaultWorktreeRoot,
    run: false,
    print: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--phase") {
      values.phase = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--name") {
      values.name = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--worktree-root") {
      values.worktreeRoot = argv[index + 1] ? path.resolve(argv[index + 1]) : null;
      index += 1;
    } else if (arg === "--run") {
      values.run = true;
    } else if (arg === "--print") {
      values.print = true;
    }
  }

  return values;
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    stdio: options.stdio || "pipe",
  });
  if (result.error) return { ok: false, output: result.error.message };
  return {
    ok: result.status === 0,
    status: result.status,
    output: (result.stdout || result.stderr || "").trim(),
  };
}

function printUsage() {
  console.log("Delta site phase start");
  console.log("======================");
  console.log("Prints or creates a scoped git worktree for a Delta site phase.");
  console.log("");
  console.log("Required:");
  console.log("- --phase <number>");
  console.log("- --name <slug>");
  console.log("");
  console.log("Optional:");
  console.log("- --worktree-root <path>");
  console.log("- --print (default)");
  console.log("- --run (required to create a worktree)");
  console.log("");
  console.log("Example:");
  console.log("npm run agent:phase:start -- --phase 56 --name worktree-orchestration --print");
  console.log("");
}

function validPhase(value) {
  return typeof value === "string" && /^[0-9]+$/.test(value);
}

function validSlug(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]*$/.test(value);
}

const args = parseArgs(process.argv.slice(2));

if (!validPhase(args.phase) || !validSlug(args.name) || !args.worktreeRoot) {
  printUsage();
  console.log("Missing or invalid --phase, --name, or --worktree-root.");
  process.exit(1);
}

const branchName = `phase-${args.phase}-${args.name}`;
const targetPath = path.join(args.worktreeRoot, `site-phase-${args.phase}-${args.name}`);
const command = `git worktree add ${targetPath} -b ${branchName}`;

console.log("Delta site phase start");
console.log("======================");
console.log(`Repo root: ${repoRoot}`);
console.log(`Phase: ${args.phase}`);
console.log(`Name: ${args.name}`);
console.log(`Branch: ${branchName}`);
console.log(`Worktree root: ${args.worktreeRoot}`);
console.log(`Target path: ${targetPath}`);
console.log(`Mode: ${args.run ? "run" : "print"}`);
console.log("");
console.log("Commands:");
console.log(`mkdir -p ${args.worktreeRoot}`);
console.log(command);
console.log("");

if (!args.run) {
  console.log("No commands executed. Re-run with --run to create the worktree.");
  console.log("This script never deletes worktrees, cleans files, commits, or touches sibling repos.");
  process.exit(0);
}

const status = runGit(["status", "--short"]);
if (!status.ok) {
  console.error(`Unable to read git status: ${status.output}`);
  process.exit(1);
}
if (status.output.length > 0) {
  console.error("Refusing to create a worktree because the current repo is not clean.");
  console.error(status.output);
  process.exit(1);
}
if (existsSync(targetPath)) {
  console.error(`Refusing to create a worktree because the target path already exists: ${targetPath}`);
  process.exit(1);
}

mkdirSync(args.worktreeRoot, { recursive: true });
const result = runGit(["worktree", "add", targetPath, "-b", branchName], { stdio: "inherit" });
if (!result.ok) {
  console.error(`git worktree add failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

console.log("");
console.log("Worktree created.");
console.log(`Next command: cd ${targetPath} && npm run agent:status`);
