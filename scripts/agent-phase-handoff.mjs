#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const packageScripts = packageJson.scripts || {};

function parseArgs(argv) {
  const values = { phase: "unknown" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--phase") {
      values.phase = argv[index + 1] || "unknown";
      index += 1;
    }
  }
  return values;
}

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

function commandIfPresent(name, command) {
  return packageScripts[name] ? `- ${command}` : `- ${command} (script missing)`;
}

const args = parseArgs(process.argv.slice(2));
const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
const head = runGit(["rev-parse", "--short", "HEAD"]);
const status = runGit(["status", "--short"]);
const changedFiles = status.ok && status.output
  ? status.output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  : [];

console.log("Delta site phase handoff skeleton");
console.log("=================================");
console.log("");
console.log(`Current phase: ${args.phase}`);
console.log("");
console.log("Goal:");
console.log("- TODO: summarize the requested phase objective.");
console.log("");
console.log("Repo state:");
console.log(`- repo root: ${repoRoot}`);
console.log(`- branch: ${branch.ok ? branch.output : "unknown"}`);
console.log(`- HEAD: ${head.ok ? head.output : "unknown"}`);
console.log(`- working tree clean: ${changedFiles.length === 0 ? "yes" : "no"}`);
console.log("");
console.log("Changed files from git status:");
if (changedFiles.length === 0) {
  console.log("- none");
} else {
  for (const file of changedFiles) console.log(`- ${file}`);
}
console.log("");
console.log("Suggested verification commands:");
console.log(commandIfPresent("agent:status", "npm run agent:status"));
console.log(commandIfPresent("agent:preflight", "npm run agent:preflight"));
console.log(commandIfPresent("agent:safety-scan", "npm run agent:safety-scan"));
console.log(commandIfPresent("agent:eval", "npm run agent:eval"));
console.log(commandIfPresent("agent:verify", "npm run agent:verify -- --desktop"));
console.log("");
console.log("Safety confirmation checklist:");
console.log("- Product behavior changed: no/yes/TODO");
console.log("- /os behavior changed: no/yes/TODO");
console.log("- Backend touched: no/yes/TODO");
console.log("- Mobile touched: no/yes/TODO");
console.log("- Supabase mutation: no/yes/TODO");
console.log("- Live mic run: no/yes/TODO");
console.log("- TTS run: no/yes/TODO");
console.log("- Notification run: no/yes/TODO");
console.log("- Memory writes added: no/yes/TODO");
console.log("- Auth/billing/privacy/terms/schema/migration/deployment changed: no/yes/TODO");
console.log("");
console.log("Implementation details:");
console.log("- TODO: list key files and decisions.");
console.log("");
console.log("Warnings or known risks:");
console.log("- TODO: list existing warnings, skipped checks, or residual risk.");
console.log("");
console.log("Next safest command:");
console.log("npm run agent:status");
console.log("");
console.log("Print-only: this script does not write handoff files, commit, clean files, or touch sibling repos.");
