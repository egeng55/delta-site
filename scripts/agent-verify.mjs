#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const packageScripts = packageJson.scripts || {};

const commandSets = {
  "docs-only": [
    "npm run agent:preflight",
    "npm run agent:safety-scan",
  ],
  site: [
    "npm run agent:preflight",
    "npm run agent:safety-scan",
    "npm test -- --runInBand",
    "npm run lint",
    "npm run build",
  ],
  desktop: [
    "npm run agent:preflight",
    "npm run agent:safety-scan",
    "npm test -- --runInBand",
    "npm run lint",
    "npm run build",
    "npm run desktop:check",
    "npm run desktop:smoke",
    "npm run desktop:smoke:services",
  ],
};
commandSets.all = commandSets.desktop;

const args = process.argv.slice(2);
const scopeFlags = new Map([
  ["--docs-only", "docs-only"],
  ["--site", "site"],
  ["--desktop", "desktop"],
  ["--all", "all"],
]);
const selectedScopes = args.filter((arg) => scopeFlags.has(arg)).map((arg) => scopeFlags.get(arg));
const shouldRun = args.includes("--run");
const explicitPrint = args.includes("--print");

function scriptName(command) {
  const match = command.match(/^npm run ([^ ]+)/);
  return match ? match[1] : null;
}

function validateCommands(commands) {
  const missing = [];
  for (const command of commands) {
    const name = scriptName(command);
    if (name && !packageScripts[name]) missing.push(name);
  }
  return missing;
}

function printUsage() {
  console.log("Delta site agent verify");
  console.log("=======================");
  console.log("Default mode prints recommended verification commands only.");
  console.log("Use --run to execute commands sequentially.");
  console.log("");
  console.log("Scopes:");
  console.log("- --docs-only");
  console.log("- --site");
  console.log("- --desktop");
  console.log("- --all");
  console.log("");
  console.log("Examples:");
  console.log("npm run agent:verify -- --site");
  console.log("npm run agent:verify -- --desktop --run");
  console.log("");
}

function printCommands(scope, commands) {
  console.log(`Scope: ${scope}`);
  console.log(shouldRun ? "Mode: run" : explicitPrint ? "Mode: print" : "Mode: print (default)");
  console.log("");
  for (const command of commands) {
    console.log(command);
  }
  console.log("");
}

function runCommand(command) {
  console.log(`\n$ ${command}`);
  const result = spawnSync(command, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });
  if (result.error) {
    console.error(`Command failed to start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}: ${command}`);
    process.exit(result.status || 1);
  }
}

if (selectedScopes.length === 0) {
  printUsage();
  console.log("No scope provided; choose one of --docs-only, --site, --desktop, or --all.");
  process.exit(0);
}

if (selectedScopes.length > 1) {
  printUsage();
  console.log(`Multiple scopes provided (${selectedScopes.join(", ")}). Choose one scope per run.`);
  process.exit(0);
}

const scope = selectedScopes[0];
const commands = commandSets[scope];
const missingScripts = validateCommands(commands);

if (missingScripts.length > 0) {
  console.error(`Missing package scripts for scope ${scope}: ${missingScripts.join(", ")}`);
  process.exit(1);
}

printCommands(scope, commands);

if (!shouldRun) {
  console.log("No commands executed. Re-run with --run to execute sequentially.");
  process.exit(0);
}

for (const command of commands) runCommand(command);
console.log("\nVerification completed successfully.");
