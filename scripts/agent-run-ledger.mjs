#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  classifyFindings,
  readFindings,
  readPolicy,
  repoRoot,
  selectTopActionable,
} from "./agent-policy.mjs";

const runsDir = path.join(repoRoot, "agent", "runs");

function parseArgs(argv) {
  const values = {
    report: false,
    json: false,
    write: false,
    force: false,
    finding: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--report") values.report = true;
    else if (arg === "--json") values.json = true;
    else if (arg === "--write") values.write = true;
    else if (arg === "--force") values.force = true;
    else if (arg === "--finding") {
      values.finding = argv[index + 1] || null;
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
  if (result.error) return "";
  return (result.stdout || result.stderr || "").trim();
}

function timestampForRun() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function list(items) {
  if (!items || items.length === 0) return "- none";
  return items.map((item) => `- ${item}`).join("\n");
}

function buildSummary(args) {
  const timestamp = timestampForRun();
  const runId = `${timestamp}-maintenance-run`;
  const head = runGit(["rev-parse", "--short", "HEAD"]);
  const branch = runGit(["branch", "--show-current"]) || "unknown";
  const gitStatus = runGit(["status", "--short"]);
  const repoClean = gitStatus.length === 0;
  const policy = readPolicy();
  const findings = readFindings();
  const classified = classifyFindings(findings, policy);
  const top = selectTopActionable(classified);
  const focus = args.finding
    ? classified.find(({ finding }) => finding.id === args.finding) || null
    : null;
  const selected = focus || top.selected;
  const selectedPolicy = selected?.policy || null;
  const selectedFinding = selected?.finding || null;
  const recommendedNextCommand = selectedFinding
    ? `npm run agent:finding:brief -- --id ${selectedFinding.id} --phase <number> --name ${selectedFinding.slug || "<slug>"}`
    : "npm run agent:maintenance -- --report";
  const exactFindingBriefCommand = selectedFinding
    ? `npm run agent:finding:brief -- --id ${selectedFinding.id} --phase <number> --name ${selectedFinding.slug || "<slug>"}`
    : null;

  const refusedActions = [
    "No maintenance finding was implemented.",
    "No worktree was created.",
    "No tests or services were run by the ledger command.",
    "No Supabase, mic, TTS, notification, or product memory/write action was run.",
    "No autonomous merge, branch cleanup, or npm audit fix was run.",
  ];

  return {
    runId,
    timestamp,
    generatedBy: "scripts/agent-run-ledger.mjs",
    reportOnlyDefault: true,
    wroteFile: false,
    repo: {
      root: repoRoot,
      branch,
      head,
      clean: repoClean,
      status: gitStatus || "(clean)",
    },
    counts: {
      byStatus: countBy(classified, ({ finding }) => finding.status),
      byPriority: countBy(classified, ({ finding }) => finding.priority),
      byPolicyMode: countBy(classified, ({ policy: findingPolicy }) => findingPolicy.actionMode),
    },
    findings: classified.map(({ finding, policy: findingPolicy }) => ({
      id: finding.id,
      title: finding.title,
      priority: finding.priority,
      status: finding.status,
      repo: finding.repo,
      policyMode: findingPolicy.actionMode,
      policyReason: findingPolicy.reason,
    })),
    topActionable: top.selected
      ? {
          id: top.selected.finding.id,
          title: top.selected.finding.title,
          priority: top.selected.finding.priority,
          status: top.selected.finding.status,
          repo: top.selected.finding.repo,
          policyMode: top.selected.policy.actionMode,
          reason: top.selected.policy.reason,
          selectionRationale: top.rationale,
        }
      : {
          selectionRationale: top.rationale,
        },
    focusedFinding: focus
      ? {
          id: focus.finding.id,
          title: focus.finding.title,
          policyMode: focus.policy.actionMode,
          reason: focus.policy.reason,
        }
      : null,
    allowedNextActions: selectedPolicy?.allowedNextCommands || [],
    forbiddenActions: selectedPolicy?.forbiddenActions || [],
    refusedActions,
    humanApprovalRequirements: selectedPolicy
      ? selectedPolicy.actionMode === "human_required"
        ? ["Human/provider action is required before this finding can be closed."]
        : selectedPolicy.actionMode === "implementation_requires_approval"
          ? ["Human approval is required before implementation or runtime changes."]
          : ["Follow policy mode before creating worktrees or editing files."]
      : ["No policy-allowed finding selected."],
    recommendedNextCommand,
    exactFindingBriefCommand,
    notes: [
      "No product behavior changed.",
      "No maintenance finding was implemented.",
      "This run record is operational metadata for future agents.",
    ],
  };
}

function renderMarkdown(summary) {
  return `# Agent Maintenance Run ${summary.runId}

Generated by: \`scripts/agent-run-ledger.mjs\`

This is a run ledger record. It documents what the agent maintenance system
inspected and what policy allowed. It does not implement findings, create
worktrees, run tests, call services, or change product behavior.

## Run Identity

- Run id: ${summary.runId}
- Timestamp: ${summary.timestamp}
- Repo root: ${summary.repo.root}
- Branch: ${summary.repo.branch}
- HEAD: ${summary.repo.head}
- Repo clean: ${summary.repo.clean ? "yes" : "no"}

## Repo Status

\`\`\`text
${summary.repo.status}
\`\`\`

## Finding Counts

By status:
${list(Object.entries(summary.counts.byStatus).map(([key, value]) => `${key}: ${value}`))}

By priority:
${list(Object.entries(summary.counts.byPriority).map(([key, value]) => `${key}: ${value}`))}

By policy mode:
${list(Object.entries(summary.counts.byPolicyMode).map(([key, value]) => `${key}: ${value}`))}

## Top Actionable Finding

- Finding id: ${summary.topActionable.id || "none"}
- Title: ${summary.topActionable.title || "none"}
- Priority: ${summary.topActionable.priority || "none"}
- Status: ${summary.topActionable.status || "none"}
- Repo: ${summary.topActionable.repo || "none"}
- Policy mode: ${summary.topActionable.policyMode || "none"}
- Policy reason: ${summary.topActionable.reason || "none"}
- Selection rationale: ${summary.topActionable.selectionRationale}

## Allowed Next Actions

${list(summary.allowedNextActions)}

## Forbidden Actions

${list(summary.forbiddenActions)}

## Refused Actions

${list(summary.refusedActions)}

## Human Approval Requirements

${list(summary.humanApprovalRequirements)}

## Recommended Next Command

\`\`\`bash
${summary.recommendedNextCommand}
\`\`\`

${summary.exactFindingBriefCommand ? `Exact finding-to-brief command:

\`\`\`bash
${summary.exactFindingBriefCommand}
\`\`\`
` : ""}
## Finding Snapshot

${summary.findings.map((finding) => `- ${finding.id} [${finding.priority}] ${finding.status}: ${finding.title} (${finding.policyMode})`).join("\n")}

## Product Behavior

- No product behavior changed.
- No /os runtime behavior changed.
- No backend runtime behavior changed.
- No mobile runtime behavior changed.
- No Supabase/mic/TTS/notification/product-memory/write actions ran.
`;
}

function printReport(summary) {
  console.log("Delta agent run ledger");
  console.log("======================");
  console.log("Mode: report-only by default. No files are written unless --write is passed.");
  console.log("");
  console.log(`Run id: ${summary.runId}`);
  console.log(`HEAD: ${summary.repo.head}`);
  console.log(`Repo clean: ${summary.repo.clean ? "yes" : "no"}`);
  console.log("");
  console.log("Counts by policy mode:");
  for (const [mode, count] of Object.entries(summary.counts.byPolicyMode).sort()) {
    console.log(`- ${mode}: ${count}`);
  }
  console.log("");
  console.log("Top actionable finding:");
  console.log(`- id: ${summary.topActionable.id || "none"}`);
  console.log(`- title: ${summary.topActionable.title || "none"}`);
  console.log(`- policy mode: ${summary.topActionable.policyMode || "none"}`);
  console.log(`- rationale: ${summary.topActionable.selectionRationale}`);
  console.log("");
  console.log("Recommended next command:");
  console.log(summary.recommendedNextCommand);
  console.log("");
  console.log("Refused actions:");
  for (const action of summary.refusedActions) console.log(`- ${action}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = buildSummary(args);
  const targetPath = path.join(runsDir, `${summary.runId}.md`);
  summary.targetPath = path.relative(repoRoot, targetPath);

  if (args.write) {
    if (existsSync(targetPath) && !args.force) {
      const message = `Refusing to overwrite existing run record: ${summary.targetPath}. Use --force intentionally.`;
      if (args.json) process.stdout.write(`${JSON.stringify({ ...summary, error: message }, null, 2)}\n`);
      else console.error(message);
      process.exit(1);
    }
    mkdirSync(runsDir, { recursive: true });
    writeFileSync(targetPath, renderMarkdown(summary), "utf8");
    summary.wroteFile = true;
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  printReport(summary);
  if (args.write) {
    console.log("");
    console.log(`Run record written: ${summary.targetPath}`);
  } else {
    console.log("");
    console.log("Print-only: no files written. Add --write to create a run record.");
  }
}

main();
