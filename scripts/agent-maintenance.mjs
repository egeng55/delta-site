#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const findingsDir = path.join(repoRoot, "agent", "findings");
const args = process.argv.slice(2);
const outputJson = args.includes("--json");

const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
const statusOrder = { open: 0, "pending-human": 1, deferred: 2, resolved: 3 };

function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, "");
}

function parseScalar(value) {
  const stripped = stripQuotes(value.trim());
  if (stripped === "true") return true;
  if (stripped === "false") return false;
  return stripped;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return {};

  const data = {};
  let currentListKey = null;
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentListKey) {
      data[currentListKey].push(stripQuotes(listItem[1].trim()));
      continue;
    }

    const keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValue) continue;
    const [, key, rawValue] = keyValue;
    if (rawValue.trim() === "") {
      data[key] = [];
      currentListKey = key;
    } else {
      data[key] = parseScalar(rawValue);
      currentListKey = null;
    }
  }
  return data;
}

function readFindings() {
  if (!existsSync(findingsDir)) return [];
  return readdirSync(findingsDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const filePath = path.join(findingsDir, name);
      const text = readFileSync(filePath, "utf8");
      return {
        file: path.relative(repoRoot, filePath),
        ...parseFrontmatter(text),
      };
    })
    .sort((a, b) => {
      const priorityDelta = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
      if (priorityDelta !== 0) return priorityDelta;
      const statusDelta = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (statusDelta !== 0) return statusDelta;
      return Number(a.id) - Number(b.id);
    });
}

function summarize(findings) {
  const counts = {};
  for (const finding of findings) {
    const key = `${finding.priority || "unknown"}:${finding.status || "unknown"}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function printReport(findings) {
  console.log("Delta maintenance findings");
  console.log("==========================");
  console.log("Mode: read-only report. No files are written and no findings are changed.");
  console.log(`Findings directory: ${path.relative(repoRoot, findingsDir)}`);
  console.log("");

  if (findings.length === 0) {
    console.log("No findings found.");
    return;
  }

  console.log("Summary:");
  const counts = summarize(findings);
  for (const [key, count] of Object.entries(counts).sort()) {
    console.log(`- ${key}: ${count}`);
  }
  console.log("");

  console.log("Findings:");
  for (const finding of findings) {
    const executable = finding.agent_executable === true ? "agent-actionable" : "not agent-actionable";
    console.log(`- ${finding.id} [${finding.priority}] ${finding.status}: ${finding.title}`);
    console.log(`  repo: ${finding.repo}; routine: ${finding.routine}; ${executable}`);
    console.log(`  file: ${finding.file}`);
  }
  console.log("");
  console.log("Use `npm run agent:finding:brief -- --top --phase <number>` to generate a scoped phase brief.");
}

const findings = readFindings();

if (outputJson) {
  process.stdout.write(JSON.stringify({ findings, counts: summarize(findings) }, null, 2));
  process.stdout.write("\n");
} else {
  printReport(findings);
}
