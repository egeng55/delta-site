#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const packageScripts = packageJson.scripts || {};
const agentScripts = [
  "agent:preflight",
  "agent:status",
  "agent:safety-scan",
  "agent:eval",
  "agent:verify",
  "agent:phase:start",
  "agent:phase:handoff",
];

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

function mark(value) {
  return value ? "yes" : "no";
}

const invokedFrom = process.cwd();
const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const head = runGit(["rev-parse", "--short", "HEAD"]);
const status = runGit(["status", "--short"]);
const isClean = status.ok && status.output.length === 0;
const parent = path.dirname(repoRoot);
const siblingRepos = {
  "delta-backend": existsSync(path.join(parent, "delta-backend")),
  "delta-mobile": existsSync(path.join(parent, "delta-mobile")),
};

console.log("Delta site agent status");
console.log("=======================");
console.log(`Repo root: ${repoRoot}`);
console.log(`Invoked from: ${invokedFrom}`);
console.log(`Branch: ${branch.ok ? branch.output : "unknown"}`);
console.log(`HEAD: ${head.ok ? head.output : "unknown"}`);
console.log(`Working tree clean: ${mark(isClean)}`);
console.log("");

console.log("Git status summary:");
if (status.ok && status.output) {
  console.log(status.output);
} else if (status.ok) {
  console.log("clean");
} else {
  console.log(`unable to read git status: ${status.output}`);
}
console.log("");

console.log("Agent package scripts:");
for (const name of agentScripts) {
  console.log(`- ${name}: ${mark(Boolean(packageScripts[name]))}`);
}
console.log("");

console.log("Sibling repo presence:");
for (const [name, exists] of Object.entries(siblingRepos)) {
  console.log(`- ${name}: ${mark(exists)}`);
}
console.log("");

console.log("Suggested next safe commands:");
console.log("- npm run agent:preflight");
console.log("- npm run agent:safety-scan");
console.log("- npm run agent:eval");
console.log("- npm run agent:verify -- --desktop");
console.log("- npm run agent:phase:handoff -- --phase <number>");
console.log("");
console.log("Advisory only: this script performs no writes, network calls, or product checks.");
