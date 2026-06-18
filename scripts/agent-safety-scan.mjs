#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const ignoredPathParts = [
  "node_modules",
  ".next",
  "out",
  "build",
  "coverage",
  "screenshots",
];

const sourcePrefixes = [
  "src/",
  "desktop/",
  "scripts/",
  ".cursor/",
];
const docPrefixes = [
  "docs/",
];
const sourceRootFiles = new Set([
  "package.json",
  "package-lock.json",
]);
const docRootFiles = new Set([
  "AGENTS.md",
  "README.md",
]);

const sourceRiskPatterns = [
  { label: "Local TTS enablement", regex: /ENABLE_LOCAL_TTS=true/g },
  { label: "Desktop notification enablement", regex: /ENABLE_DESKTOP_NOTIFICATIONS=true/g },
  { label: "Explicit side-effect confirmation", regex: /--confirm-side-effects/g },
  { label: "Live microphone mode", regex: /--mode live/g },
  { label: "Supabase migration path", regex: /supabase\/migrations/g },
  { label: "Privacy page path", regex: /privacy\/page\.tsx/g },
  { label: "Terms page path", regex: /terms\/page\.tsx/g },
  { label: "Auth context path", regex: /AuthContext\.tsx/g },
  { label: "Electron exec usage", regex: /\bexec\s*\(/g },
  { label: "Electron nodeIntegration enabled", regex: /nodeIntegration:\s*true/g },
  { label: "Electron contextIsolation disabled", regex: /contextIsolation:\s*false/g },
  { label: "Electron sandbox disabled", regex: /sandbox:\s*false/g },
  { label: "Memory write wording", regex: /\bmemory writes?\b|\bwrite memory\b/gi },
  { label: "Notification wording", regex: /\bnotifications?\b/gi },
  { label: "Mic wording", regex: /\bmic\b|\bmicrophone\b/gi },
  { label: "TTS wording", regex: /\bTTS\b|\btext-to-speech\b/gi },
];

const docMentionPatterns = [
  { label: "Side-effect flag mention", regex: /ENABLE_LOCAL_TTS=true|ENABLE_DESKTOP_NOTIFICATIONS=true|--confirm-side-effects|--mode live/g },
  { label: "High-risk file mention", regex: /supabase\/migrations|privacy\/page\.tsx|terms\/page\.tsx|AuthContext\.tsx/g },
  { label: "Electron safety setting mention", regex: /nodeIntegration:\s*true|contextIsolation:\s*false|sandbox:\s*false|\bexec\s*\(/g },
  { label: "Safety posture wording", regex: /\bmemory writes?\b|\bwrite memory\b|\bnotifications?\b|\bmic\b|\bmicrophone\b|\bTTS\b|\btext-to-speech\b/gi },
];

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.error || result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function isIgnored(relativePath) {
  return ignoredPathParts.some((part) => relativePath === part || relativePath.startsWith(`${part}/`) || relativePath.includes(`/${part}/`));
}

function isTextLike(relativePath) {
  return /\.(cjs|css|html|js|json|md|mdc|mjs|ts|tsx|txt)$/.test(relativePath);
}

function classifyFile(relativePath) {
  if (isIgnored(relativePath) || !isTextLike(relativePath)) return "ignored";
  if (docRootFiles.has(relativePath) || docPrefixes.some((prefix) => relativePath.startsWith(prefix))) return "documentation";
  if (sourceRootFiles.has(relativePath) || sourcePrefixes.some((prefix) => relativePath.startsWith(prefix))) return "source";
  return "ignored";
}

function scanFile(relativePath, category, source) {
  const lines = source.split(/\r?\n/);
  const patterns = category === "documentation" ? docMentionPatterns : sourceRiskPatterns;
  const findings = [];

  for (const pattern of patterns) {
    for (let index = 0; index < lines.length; index += 1) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(lines[index])) {
        findings.push({
          label: pattern.label,
          file: relativePath,
          line: index + 1,
          excerpt: lines[index].trim().slice(0, 180),
        });
      }
    }
  }

  return findings;
}

function groupByLabel(findings) {
  const grouped = new Map();
  for (const finding of findings) {
    if (!grouped.has(finding.label)) grouped.set(finding.label, []);
    grouped.get(finding.label).push(finding);
  }
  return grouped;
}

function printFindingSection(title, description, findings, emphasis) {
  console.log(title);
  console.log("-".repeat(title.length));
  console.log(description);

  if (findings.length === 0) {
    console.log("No findings.");
    console.log("");
    return;
  }

  const grouped = groupByLabel(findings);
  for (const [label, items] of grouped) {
    console.log(`${emphasis} ${label}: ${items.length}`);
    for (const item of items.slice(0, 10)) {
      console.log(`  - ${item.file}:${item.line}: ${item.excerpt}`);
    }
    if (items.length > 10) console.log(`  - ... ${items.length - 10} more`);
  }
  console.log("");
}

const trackedAndPending = Array.from(new Set([
  ...runGit(["ls-files"]),
  ...runGit(["ls-files", "--others", "--exclude-standard"]),
]));

const sourceFindings = [];
const docFindings = [];
let ignoredCount = 0;

for (const relativePath of trackedAndPending) {
  const category = classifyFile(relativePath);
  if (category === "ignored") {
    ignoredCount += 1;
    continue;
  }
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) continue;
  const source = readFileSync(absolutePath, "utf8");
  const findings = scanFile(relativePath, category, source);
  if (category === "documentation") docFindings.push(...findings);
  else sourceFindings.push(...findings);
}

console.log("Delta site agent safety scan");
console.log("============================");
console.log("Mode: advisory read-only scan; findings do not fail the command.");
console.log("Skipped generated/build/dependency artifacts such as node_modules, .next, build, out, coverage, and screenshots.");
console.log(`Ignored/generated files skipped: ${ignoredCount}`);
console.log("");

printFindingSection(
  "Source/config risks",
  "Review these first. They appear in source, scripts, desktop code, package config, or Cursor rules.",
  sourceFindings,
  "!",
);

printFindingSection(
  "Documentation mentions",
  "Lower severity. These are usually policy, safety copy, tests, or docs mentioning forbidden patterns intentionally.",
  docFindings,
  "-",
);

console.log("Generated/build artifacts ignored");
console.log("---------------------------------");
console.log("node_modules, .next, out, build, coverage, screenshots, and non-text artifacts are intentionally skipped.");
console.log("");
console.log("Advisory only: review findings in context. Documentation may intentionally mention forbidden patterns as safety guidance.");
