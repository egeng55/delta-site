#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const expectedRepoName = "delta-site";

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.error) return { ok: false, output: result.error.message };
  return {
    ok: result.status === 0,
    output: (result.stdout || result.stderr || "").trim(),
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function mark(value) {
  return value ? "yes" : "no";
}

const packagePath = path.join(repoRoot, "package.json");
const packageJson = readJson(packagePath);
const invokedFrom = process.cwd();
const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const head = runGit(["rev-parse", "--short", "HEAD"]);
const status = runGit(["status", "--short"]);
const parent = path.dirname(repoRoot);
const siblingRepos = {
  "delta-backend": existsSync(path.join(parent, "delta-backend")),
  "delta-mobile": existsSync(path.join(parent, "delta-mobile")),
};

const requiredDocs = [
  "AGENTS.md",
  ".cursor/rules/delta-site-agent-rules.mdc",
  "docs/AGENTIC_DEVELOPMENT.md",
  "docs/AGENT_SAFETY_BOUNDARIES.md",
  "docs/AGENT_PHASE_BRIEF_TEMPLATE.md",
  "docs/AGENT_HANDOFF_TEMPLATE.md",
  "docs/AGENT_VERIFICATION_MATRIX.md",
  "docs/AGENT_SLASH_COMMANDS.md",
  "docs/AGENT_ROLES.md",
];

console.log("Delta site agent preflight");
console.log("==========================");
console.log(`Repo root: ${repoRoot}`);
console.log(`Invoked from: ${invokedFrom}`);
console.log(`Expected repo: ${expectedRepoName}`);
console.log(`Current directory warning: ${invokedFrom === repoRoot ? "none" : `run from ${repoRoot}`}`);
console.log(`Branch: ${branch.ok ? branch.output : "unknown"}`);
console.log(`HEAD: ${head.ok ? head.output : "unknown"}`);
console.log("");

console.log("Git status:");
if (status.ok && status.output) {
  console.log(status.output);
} else if (status.ok) {
  console.log("clean");
} else {
  console.log(`unable to read git status: ${status.output}`);
}
console.log("");

console.log("Package scripts:");
for (const [name, command] of Object.entries(packageJson.scripts || {})) {
  console.log(`- ${name}: ${command}`);
}
console.log("");

console.log("Required agent docs:");
for (const relativePath of requiredDocs) {
  console.log(`- ${relativePath}: ${mark(existsSync(path.join(repoRoot, relativePath)))}`);
}
console.log("");

console.log("Sibling repo presence:");
for (const [name, exists] of Object.entries(siblingRepos)) {
  console.log(`- ${name}: ${mark(exists)}`);
}
console.log("");

console.log("Advisory only: this script performs no writes and does not validate product behavior.");
