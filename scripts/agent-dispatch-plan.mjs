#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  classifyFinding,
  classifyFindings,
  readFindings,
  readPolicy,
  repoRoot,
  selectTopActionable,
} from "./agent-policy.mjs";

const dispatchDir = path.join(repoRoot, "agent", "dispatch-plans");

function parseArgs(argv) {
  const values = {
    id: null,
    top: false,
    phase: null,
    name: null,
    json: false,
    write: false,
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--id") {
      values.id = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--top") {
      values.top = true;
    } else if (arg === "--phase") {
      values.phase = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--name") {
      values.name = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--json") {
      values.json = true;
    } else if (arg === "--write") {
      values.write = true;
    } else if (arg === "--force") {
      values.force = true;
    }
  }

  return values;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validPhase(value) {
  return typeof value === "string" && /^[0-9]+$/.test(value);
}

function paddedPhase(phase) {
  return String(phase).padStart(3, "0");
}

function defaultWorktreeRootForRepo() {
  const repoParent = path.dirname(repoRoot);
  const parentName = path.basename(repoParent);
  const homeCandidate = parentName === "delta" || parentName === "delta-worktrees" ? path.dirname(repoParent) : repoParent;
  return path.join(homeCandidate, "delta-worktrees");
}

function siblingRepoPath(repo) {
  const repoParent = path.dirname(repoRoot);
  const parentName = path.basename(repoParent);
  const homeCandidate = parentName === "delta" || parentName === "delta-worktrees" ? path.dirname(repoParent) : repoParent;
  const flat = {
    site: repoRoot,
    backend: path.join(homeCandidate, "delta-backend"),
    mobile: path.join(homeCandidate, "delta-mobile"),
  };
  const grouped = {
    site: path.join(homeCandidate, "delta", "delta-site"),
    backend: path.join(homeCandidate, "delta", "delta-backend"),
    mobile: path.join(homeCandidate, "delta", "delta-mobile"),
  };
  if (repo === "site") return repoRoot;
  return existsSync(flat[repo]) ? flat[repo] : grouped[repo] || repoRoot;
}

function repoPrefix(repo) {
  if (repo === "backend") return "backend";
  if (repo === "mobile") return "mobile";
  if (repo === "multi") return "multi";
  return "site";
}

function list(items) {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : ["none listed"];
  return safeItems.map((item) => `- ${item}`).join("\n");
}

function usagePayload(message = null) {
  return {
    title: "Delta Maintenance Dispatch Planner",
    message,
    required: ["--phase <number>", "--id <finding-id> or --top"],
    optional: ["--name <slug>", "--json", "--write", "--force"],
    examples: [
      "npm run agent:dispatch:plan -- --top --phase 78",
      "npm run agent:dispatch:plan -- --id 002 --phase 78 --name mobile-cache-strategy",
      "npm --silent run agent:dispatch:plan -- --id 002 --phase 78 --name mobile-cache-strategy --json",
      "npm run agent:dispatch:plan -- --id 002 --phase 78 --name mobile-cache-strategy --write",
    ],
    safety: [
      "Planning-only by default.",
      "Writes only with --write under agent/dispatch-plans/.",
      "Does not implement findings.",
      "Does not create worktrees.",
      "Does not run tests, call services, or commit.",
    ],
  };
}

function printUsage(payload) {
  console.log(payload.title);
  console.log("==================================");
  if (payload.message) {
    console.log(payload.message);
    console.log("");
  }
  console.log("Required:");
  for (const item of payload.required) console.log(`- ${item}`);
  console.log("");
  console.log("Optional:");
  for (const item of payload.optional) console.log(`- ${item}`);
  console.log("");
  console.log("Examples:");
  for (const item of payload.examples) console.log(item);
  console.log("");
  console.log("Safety:");
  for (const item of payload.safety) console.log(`- ${item}`);
}

function approvalRequirement(policy) {
  if (policy.actionMode === "human_required") return "Human/provider action is required.";
  if (policy.actionMode === "implementation_requires_approval") {
    return "Human approval is required before implementation, runtime, storage, or cross-repo changes.";
  }
  if (policy.actionMode === "docs_eval_autofix_allowed") {
    return "Docs/eval-only work still requires explicit phase approval and human merge review.";
  }
  if (policy.actionMode === "blocked") return "Action is blocked by policy.";
  if (policy.actionMode === "worktree_allowed") {
    return "Worktree preview may be recommended; actual creation requires an explicit reviewed command.";
  }
  return "Follow policy mode before planning, worktree creation, or editing.";
}

function dispatchDecision(finding, policy) {
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

function allowedAction(policy) {
  const actions = {
    human_required: "Generate a manual/checklist brief only; do not implement.",
    implementation_requires_approval: "Generate a plan and phase brief command; wait for human approval before implementation.",
    docs_eval_autofix_allowed: "Recommend a docs/eval worktree preview; do not create it in this phase.",
    brief_allowed: "Recommend a finding brief only.",
    worktree_allowed: "Recommend a worktree preview command only.",
    report_only: "Report status only.",
    blocked: "Stop at reporting; do not dispatch work.",
  };
  return actions[policy.actionMode] || actions.report_only;
}

function verificationPlan(repo, routine, policy) {
  if (policy.actionMode === "human_required") {
    return ["Review the manual/provider checklist without printing secrets."];
  }

  if (repo === "mobile") {
    return [
      "cd /Users/egeng/delta-mobile",
      "npm test -- --runInBand",
      "Do not run lint unless the mobile repo defines a lint script.",
    ];
  }

  if (repo === "backend") {
    return [
      "cd /Users/egeng/delta-backend",
      ".venv/bin/python scripts/secret_scan.py if security-related",
      ".venv/bin/python -m pytest tests/test_conversation_runtime.py tests/test_late_caffeine_demo.py tests/test_behavioral_os.py tests/test_bedroom_copilot.py",
    ];
  }

  if (repo === "multi") {
    return [
      "Verify each touched repo separately.",
      "For delta-site: npm run agent:safety-scan && npm run agent:eval && npm run agent:verify -- --desktop",
      "For delta-backend: run focused backend tests relevant to touched files.",
      "For delta-mobile: npm test -- --runInBand.",
    ];
  }

  if (routine === "docs-only" || policy.actionMode === "docs_eval_autofix_allowed") {
    return [
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --docs-only",
      "npm test -- --runInBand",
      "npm run lint",
      "npm run build",
    ];
  }

  return [
    "npm run agent:safety-scan",
    "npm run agent:eval",
    "npm run agent:verify -- --desktop",
    "npm test -- --runInBand",
    "npm run lint",
    "npm run build",
  ];
}

function selectFinding(findings, policyConfig, args) {
  if (args.id) {
    const finding = findings.find((candidate) => candidate.id === args.id);
    if (!finding) {
      return { finding: null, policy: null, rationale: `No finding with id ${args.id} exists.` };
    }
    return {
      finding,
      policy: classifyFinding(finding, policyConfig),
      rationale: `Selected exact finding id ${args.id}.`,
    };
  }

  if (args.top) {
    const classified = classifyFindings(findings, policyConfig);
    const { selected, rationale } = selectTopActionable(classified);
    if (!selected) return { finding: null, policy: null, rationale };
    return { finding: selected.finding, policy: selected.policy, rationale };
  }

  return { finding: null, policy: null, rationale: "Provide --id <finding-id> or --top." };
}

function buildPlan(args, finding, policy, rationale) {
  const phase = args.phase;
  const phaseName = slugify(args.name || finding.slug || finding.title);
  const repo = finding.repo || "site";
  const routine = finding.routine || "docs-only";
  const prefix = repoPrefix(repo);
  const branchName = `phase-${phase}-${phaseName}`;
  const worktreeRoot = defaultWorktreeRootForRepo();
  const worktreePath = path.join(worktreeRoot, `${prefix}-phase-${phase}-${phaseName}`);
  const sourceRepo = siblingRepoPath(repo === "multi" ? "site" : repo);
  const findingBriefCommand = `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${phaseName}`;
  const siteWorktreePreviewCommand = `npm run agent:phase:start -- --phase ${phase} --name ${phaseName} --print`;
  const repoWorktreeCommand = `cd ${sourceRepo} && git worktree add ${worktreePath} -b ${branchName}`;
  const likelyFiles = Array.isArray(finding.likely_files) ? finding.likely_files : [];
  const outOfScope = Array.isArray(finding.out_of_scope) ? finding.out_of_scope : [];
  const verification = verificationPlan(repo, routine, policy);
  const decision = dispatchDecision(finding, policy);
  const canRecommendWorktree = ["worktree_allowed", "docs_eval_autofix_allowed", "implementation_requires_approval"].includes(policy.actionMode)
    && finding.status !== "resolved"
    && finding.status !== "deferred";
  const worktreePreviewCommand = repo === "site"
    ? siteWorktreePreviewCommand
    : `Review proposed worktree only; no delta-site helper creates ${repo} worktrees. Approval-only command would be: ${repoWorktreeCommand}`;
  const exactNextSafeCommand = ["human_required", "implementation_requires_approval", "brief_allowed", "docs_eval_autofix_allowed", "worktree_allowed"].includes(policy.actionMode)
    && finding.status !== "resolved"
    && finding.status !== "deferred"
    ? findingBriefCommand
    : `npm run agent:policy -- --id ${finding.id}`;

  return {
    generatedBy: "scripts/agent-dispatch-plan.mjs",
    planningOnlyDefault: true,
    wroteFile: false,
    selection: {
      rationale,
      findingId: finding.id,
      findingTitle: finding.title,
      priority: finding.priority,
      status: finding.status,
      repo,
    },
    policy: {
      mode: policy.actionMode,
      reason: policy.reason,
      approvalRequirement: approvalRequirement(policy),
    },
    dispatch: {
      decision,
      allowedAction: allowedAction(policy),
      proposedPhaseNumber: phase,
      proposedPhaseName: phaseName,
      proposedRoutine: routine,
      proposedWorktreePath: canRecommendWorktree ? worktreePath : null,
      proposedBranchName: canRecommendWorktree ? branchName : null,
      recommendedFindingBriefCommand: findingBriefCommand,
      recommendedWorktreePreviewCommand: canRecommendWorktree ? worktreePreviewCommand : "No worktree preview recommended by policy.",
      proposedWorktreeCommandIfApproved: canRecommendWorktree ? repoWorktreeCommand : null,
      exactNextSafeCommand,
    },
    scope: {
      likelyFiles,
      outOfScope,
      evidence: Array.isArray(finding.evidence) ? finding.evidence : [],
    },
    safety: {
      forbiddenActions: policy.forbiddenActions,
      noImplementationPerformed: true,
      noWorktreeCreated: true,
      noTestsRunByPlanner: true,
      noServicesCalled: true,
    },
    verification: {
      commands: verification,
    },
    targetPath: path.join(dispatchDir, `phase-${paddedPhase(phase)}-${phaseName}-dispatch.md`),
  };
}

function renderMarkdown(plan) {
  return `# Maintenance Dispatch Plan: ${plan.selection.findingId} ${plan.selection.findingTitle}

Generated by: \`${plan.generatedBy}\`

This is a planning artifact. It does not implement findings, create worktrees,
run tests, call services, mutate files outside this dispatch plan, or authorize
runtime changes.

## Finding

- Finding id: ${plan.selection.findingId}
- Title: ${plan.selection.findingTitle}
- Priority: ${plan.selection.priority}
- Status: ${plan.selection.status}
- Repo: ${plan.selection.repo}
- Selection rationale: ${plan.selection.rationale}

## Policy

- Policy mode: ${plan.policy.mode}
- Policy reason: ${plan.policy.reason}
- Approval requirement: ${plan.policy.approvalRequirement}

## Dispatch Decision

- Decision: ${plan.dispatch.decision}
- Allowed action: ${plan.dispatch.allowedAction}
- Proposed phase: ${plan.dispatch.proposedPhaseNumber}
- Proposed phase name: ${plan.dispatch.proposedPhaseName}
- Proposed routine: ${plan.dispatch.proposedRoutine}
- Proposed worktree path: ${plan.dispatch.proposedWorktreePath || "none"}
- Proposed branch name: ${plan.dispatch.proposedBranchName || "none"}

## Scope

Likely files in scope:
${list(plan.scope.likelyFiles)}

Explicitly out of scope:
${list(plan.scope.outOfScope)}

Evidence:
${list(plan.scope.evidence)}

## Recommended Commands

Finding brief:

\`\`\`bash
${plan.dispatch.recommendedFindingBriefCommand}
\`\`\`

Worktree preview:

\`\`\`text
${plan.dispatch.recommendedWorktreePreviewCommand}
\`\`\`

Exact next safe command:

\`\`\`bash
${plan.dispatch.exactNextSafeCommand}
\`\`\`

## Verification Required By Implementation Phase

\`\`\`bash
${plan.verification.commands.join("\n")}
\`\`\`

## Forbidden Actions

${list(plan.safety.forbiddenActions)}

## Planner Refusals

- No implementation was performed.
- No worktree was created.
- No tests were run by the dispatch planner.
- No external services were called.
- No Supabase/mic/TTS/notification/product-memory/write actions ran.
- No \`npm audit fix\` ran.
`;
}

function printPlan(plan) {
  console.log("Delta maintenance dispatch plan");
  console.log("===============================");
  console.log("Mode: planning-only by default. No files are written unless --write is passed.");
  console.log("");
  console.log(`Finding: ${plan.selection.findingId} ${plan.selection.findingTitle}`);
  console.log(`Priority/status: ${plan.selection.priority} ${plan.selection.status}`);
  console.log(`Repo: ${plan.selection.repo}`);
  console.log(`Policy mode: ${plan.policy.mode}`);
  console.log(`Dispatch decision: ${plan.dispatch.decision}`);
  console.log(`Approval requirement: ${plan.policy.approvalRequirement}`);
  console.log("");
  console.log("Allowed action:");
  console.log(plan.dispatch.allowedAction);
  console.log("");
  console.log("Proposed phase:");
  console.log(`- phase: ${plan.dispatch.proposedPhaseNumber}`);
  console.log(`- name: ${plan.dispatch.proposedPhaseName}`);
  console.log(`- routine: ${plan.dispatch.proposedRoutine}`);
  console.log(`- worktree path: ${plan.dispatch.proposedWorktreePath || "none"}`);
  console.log(`- branch: ${plan.dispatch.proposedBranchName || "none"}`);
  console.log("");
  console.log("Likely files:");
  console.log(list(plan.scope.likelyFiles));
  console.log("");
  console.log("Recommended finding-brief command:");
  console.log(plan.dispatch.recommendedFindingBriefCommand);
  console.log("");
  console.log("Recommended worktree preview command:");
  console.log(plan.dispatch.recommendedWorktreePreviewCommand);
  console.log("");
  console.log("Exact next safe command:");
  console.log(plan.dispatch.exactNextSafeCommand);
  console.log("");
  console.log("No implementation performed. No worktree created.");
}

const args = parseArgs(process.argv.slice(2));

if (!validPhase(args.phase)) {
  const usage = usagePayload("Missing or invalid --phase <number>.");
  if (args.json) process.stdout.write(`${JSON.stringify({ error: usage }, null, 2)}\n`);
  else printUsage(usage);
  process.exit(1);
}

const findings = readFindings();
const policyConfig = readPolicy();
const { finding, policy, rationale } = selectFinding(findings, policyConfig, args);

if (!finding) {
  const usage = usagePayload(rationale);
  if (args.json) process.stdout.write(`${JSON.stringify({ error: usage }, null, 2)}\n`);
  else printUsage(usage);
  process.exit(1);
}

const plan = buildPlan(args, finding, policy, rationale);
plan.targetPathRelative = path.relative(repoRoot, plan.targetPath);
plan.markdown = renderMarkdown(plan);

if (args.write) {
  if (existsSync(plan.targetPath) && !args.force) {
    const message = `Refusing to overwrite existing dispatch plan: ${plan.targetPathRelative}. Use --force intentionally.`;
    if (args.json) process.stdout.write(`${JSON.stringify({ ...plan, error: message }, null, 2)}\n`);
    else console.error(message);
    process.exit(1);
  }
  mkdirSync(dispatchDir, { recursive: true });
  writeFileSync(plan.targetPath, plan.markdown, "utf8");
  plan.wroteFile = true;
}

if (args.json) {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
} else {
  printPlan(plan);
  if (args.write) {
    console.log("");
    console.log(`Dispatch plan written: ${plan.targetPathRelative}`);
  } else {
    console.log("");
    console.log("Print-only: no files written. Add --write to create the dispatch plan file.");
  }
}
