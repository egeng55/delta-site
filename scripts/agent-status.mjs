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
  "agent:context",
  "agent:safety-scan",
  "agent:eval",
  "agent:verify",
  "agent:routine",
  "agent:orchestrate",
  "agent:maintenance",
  "agent:finding:brief",
  "agent:phase:brief",
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

function unique(values) {
  return [...new Set(values)];
}

function workspaceCandidates() {
  const repoParent = path.dirname(repoRoot);
  const parentName = path.basename(repoParent);
  const homeCandidate = parentName === "delta" || parentName === "delta-worktrees" ? path.dirname(repoParent) : repoParent;
  return unique([
    repoParent,
    path.join(homeCandidate, "delta"),
    homeCandidate,
  ]);
}

function findRepo(name) {
  for (const candidate of workspaceCandidates()) {
    const repoPath = path.join(candidate, name);
    if (existsSync(repoPath)) return repoPath;
  }
  return null;
}

function findUnrelatedMorningStandup() {
  const repoParent = path.dirname(repoRoot);
  const parentName = path.basename(repoParent);
  const homeCandidate = parentName === "delta" || parentName === "delta-worktrees" ? path.dirname(repoParent) : repoParent;
  const candidates = [
    path.join(homeCandidate, "morning-standup"),
    path.join(homeCandidate, "Morning-Standup"),
    path.join(homeCandidate, "delta", "Morning-Standup"),
    path.join(homeCandidate, "delta", "morning-standup"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

function isInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

const invokedFrom = process.cwd();
const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const head = runGit(["rev-parse", "--short", "HEAD"]);
const status = runGit(["status", "--short"]);
const isClean = status.ok && status.output.length === 0;
const repoParent = path.dirname(repoRoot);
const parentName = path.basename(repoParent);
const homeCandidate = parentName === "delta" || parentName === "delta-worktrees" ? path.dirname(repoParent) : repoParent;
const preferredProductRoot = path.join(homeCandidate, "delta");
const canonicalWorktreeRoot = path.join(homeCandidate, "delta-worktrees");
const layout = parentName === "delta" ? "grouped-delta" : parentName === "delta-worktrees" ? "worktree" : "flat";
const siblingRepos = {
  "delta-backend": findRepo("delta-backend"),
  "delta-mobile": findRepo("delta-mobile"),
};
const morningStandup = findUnrelatedMorningStandup();
const morningStandupInsideDelta = morningStandup ? isInside(morningStandup, preferredProductRoot) : false;
const groupedLayoutPending = layout !== "grouped-delta";

console.log("Delta site agent status");
console.log("=======================");
console.log(`Repo root: ${repoRoot}`);
console.log(`Invoked from: ${invokedFrom}`);
console.log(`Branch: ${branch.ok ? branch.output : "unknown"}`);
console.log(`HEAD: ${head.ok ? head.output : "unknown"}`);
console.log(`Working tree clean: ${mark(isClean)}`);
console.log("");

console.log("Workspace layout:");
console.log(`- detected layout: ${layout}`);
console.log(`- preferred product root: ${preferredProductRoot}`);
console.log(`- canonical worktree root: ${canonicalWorktreeRoot}`);
console.log(`- delta-site: ${repoRoot}`);
console.log(`- delta-backend: ${siblingRepos["delta-backend"] || "not found"}`);
console.log(`- delta-mobile: ${siblingRepos["delta-mobile"] || "not found"}`);
console.log(`- unrelated morning-standup excluded: ${morningStandup || "not found"}`);
console.log(`- preferred grouped layout pending: ${groupedLayoutPending ? "yes" : "no"}`);
if (morningStandupInsideDelta) {
  console.log("- note: Morning-Standup is under the Delta parent folder but remains excluded from Delta context.");
} else if (morningStandup) {
  console.log("- note: Morning-Standup is separate from Delta and remains excluded from Delta context.");
}
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
for (const [name, repoPath] of Object.entries(siblingRepos)) {
  console.log(`- ${name}: ${repoPath ? `yes (${repoPath})` : "no"}`);
}
console.log("");

console.log("Suggested next safe commands:");
console.log("- npm run agent:preflight");
console.log("- npm run agent:context");
console.log("- npm run agent:safety-scan");
console.log("- npm run agent:eval");
console.log("- npm run agent:verify -- --desktop");
console.log("- npm run agent:phase:handoff -- --phase <number>");
console.log("");
console.log("Advisory only: this script performs no writes, network calls, or product checks.");
