#!/usr/bin/env node

import path from "node:path";
import {
  classifyFindings,
  readFindings,
  readPolicy,
  repoRoot,
} from "./agent-policy.mjs";

const args = process.argv.slice(2);
const outputJson = args.includes("--json");

function summarize(classifiedFindings) {
  const counts = {};
  const policyModes = {};
  for (const { finding, policy } of classifiedFindings) {
    const key = `${finding.priority || "unknown"}:${finding.status || "unknown"}`;
    counts[key] = (counts[key] || 0) + 1;
    policyModes[policy.actionMode] = (policyModes[policy.actionMode] || 0) + 1;
  }
  return { counts, policyModes };
}

function printReport(classifiedFindings) {
  console.log("Delta maintenance findings");
  console.log("==========================");
  console.log("Mode: read-only report. No files are written and no findings are changed.");
  console.log("Findings directory: agent/findings");
  console.log("");

  if (classifiedFindings.length === 0) {
    console.log("No findings found.");
    return;
  }

  const summary = summarize(classifiedFindings);
  console.log("Summary:");
  for (const [key, count] of Object.entries(summary.counts).sort()) {
    console.log(`- ${key}: ${count}`);
  }
  console.log("");

  console.log("Policy modes:");
  for (const [mode, count] of Object.entries(summary.policyModes).sort()) {
    console.log(`- ${mode}: ${count}`);
  }
  console.log("");

  console.log("Findings:");
  for (const { finding, policy } of classifiedFindings) {
    const executable = finding.agent_executable === true ? "agent-actionable" : "not agent-actionable";
    console.log(`- ${finding.id} [${finding.priority}] ${finding.status}: ${finding.title}`);
    console.log(`  repo: ${finding.repo}; routine: ${finding.routine}; ${executable}`);
    console.log(`  policy mode: ${policy.actionMode}`);
    console.log(`  reason: ${policy.reason}`);
    console.log(`  file: ${finding.file}`);
  }
  console.log("");
  console.log("Use `npm run agent:policy -- --top-actionable` to inspect the next policy-allowed finding.");
  console.log("Use `npm run agent:finding:brief -- --top --phase <number>` to generate a scoped phase brief.");
}

const policy = readPolicy();
const findings = readFindings();
const classifiedFindings = classifyFindings(findings, policy);

if (outputJson) {
  process.stdout.write(JSON.stringify({
    findings: classifiedFindings.map(({ finding, policy: findingPolicy }) => ({
      ...finding,
      policy: findingPolicy,
      file: path.relative(repoRoot, path.join(repoRoot, finding.file)),
    })),
    ...summarize(classifiedFindings),
  }, null, 2));
  process.stdout.write("\n");
} else {
  printReport(classifiedFindings);
}
