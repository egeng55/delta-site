#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
  });
  if (result.error || result.status !== 0) return [];
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

const trackedAndPending = Array.from(new Set([
  ...runGit(["ls-files"]),
  ...runGit(["ls-files", "--others", "--exclude-standard"]),
]));

const allowedPrefixes = [
  "src/",
  "docs/",
  "scripts/",
  "desktop/",
  ".cursor/",
];
const allowedRootFiles = new Set([
  "AGENTS.md",
  "README.md",
  "package.json",
  "package-lock.json",
]);

const patterns = [
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
  { label: "Notification enablement wording", regex: /\bnotifications?\b/gi },
  { label: "Mic enablement wording", regex: /\bmic\b|\bmicrophone\b/gi },
  { label: "TTS enablement wording", regex: /\bTTS\b|\btext-to-speech\b/gi },
];

function shouldScan(relativePath) {
  if (allowedRootFiles.has(relativePath)) return true;
  return allowedPrefixes.some((prefix) => relativePath.startsWith(prefix));
}

function isTextLike(relativePath) {
  return /\.(cjs|css|html|js|json|md|mdc|mjs|ts|tsx|txt)$/.test(relativePath);
}

const findings = [];
for (const relativePath of trackedAndPending) {
  if (!shouldScan(relativePath) || !isTextLike(relativePath)) continue;
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) continue;
  const source = readFileSync(absolutePath, "utf8");
  const lines = source.split(/\r?\n/);
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
}

console.log("Delta site agent safety scan");
console.log("============================");
console.log("Scope: tracked and pending text files under src, docs, scripts, desktop, .cursor, plus selected root files.");
console.log("Mode: advisory read-only scan; findings do not fail the command.");
console.log("");

if (findings.length === 0) {
  console.log("No suspicious patterns found.");
} else {
  const grouped = new Map();
  for (const finding of findings) {
    const key = finding.label;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(finding);
  }
  for (const [label, items] of grouped) {
    console.log(`${label}: ${items.length}`);
    for (const item of items.slice(0, 12)) {
      console.log(`  - ${item.file}:${item.line}: ${item.excerpt}`);
    }
    if (items.length > 12) console.log(`  - ... ${items.length - 12} more`);
  }
}

console.log("");
console.log("Review findings in context. Documentation may intentionally mention forbidden patterns as safety guidance.");
