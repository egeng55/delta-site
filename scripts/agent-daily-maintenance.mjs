#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  classifyFindings,
  readFindings,
  readPolicy,
  repoRoot,
  selectTopActionable,
} from "./agent-policy.mjs";

const require = createRequire(import.meta.url);
const {
  DEFAULT_BACKEND_URL,
  DEFAULT_EXPECTED_DOMAIN,
  runLiveEval,
} = require("./agent-eval-live-core.cjs");

const runsDir = path.join(repoRoot, "agent", "runs");
const phaseBriefsDir = path.join(repoRoot, "agent", "phase-briefs");
const evalsDir = path.join(repoRoot, "evals");

function parseArgs(argv) {
  const values = {
    report: false,
    json: false,
    write: false,
    force: false,
    includeLiveEval: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--report") values.report = true;
    else if (arg === "--json") values.json = true;
    else if (arg === "--write") values.write = true;
    else if (arg === "--force") values.force = true;
    else if (arg === "--include-live-eval") values.includeLiveEval = true;
    else throw new Error(`Unknown argument: ${arg}`);
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

function timestampForRun(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
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
  const safeItems = Array.isArray(items) && items.length > 0 ? items : ["none"];
  return safeItems.map((item) => `- ${item}`).join("\n");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function latestFileMatching(predicate) {
  if (!existsSync(runsDir)) return null;
  const matches = readdirSync(runsDir)
    .filter((name) => name.endsWith(".md") && predicate(name))
    .sort();
  const latest = matches.at(-1);
  if (!latest) return null;
  return {
    path: path.join("agent", "runs", latest),
    absolutePath: path.join(runsDir, latest),
  };
}

function latestRunArtifacts() {
  return {
    latestMaintenanceRecord: latestFileMatching((name) =>
      name.includes("-maintenance-run") ||
      name.includes("-maintenance-cycle") ||
      name.includes("-daily-maintenance"),
    ),
    latestLiveEvalReport: latestFileMatching((name) => name.includes("-live-domain-eval")),
  };
}

function findJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(entryPath);
    }
  }
  return results.sort();
}

function deterministicEvalSummary() {
  const files = findJsonFiles(evalsDir);
  let fixtureCount = 0;
  let sampleResponseCount = 0;
  const parseErrors = [];

  for (const filePath of files) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8"));
      const items = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.items)
          ? parsed.items
          : Array.isArray(parsed.fixtures)
            ? parsed.fixtures
            : [];
      fixtureCount += items.length;
      sampleResponseCount += items.filter(
        (item) => item && typeof item.sample_response === "string" && item.sample_response.trim().length > 0,
      ).length;
    } catch (error) {
      parseErrors.push(`${path.relative(repoRoot, filePath)}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    status: parseErrors.length > 0 ? "parse_errors" : "read_only_summary",
    files: files.map((filePath) => path.relative(repoRoot, filePath)),
    fileCount: files.length,
    fixtureCount,
    sampleResponseCount,
    parseErrors,
    note: "Static eval fixture inventory only; this wrapper does not run tests/build/lint.",
  };
}

function recommendedPhaseNumber() {
  if (!existsSync(phaseBriefsDir)) return 96;
  const phaseNumbers = readdirSync(phaseBriefsDir)
    .map((name) => name.match(/^phase-(\d+)-/))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));
  if (phaseNumbers.length === 0) return 96;
  return Math.max(...phaseNumbers) + 1;
}

function dispatchDecisionFor(finding, policy) {
  if (!finding || !policy) return "none";
  if (finding.status === "resolved" || finding.status === "deferred") return "report-only";
  const decisions = {
    human_required: "manual-only",
    implementation_requires_approval: "approval-required",
    docs_eval_autofix_allowed: "docs/eval worktree allowed after explicit command",
    brief_allowed: "brief-only",
    worktree_allowed: "worktree preview allowed",
    report_only: "report-only",
    blocked: "blocked",
  };
  return decisions[policy.actionMode] || "report-only";
}

function approvalRequirementFor(policy) {
  if (!policy) return "No top actionable finding is currently selected.";
  if (policy.actionMode === "human_required") return "Human/provider action is required.";
  if (policy.actionMode === "implementation_requires_approval") {
    return "Human approval is required before implementation, runtime, storage, or cross-repo changes.";
  }
  if (policy.actionMode === "docs_eval_autofix_allowed") {
    return "Docs/eval-only work still requires explicit phase approval and human merge review.";
  }
  if (policy.actionMode === "blocked") return "Action is blocked by policy.";
  return "Follow the selected policy mode before planning, worktree creation, or editing.";
}

function buildDispatchSummary(selected, selectedPolicy, nextPhase) {
  if (!selected || !selectedPolicy) {
    return {
      decision: "none",
      recommendedNextPhase: nextPhase,
      recommendedNextCommand: "npm run agent:maintenance:run -- --report",
      dispatchPlanCommand: null,
      findingBriefCommand: null,
    };
  }

  const finding = selected.finding;
  const name = slugify(finding.slug || finding.title);
  const dispatchPlanCommand = `npm run agent:dispatch:plan -- --id ${finding.id} --phase ${nextPhase} --name ${name}`;
  const findingBriefCommand = `npm run agent:finding:brief -- --id ${finding.id} --phase ${nextPhase} --name ${name}`;
  return {
    decision: dispatchDecisionFor(finding, selectedPolicy),
    recommendedNextPhase: nextPhase,
    recommendedNextCommand: dispatchPlanCommand,
    dispatchPlanCommand,
    findingBriefCommand,
  };
}

async function buildSummary(args, date = new Date()) {
  const timestamp = timestampForRun(date);
  const runId = `${timestamp}-daily-maintenance`;
  const branch = runGit(["branch", "--show-current"]) || "unknown";
  const head = runGit(["rev-parse", "--short", "HEAD"]);
  const gitStatus = runGit(["status", "--short"]);
  const repoClean = gitStatus.length === 0;
  const policy = readPolicy();
  const findings = readFindings();
  const classified = classifyFindings(findings, policy);
  const top = selectTopActionable(classified);
  const selected = top.selected;
  const selectedFinding = selected?.finding || null;
  const selectedPolicy = selected?.policy || null;
  const nextPhase = recommendedPhaseNumber();
  const dispatchSummary = buildDispatchSummary(selected, selectedPolicy, nextPhase);
  const runArtifacts = latestRunArtifacts();
  const evalSummary = deterministicEvalSummary();
  const refusedActions = [
    "No maintenance finding was implemented.",
    "No worktree was created.",
    "No branch was merged or deleted.",
    "No tests, build, lint, browser automation, or services were started by this wrapper.",
    "No external LLM API, Supabase mutation, mic, TTS, notification, or product memory/write action was run.",
    "No npm audit fix was run.",
  ];

  const summary = {
    runId,
    timestamp,
    generatedBy: "scripts/agent-daily-maintenance.mjs",
    reportOnlyDefault: true,
    wroteFile: false,
    includeLiveEval: args.includeLiveEval,
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
      routine: finding.routine,
      policyMode: findingPolicy.actionMode,
      policyReason: findingPolicy.reason,
    })),
    topActionable: selected
      ? {
          id: selectedFinding.id,
          title: selectedFinding.title,
          priority: selectedFinding.priority,
          status: selectedFinding.status,
          repo: selectedFinding.repo,
          routine: selectedFinding.routine,
          policyMode: selectedPolicy.actionMode,
          policyReason: selectedPolicy.reason,
          selectionRationale: top.rationale,
        }
      : {
          selectionRationale: top.rationale,
        },
    dispatch: dispatchSummary,
    approvalRequirement: approvalRequirementFor(selectedPolicy),
    allowedNextActions: selectedPolicy?.allowedNextCommands || [],
    forbiddenActions: selectedPolicy?.forbiddenActions || [],
    refusedActions,
    latestMaintenanceRecord: runArtifacts.latestMaintenanceRecord,
    latestLiveEvalReport: runArtifacts.latestLiveEvalReport,
    deterministicEvalSummary: evalSummary,
    liveEval: null,
    exactNextSafeCommand: dispatchSummary.recommendedNextCommand,
    notes: [
      "Daily maintenance wrapper completed in report-only mode.",
      "No implementation was performed.",
      "No scheduling, cron, launchd, or background agent was installed.",
      "This report is operational metadata for future agents.",
    ],
  };

  if (args.includeLiveEval) {
    summary.liveEval = await runLiveEval({
      backendUrl: process.env.NEXT_PUBLIC_DELTA_API_URL || DEFAULT_BACKEND_URL,
      expectedDomain: DEFAULT_EXPECTED_DOMAIN,
      requireLive: false,
    });
  }

  return summary;
}

function renderMarkdown(summary) {
  return `# Agent Daily Maintenance ${summary.runId}

Generated by: \`scripts/agent-daily-maintenance.mjs\`

This is a report-only daily-style maintenance wrapper. It composes local
findings, policy classification, dispatch planning context, recent run
artifacts, deterministic eval fixture inventory, and optional skip-safe live
eval status. It does not implement findings, create worktrees, merge branches,
run tests/build/lint, start services, schedule itself, or change product
behavior.

## Run Identity

- Run id: ${summary.runId}
- Timestamp: ${summary.timestamp}
- Repo root: ${summary.repo.root}
- Branch: ${summary.repo.branch}
- HEAD: ${summary.repo.head}
- Repo clean: ${summary.repo.clean ? "yes" : "no"}
- Live eval included: ${summary.includeLiveEval ? "yes" : "no"}

## Repo Status

\`\`\`text
${summary.repo.status}
\`\`\`

## Findings Summary

By status:
${list(Object.entries(summary.counts.byStatus).map(([key, value]) => `${key}: ${value}`))}

By priority:
${list(Object.entries(summary.counts.byPriority).map(([key, value]) => `${key}: ${value}`))}

## Policy Summary

By policy mode:
${list(Object.entries(summary.counts.byPolicyMode).map(([key, value]) => `${key}: ${value}`))}

## Top Actionable Finding

- Finding id: ${summary.topActionable.id || "none"}
- Title: ${summary.topActionable.title || "none"}
- Priority: ${summary.topActionable.priority || "none"}
- Status: ${summary.topActionable.status || "none"}
- Repo: ${summary.topActionable.repo || "none"}
- Routine: ${summary.topActionable.routine || "none"}
- Policy mode: ${summary.topActionable.policyMode || "none"}
- Policy reason: ${summary.topActionable.policyReason || "none"}
- Selection rationale: ${summary.topActionable.selectionRationale}

## Dispatch Summary

- Dispatch decision: ${summary.dispatch.decision}
- Recommended next phase: ${summary.dispatch.recommendedNextPhase}
- Approval requirement: ${summary.approvalRequirement}

Recommended dispatch command:

\`\`\`bash
${summary.dispatch.dispatchPlanCommand || summary.dispatch.recommendedNextCommand}
\`\`\`

Finding brief command:

\`\`\`bash
${summary.dispatch.findingBriefCommand || "none"}
\`\`\`

## Recent Records

- Latest maintenance record: ${summary.latestMaintenanceRecord?.path || "none"}
- Latest live eval report: ${summary.latestLiveEvalReport?.path || "none"}

## Deterministic Eval Inventory

- Status: ${summary.deterministicEvalSummary.status}
- Fixture files: ${summary.deterministicEvalSummary.fileCount}
- Fixture items: ${summary.deterministicEvalSummary.fixtureCount}
- Sample responses: ${summary.deterministicEvalSummary.sampleResponseCount}
- Note: ${summary.deterministicEvalSummary.note}

${summary.deterministicEvalSummary.parseErrors.length > 0 ? `Parse errors:
${list(summary.deterministicEvalSummary.parseErrors)}
` : ""}
## Live Eval Status

${summary.liveEval ? `- Status: ${summary.liveEval.status}
- Classification: ${summary.liveEval.classification}
- Reason: ${summary.liveEval.reason}
- Endpoint: ${summary.liveEval.endpoint}
- Token present: ${summary.liveEval.tokenProvided ? "yes" : "no"}
` : "- Not run. Pass `--include-live-eval` to include skip-safe optional live eval status."}

## Allowed Next Actions

${list(summary.allowedNextActions)}

## Forbidden Actions

${list(summary.forbiddenActions)}

## Refused Actions

${list(summary.refusedActions)}

## Exact Next Safe Command

\`\`\`bash
${summary.exactNextSafeCommand}
\`\`\`

## Product Behavior

- No implementation was performed.
- No product behavior changed.
- No /os runtime behavior changed.
- No backend runtime behavior changed.
- No mobile runtime behavior changed.
- No Supabase/mic/TTS/notification/product-memory/write actions ran, except this optional local report file when \`--write\` is used.
- No scheduler, cron, launchd job, MCP server, autonomous writer, worktree, merge, branch cleanup, or npm audit fix was created or run.
`;
}

function printReport(summary) {
  console.log("Delta daily maintenance report");
  console.log("==============================");
  console.log("Mode: report-only by default. No files are written unless --write is passed.");
  console.log(`Timestamp: ${summary.timestamp}`);
  console.log(`Repo: ${summary.repo.root}`);
  console.log(`HEAD: ${summary.repo.head}`);
  console.log(`Repo clean: ${summary.repo.clean ? "yes" : "no"}`);
  console.log("");
  console.log("Top actionable finding:");
  console.log(`- ${summary.topActionable.id || "none"} ${summary.topActionable.title || ""}`.trim());
  console.log(`- policy mode: ${summary.topActionable.policyMode || "none"}`);
  console.log(`- dispatch decision: ${summary.dispatch.decision}`);
  console.log(`- recommended next phase: ${summary.dispatch.recommendedNextPhase}`);
  console.log("");
  console.log("Policy summary:");
  for (const [mode, count] of Object.entries(summary.counts.byPolicyMode).sort()) {
    console.log(`- ${mode}: ${count}`);
  }
  console.log("");
  console.log("Recent records:");
  console.log(`- latest maintenance record: ${summary.latestMaintenanceRecord?.path || "none"}`);
  console.log(`- latest live eval report: ${summary.latestLiveEvalReport?.path || "none"}`);
  console.log("");
  console.log("Deterministic eval inventory:");
  console.log(`- fixture files: ${summary.deterministicEvalSummary.fileCount}`);
  console.log(`- fixture items: ${summary.deterministicEvalSummary.fixtureCount}`);
  console.log(`- sample responses: ${summary.deterministicEvalSummary.sampleResponseCount}`);
  if (summary.deterministicEvalSummary.parseErrors.length > 0) {
    console.log("- parse errors:");
    for (const error of summary.deterministicEvalSummary.parseErrors) console.log(`  - ${error}`);
  }
  console.log("");
  if (summary.liveEval) {
    console.log("Live eval:");
    console.log(`- status: ${summary.liveEval.status}`);
    console.log(`- classification: ${summary.liveEval.classification}`);
    console.log(`- reason: ${summary.liveEval.reason}`);
  } else {
    console.log("Live eval: not run. Pass --include-live-eval for skip-safe live eval status.");
  }
  console.log("");
  console.log("Refused actions:");
  for (const item of summary.refusedActions) console.log(`- ${item}`);
  console.log("");
  console.log("Exact next safe command:");
  console.log(summary.exactNextSafeCommand);
}

function writeReport(summary, force) {
  mkdirSync(runsDir, { recursive: true });
  const reportPath = path.join(runsDir, `${summary.runId}.md`);
  if (existsSync(reportPath) && !force) {
    throw new Error(`Daily maintenance report already exists: ${path.relative(repoRoot, reportPath)}. Pass --force to overwrite.`);
  }
  writeFileSync(reportPath, renderMarkdown(summary), { encoding: "utf8" });
  return reportPath;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Usage: npm run agent:daily:maintenance -- [--report] [--json] [--write] [--force] [--include-live-eval]");
    process.exit(2);
  }

  const summary = await buildSummary(args);
  let output = summary;

  if (args.write) {
    try {
      const reportPath = writeReport(summary, args.force);
      output = {
        ...summary,
        wroteFile: true,
        report: {
          written: true,
          path: path.relative(repoRoot, reportPath),
          absolutePath: reportPath,
        },
      };
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    printReport(output);
    if (output.report?.written) {
      console.log("");
      console.log(`Report written: ${output.report.path}`);
    }
  }
}

await main();
