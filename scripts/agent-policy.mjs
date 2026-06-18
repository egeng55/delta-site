#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const repoRoot = path.resolve(__dirname, "..");
export const findingsDir = path.join(repoRoot, "agent", "findings");
export const policyPath = path.join(repoRoot, "agent", "policies", "maintenance-policy.json");

const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
const statusOrder = { open: 0, "pending-human": 1, deferred: 2, resolved: 3 };
const actionableModes = new Set([
  "brief_allowed",
  "worktree_allowed",
  "docs_eval_autofix_allowed",
  "implementation_requires_approval",
]);
const blockedTopModes = new Set(["human_required", "blocked", "report_only"]);

function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, "");
}

function parseScalar(value) {
  const stripped = stripQuotes(value.trim());
  if (stripped === "true") return true;
  if (stripped === "false") return false;
  return stripped;
}

export function parseFrontmatter(text) {
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

export function readFindings() {
  if (!existsSync(findingsDir)) return [];
  return readdirSync(findingsDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const filePath = path.join(findingsDir, name);
      const text = readFileSync(filePath, "utf8");
      return {
        file: path.relative(repoRoot, filePath),
        body: text.replace(/^---\n[\s\S]*?\n---\n?/, "").trim(),
        ...parseFrontmatter(text),
      };
    })
    .sort(compareFindings);
}

export function readPolicy() {
  if (!existsSync(policyPath)) {
    return { version: 0, defaultMode: "report_only", modes: {} };
  }
  return JSON.parse(readFileSync(policyPath, "utf8"));
}

export function compareFindings(a, b) {
  const priorityDelta = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
  if (priorityDelta !== 0) return priorityDelta;
  const statusDelta = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
  if (statusDelta !== 0) return statusDelta;
  return Number(a.id) - Number(b.id);
}

function policyText(finding) {
  return [
    finding.id,
    finding.title,
    finding.priority,
    finding.status,
    finding.repo,
    finding.routine,
    finding.slug,
    finding.recommended_next_phase,
    finding.body,
    ...(Array.isArray(finding.likely_files) ? finding.likely_files : []),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function modeSummary(policy, mode) {
  return policy.modes?.[mode]?.summary || "";
}

function nextCommandsForMode(finding, mode) {
  const phase = "<number>";
  const name = finding.slug || "<slug>";
  const commands = {
    report_only: [
      `npm run agent:policy -- --id ${finding.id}`,
      "npm run agent:maintenance -- --report",
    ],
    brief_allowed: [
      `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${name}`,
      `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${name} --write`,
    ],
    worktree_allowed: [
      `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${name}`,
      `npm run agent:phase:start -- --phase ${phase} --name ${name} --print`,
      "Create the worktree only after an explicit reviewed command with --run.",
    ],
    docs_eval_autofix_allowed: [
      `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${name}`,
      `npm run agent:phase:start -- --phase ${phase} --name ${name} --print`,
      "Docs/eval-only implementation may happen only in an isolated worktree after explicit phase approval.",
    ],
    implementation_requires_approval: [
      `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${name}`,
      "Get explicit human approval before code or runtime changes.",
    ],
    human_required: [
      `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${name}`,
      "Use the brief for manual checklist/confirmation only.",
    ],
    blocked: [
      `npm run agent:policy -- --id ${finding.id}`,
      "Stop. Do not generate an implementation brief or make changes.",
    ],
  };
  return commands[mode] || commands.report_only;
}

function forbiddenActionsForMode(mode) {
  const base = [
    "do not mutate Supabase",
    "do not run mic/TTS/notifications",
    "do not add memory writes",
    "do not run npm audit fix",
    "do not print or commit secrets",
    "do not perform destructive cleanup",
  ];
  const extra = {
    report_only: ["do not generate briefs", "do not create worktrees", "do not implement changes"],
    brief_allowed: ["do not implement changes", "do not create worktrees without a separate explicit phase"],
    worktree_allowed: ["do not implement changes unless separately allowed", "do not create worktrees without explicit --run"],
    docs_eval_autofix_allowed: ["do not touch product runtime files", "do not merge without human review"],
    implementation_requires_approval: ["do not change code/runtime behavior before human approval"],
    human_required: ["do not claim provider-side action is complete", "do not rotate credentials from repo scripts"],
    blocked: ["do not generate implementation briefs", "do not act on this finding"],
  };
  return [...base, ...(extra[mode] || [])];
}

function addDecision(decisions, mode, reason) {
  decisions.push({ mode, reason });
}

export function classifyFinding(finding, policy = readPolicy()) {
  const decisions = [];
  const text = policyText(finding);
  const statusRule = policy.statusRules?.[finding.status];

  if (statusRule) {
    addDecision(decisions, statusRule.mode, statusRule.reason);
  }

  if (!statusRule) {
    for (const rule of policy.keywordRules || []) {
      const matched = (rule.keywords || []).find((keyword) => text.includes(keyword.toLowerCase()));
      if (matched) {
        addDecision(decisions, rule.mode, `${rule.reason} Matched keyword: ${matched}.`);
        break;
      }
    }
  }

  if (decisions.length === 0) {
    const routineRule = policy.routineRules?.[finding.routine];
    if (routineRule) addDecision(decisions, routineRule.mode, routineRule.reason);
  }

  if (decisions.length === 0) {
    const repoRule = policy.repoRules?.[finding.repo];
    if (repoRule) addDecision(decisions, repoRule.mode, repoRule.reason);
  }

  if (decisions.length === 0 && finding.agent_executable === true) {
    addDecision(decisions, "brief_allowed", "Finding is open and marked agent-executable, but no higher-risk rule matched.");
  }

  if (decisions.length === 0) {
    addDecision(decisions, policy.defaultMode || "report_only", "No policy rule matched.");
  }

  const primary = decisions[0];
  const priorityRule = policy.priorityRules?.[finding.priority];
  const notes = [];
  if (priorityRule) notes.push(priorityRule.reason);
  if (finding.priority === "P0" && primary.mode === "docs_eval_autofix_allowed") {
    primary.mode = "implementation_requires_approval";
    primary.reason = `${primary.reason} Downgraded because P0 findings must not auto-implement.`;
  }

  return {
    findingId: finding.id,
    title: finding.title,
    priority: finding.priority,
    status: finding.status,
    repo: finding.repo,
    routine: finding.routine,
    actionMode: primary.mode,
    modeSummary: modeSummary(policy, primary.mode),
    reason: primary.reason,
    notes,
    allowedNextCommands: nextCommandsForMode(finding, primary.mode),
    forbiddenActions: forbiddenActionsForMode(primary.mode),
    decisions,
  };
}

export function classifyFindings(findings = readFindings(), policy = readPolicy()) {
  return findings.map((finding) => ({
    finding,
    policy: classifyFinding(finding, policy),
  }));
}

export function selectTopActionable(classifiedFindings) {
  const candidates = classifiedFindings
    .filter(({ finding, policy }) => {
      if (finding.status === "resolved" || finding.status === "deferred") return false;
      if (blockedTopModes.has(policy.actionMode)) return false;
      return actionableModes.has(policy.actionMode);
    })
    .sort((a, b) => compareFindings(a.finding, b.finding));

  const selected = candidates[0] || null;
  return {
    selected,
    rationale: selected
      ? `Selected highest-priority finding whose policy allows at least brief generation: ${selected.finding.priority} ${selected.finding.status} id ${selected.finding.id} (${selected.policy.actionMode}).`
      : "No finding currently allows brief generation or later action under policy.",
  };
}

function parseArgs(argv) {
  const values = {
    report: false,
    json: false,
    id: null,
    topActionable: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--report") values.report = true;
    else if (arg === "--json") values.json = true;
    else if (arg === "--top-actionable") values.topActionable = true;
    else if (arg === "--id") {
      values.id = argv[index + 1] || null;
      index += 1;
    }
  }

  return values;
}

function groupByMode(classified) {
  const grouped = {};
  for (const item of classified) {
    const mode = item.policy.actionMode;
    grouped[mode] = (grouped[mode] || 0) + 1;
  }
  return grouped;
}

function reportItems(classified, rationale = null) {
  console.log("Delta maintenance policy report");
  console.log("===============================");
  console.log("Mode: read-only report. No files are written, no commands are executed, and no findings are changed.");
  console.log(`Policy config: ${path.relative(repoRoot, policyPath)}`);
  console.log("");

  if (rationale) {
    console.log(`Selection: ${rationale}`);
    console.log("");
  }

  console.log("Summary by action mode:");
  const grouped = groupByMode(classified);
  for (const [mode, count] of Object.entries(grouped).sort()) {
    console.log(`- ${mode}: ${count}`);
  }
  console.log("");

  for (const { finding, policy } of classified) {
    console.log(`${finding.id} [${finding.priority}] ${finding.status}: ${finding.title}`);
    console.log(`  repo: ${finding.repo}; routine: ${finding.routine}`);
    console.log(`  action mode: ${policy.actionMode}`);
    console.log(`  reason: ${policy.reason}`);
    if (policy.notes.length > 0) console.log(`  note: ${policy.notes.join(" ")}`);
    console.log("  allowed next commands:");
    for (const command of policy.allowedNextCommands) console.log(`    - ${command}`);
    console.log("  forbidden actions:");
    for (const action of policy.forbiddenActions.slice(0, 5)) console.log(`    - ${action}`);
    if (policy.forbiddenActions.length > 5) console.log(`    - ... ${policy.forbiddenActions.length - 5} more`);
    console.log("");
  }
}

function usage() {
  console.log("Delta maintenance policy engine");
  console.log("===============================");
  console.log("Usage:");
  console.log("- npm run agent:policy -- --report");
  console.log("- npm run agent:policy -- --id 002");
  console.log("- npm run agent:policy -- --top-actionable");
  console.log("- npm --silent run agent:policy -- --json");
  console.log("");
  console.log("Read-only: no files are written, no tests are run, no worktrees are created.");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const policy = readPolicy();
  const findings = readFindings();
  const classified = classifyFindings(findings, policy);

  let output = classified;
  let selectionRationale = null;
  if (args.id) {
    output = classified.filter(({ finding }) => finding.id === args.id);
    if (output.length === 0) {
      const payload = { error: `No finding with id ${args.id} exists.` };
      if (args.json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
      else console.error(payload.error);
      process.exit(1);
    }
  } else if (args.topActionable) {
    const { selected, rationale } = selectTopActionable(classified);
    selectionRationale = rationale;
    output = selected ? [selected] : [];
  } else if (!args.report && !args.json) {
    usage();
    return;
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify({
      policyPath: path.relative(repoRoot, policyPath),
      selectionRationale,
      summaryByMode: groupByMode(output),
      findings: output.map(({ finding, policy: findingPolicy }) => ({
        finding,
        policy: findingPolicy,
      })),
    }, null, 2)}\n`);
    return;
  }

  reportItems(output, selectionRationale);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
