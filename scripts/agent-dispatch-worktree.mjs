#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  classifyFinding,
  classifyFindings,
  readFindings,
  readPolicy,
  repoRoot,
  selectTopActionable,
} from "./agent-policy.mjs";

const taskDir = path.join(repoRoot, "agent", "dispatch-tasks");
const allowedRepos = new Set(["site", "backend", "mobile", "multi"]);
const worktreeCapableRepos = new Set(["site", "backend", "mobile"]);
const worktreeAllowedModes = new Set([
  "worktree_allowed",
  "docs_eval_autofix_allowed",
  "implementation_requires_approval",
]);
const taskAllowedModes = new Set([
  "brief_allowed",
  "worktree_allowed",
  "docs_eval_autofix_allowed",
  "implementation_requires_approval",
]);

function parseArgs(argv) {
  const values = {
    id: null,
    top: false,
    phase: null,
    name: null,
    repo: null,
    print: false,
    approveWorktree: false,
    writeTask: false,
    force: false,
    json: false,
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
    } else if (arg === "--repo") {
      values.repo = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--print") {
      values.print = true;
    } else if (arg === "--approve-worktree") {
      values.approveWorktree = true;
    } else if (arg === "--write-task") {
      values.writeTask = true;
    } else if (arg === "--force") {
      values.force = true;
    } else if (arg === "--json") {
      values.json = true;
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
  const homeCandidate = parentName === "delta" || parentName === "delta-worktrees"
    ? path.dirname(repoParent)
    : repoParent;
  return path.join(homeCandidate, "delta-worktrees");
}

function siblingRepoPath(repo) {
  if (repo === "site") return repoRoot;

  const repoParent = path.dirname(repoRoot);
  const parentName = path.basename(repoParent);
  const homeCandidate = parentName === "delta" || parentName === "delta-worktrees"
    ? path.dirname(repoParent)
    : repoParent;
  const flat = path.join(homeCandidate, `delta-${repo}`);
  const grouped = path.join(homeCandidate, "delta", `delta-${repo}`);
  if (existsSync(flat)) return flat;
  if (existsSync(grouped)) return grouped;
  return flat;
}

function runGit(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: false,
    stdio: "pipe",
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    output: (result.stdout || result.stderr || "").trim(),
    error: result.error?.message || null,
  };
}

function list(items) {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : ["none listed"];
  return safeItems.map((item) => `- ${item}`).join("\n");
}

function usagePayload(message = null) {
  return {
    title: "Delta Maintenance Worktree Dispatcher",
    message,
    required: ["--phase <number>", "--id <finding-id> or --top"],
    optional: [
      "--name <slug>",
      "--repo <site|backend|mobile|multi>",
      "--print",
      "--approve-worktree",
      "--write-task",
      "--force",
      "--json",
    ],
    examples: [
      "npm run agent:dispatch:worktree -- --top --phase 80",
      "npm run agent:dispatch:worktree -- --id 005 --phase 80 --name live-eval-coverage",
      "npm run agent:dispatch:worktree -- --id 005 --phase 80 --name live-eval-coverage --approve-worktree --write-task",
      "npm --silent run agent:dispatch:worktree -- --id 005 --phase 80 --json",
    ],
    safety: [
      "Print-only by default.",
      "Creates a worktree only with --approve-worktree and policy permission.",
      "Writes a task packet only with --write-task and policy permission.",
      "Does not implement findings, run tests, merge, delete, or clean up.",
    ],
  };
}

function approvalRequirement(policy) {
  if (policy.actionMode === "human_required") return "Human/provider action is required. Worktree dispatch is refused.";
  if (policy.actionMode === "implementation_requires_approval") {
    return "Human approval is required before worktree dispatch or implementation. --approve-worktree records approval for worktree creation only.";
  }
  if (policy.actionMode === "docs_eval_autofix_allowed") {
    return "Docs/eval worktree dispatch is allowed only after explicit --approve-worktree; merge still requires review.";
  }
  if (policy.actionMode === "brief_allowed") return "Task packet or brief generation is allowed; worktree creation is refused.";
  if (policy.actionMode === "worktree_allowed") return "Worktree dispatch is allowed only after explicit --approve-worktree.";
  if (policy.actionMode === "blocked") return "Action is blocked by policy.";
  return "Report-only; worktree dispatch is refused.";
}

function dispatchDecision(policy, finding) {
  if (finding.status === "resolved" || finding.status === "deferred") return "report-only";
  const decisions = {
    human_required: "manual-only",
    blocked: "blocked",
    report_only: "report-only",
    brief_allowed: "brief-or-task-only",
    worktree_allowed: "worktree-approval-required",
    docs_eval_autofix_allowed: "docs/eval-worktree-approval-required",
    implementation_requires_approval: "approval-required",
  };
  return decisions[policy.actionMode] || "report-only";
}

function allowedAction(policy) {
  const actions = {
    human_required: "Manual checklist only. Do not create a worktree.",
    blocked: "Stop at reporting. Do not dispatch.",
    report_only: "Report status only. Do not create a worktree or task packet.",
    brief_allowed: "A scoped task packet or phase brief may be generated. No worktree.",
    worktree_allowed: "A worktree may be created only with --approve-worktree. No implementation.",
    docs_eval_autofix_allowed: "A docs/eval worktree and task packet may be prepared with explicit flags. No implementation.",
    implementation_requires_approval: "A worktree and task packet may be prepared only with explicit approval flags. No implementation.",
  };
  return actions[policy.actionMode] || actions.report_only;
}

function verificationPlan(repo, policy) {
  if (repo === "mobile") {
    return [
      "npm test -- --runInBand",
      "Do not run lint unless package.json defines a lint script.",
      "Do not run npm audit fix.",
    ];
  }
  if (repo === "backend") {
    return [
      ".venv/bin/python scripts/secret_scan.py if security-related",
      ".venv/bin/python -m pytest tests/test_conversation_runtime.py",
      ".venv/bin/python -m pytest tests/test_late_caffeine_demo.py tests/test_behavioral_os.py tests/test_bedroom_copilot.py",
    ];
  }
  if (repo === "multi") {
    return [
      "Verify each touched repo separately.",
      "delta-site: npm run agent:safety-scan && npm run agent:eval && npm run agent:verify -- --desktop",
      "delta-backend: run focused tests for touched backend files.",
      "delta-mobile: npm test -- --runInBand.",
    ];
  }
  if (policy.actionMode === "docs_eval_autofix_allowed" || policy.actionMode === "brief_allowed") {
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
    if (!finding) return { finding: null, policy: null, rationale: `No finding with id ${args.id} exists.` };
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

function evaluateDispatch(plan, args) {
  const checks = [];
  const mode = plan.policy.mode;
  const findingStatusAllowsAction = !["resolved", "deferred"].includes(plan.finding.status);
  const policyAllowsWorktree = findingStatusAllowsAction
    && worktreeAllowedModes.has(mode)
    && worktreeCapableRepos.has(plan.repo);
  const policyAllowsTask = findingStatusAllowsAction && taskAllowedModes.has(mode);

  let canCreateWorktree = false;
  let canWriteTask = false;

  if (args.approveWorktree) {
    if (!policyAllowsWorktree) {
      checks.push({ ok: false, scope: "worktree", reason: `Policy mode ${mode} does not allow worktree creation for repo ${plan.repo}.` });
    } else if (!existsSync(plan.sourceRepo)) {
      checks.push({ ok: false, scope: "worktree", reason: `Source repo does not exist: ${plan.sourceRepo}` });
    } else if (runGit(plan.sourceRepo, ["status", "--short"]).output.length > 0) {
      checks.push({ ok: false, scope: "worktree", reason: `Source repo is not clean: ${plan.sourceRepo}` });
    } else if (existsSync(plan.worktree.path)) {
      checks.push({ ok: false, scope: "worktree", reason: `Target worktree path already exists: ${plan.worktree.path}` });
    } else if (runGit(plan.sourceRepo, ["rev-parse", "--verify", `refs/heads/${plan.worktree.branch}`]).ok) {
      checks.push({ ok: false, scope: "worktree", reason: `Branch already exists: ${plan.worktree.branch}` });
    } else {
      canCreateWorktree = true;
      checks.push({ ok: true, scope: "worktree", reason: "Policy, approval flag, source cleanliness, branch, and target path checks passed." });
    }
  }

  if (args.writeTask) {
    if (!policyAllowsTask) {
      checks.push({ ok: false, scope: "task", reason: `Policy mode ${mode} does not allow task packet writing.` });
    } else if (existsSync(plan.task.path) && !args.force) {
      checks.push({ ok: false, scope: "task", reason: `Task packet already exists: ${plan.task.relativePath}. Use --force intentionally.` });
    } else {
      canWriteTask = true;
      checks.push({ ok: true, scope: "task", reason: "Policy and --write-task checks passed." });
    }
  }

  return {
    policyAllowsWorktree,
    policyAllowsTask,
    canCreateWorktree,
    canWriteTask,
    checks,
  };
}

function buildPlan(args, finding, policy, rationale) {
  const phase = args.phase;
  const padded = paddedPhase(phase);
  const phaseName = slugify(args.name || finding.slug || finding.title);
  const repo = args.repo || finding.repo || "site";
  const sourceRepo = repo === "multi" ? repoRoot : siblingRepoPath(repo);
  const worktreeRoot = defaultWorktreeRootForRepo();
  const branch = `phase-${padded}-${phaseName}`;
  const worktreePath = worktreeCapableRepos.has(repo)
    ? path.join(worktreeRoot, `${repo}-phase-${padded}-${phaseName}`)
    : null;
  const likelyFiles = Array.isArray(finding.likely_files) ? finding.likely_files : [];
  const outOfScope = Array.isArray(finding.out_of_scope) ? finding.out_of_scope : [];
  const evidence = Array.isArray(finding.evidence) ? finding.evidence : [];
  const verification = verificationPlan(repo, policy);
  const taskPath = path.join(taskDir, `phase-${padded}-${phaseName}-task.md`);
  const firstWorktreeCommand = worktreePath
    ? repo === "site"
      ? `cd ${worktreePath} && npm run agent:context -- --compact`
      : `cd ${worktreePath} && git status --short`
    : "No single worktree command for multi-repo dispatch.";
  const findingBriefCommand = `npm run agent:finding:brief -- --id ${finding.id} --phase ${phase} --name ${phaseName}`;
  const previewCommand = repo === "site"
    ? `npm run agent:phase:start -- --phase ${phase} --name ${phaseName} --print`
    : worktreePath
      ? `cd ${sourceRepo} && git worktree add ${worktreePath} -b ${branch}`
      : "Split multi-repo work into separate approved repo-specific worktrees.";
  const mobileCacheNote = finding.id === "002" || finding.slug === "mobile-cache-strategy"
    ? [
        "Phase 78 already implemented chat transcript TTL/minimization and generated insights cache envelopes in delta-mobile.",
        "If this finding remains open, the next scoped task should address only the remaining deferred cache surfaces, such as offline cache classification or pending sync strategy, after explicit approval.",
      ]
    : [];

  const plan = {
    generatedBy: "scripts/agent-dispatch-worktree.mjs",
    printOnlyDefault: true,
    noImplementationPerformed: true,
    noMergePerformed: true,
    selection: {
      rationale,
    },
    finding: {
      id: finding.id,
      title: finding.title,
      priority: finding.priority,
      status: finding.status,
      slug: finding.slug,
      recommendedNextPhase: finding.recommended_next_phase,
    },
    repo,
    sourceRepo,
    policy: {
      mode: policy.actionMode,
      reason: policy.reason,
      approvalRequirement: approvalRequirement(policy),
      allowedAction: allowedAction(policy),
    },
    dispatch: {
      decision: dispatchDecision(policy, finding),
      approvedWorktreeFlag: args.approveWorktree,
      writeTaskFlag: args.writeTask,
      phase,
      paddedPhase: padded,
      name: phaseName,
      routine: finding.routine || "docs-only",
      recommendedFindingBriefCommand: findingBriefCommand,
      recommendedWorktreePreviewCommand: previewCommand,
      exactNextSafeCommand: args.approveWorktree || args.writeTask
        ? firstWorktreeCommand
        : `npm run agent:dispatch:worktree -- --id ${finding.id} --phase ${phase} --name ${phaseName}`,
    },
    worktree: {
      root: worktreeRoot,
      path: worktreePath,
      branch,
      command: worktreePath ? `git worktree add ${worktreePath} -b ${branch}` : null,
      created: false,
      creationOutput: null,
    },
    task: {
      path: taskPath,
      relativePath: path.relative(repoRoot, taskPath),
      written: false,
    },
    scope: {
      objective: finding.recommended_next_phase || `Address finding ${finding.id}: ${finding.title}.`,
      likelyFiles,
      outOfScope,
      evidence,
      mobileCacheNote,
    },
    safety: {
      forbiddenActions: policy.forbiddenActions,
      noTestsRunByDispatcher: true,
      noExternalServicesCalled: true,
      noNpmAuditFix: true,
      noCleanup: true,
    },
    verification: {
      commands: verification,
    },
    handoff: {
      requirements: [
        "finding id and title",
        "policy mode and approval status",
        "worktree path and branch",
        "task packet path",
        "files changed by the future implementation",
        "verification results",
        "safety confirmations",
        "no implementation or merge performed by this dispatcher",
        "integration status",
      ],
    },
  };

  plan.evaluation = evaluateDispatch(plan, args);
  plan.markdown = renderTaskMarkdown(plan);
  return plan;
}

function renderTaskMarkdown(plan) {
  return `# Maintenance Dispatch Task: ${plan.finding.id} ${plan.finding.title}

Generated by: \`${plan.generatedBy}\`

This task packet prepares an isolated Codex worktree for a future scoped
implementation. It does not implement the finding, run tests, merge branches,
delete worktrees, call services, or change product behavior.

## Finding

- Finding id: ${plan.finding.id}
- Title: ${plan.finding.title}
- Priority: ${plan.finding.priority}
- Status: ${plan.finding.status}
- Policy mode: ${plan.policy.mode}
- Policy reason: ${plan.policy.reason}
- Approval requirement: ${plan.policy.approvalRequirement}
- Worktree approval flag supplied: ${plan.dispatch.approvedWorktreeFlag ? "yes" : "no"}
- Task write flag supplied: ${plan.dispatch.writeTaskFlag ? "yes" : "no"}

## Source And Worktree

- Source repo: ${plan.sourceRepo}
- Target repo: ${plan.repo}
- Worktree path: ${plan.worktree.path || "none"}
- Branch: ${plan.worktree.branch}
- Worktree created by dispatcher: ${plan.worktree.created ? "yes" : "no"}

## Objective

${plan.scope.objective}

${plan.scope.mobileCacheNote.length > 0 ? `## Phase 78 Context

${list(plan.scope.mobileCacheNote)}

` : ""}## Scope

Likely files:
${list(plan.scope.likelyFiles)}

Evidence files:
${list(plan.scope.evidence)}

Explicitly out of scope:
${list(plan.scope.outOfScope)}

## Forbidden Actions

${list(plan.safety.forbiddenActions)}

## Implementation Instructions For The Future Codex Run

- Start by running the exact first command below.
- Inspect the evidence files before editing.
- Make the smallest scoped change that addresses the finding.
- Do not implement anything outside the likely file area without a new approval.
- Update tests or docs as needed.
- Do not mark the finding resolved until implementation is complete and verified.

Exact first command:

\`\`\`bash
${plan.dispatch.exactNextSafeCommand}
\`\`\`

## Verification Commands

\`\`\`bash
${plan.verification.commands.join("\n")}
\`\`\`

## Handoff Requirements

${list(plan.handoff.requirements)}

## Merge Policy

- Do not auto-merge.
- Do not squash or rebase unless explicitly requested later.
- Human review is required before integration.
- Do not delete the worktree or branch automatically.
`;
}

function printUsage(payload) {
  console.log(payload.title);
  console.log("=====================================");
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

function printPlan(plan) {
  console.log("Delta maintenance worktree dispatcher");
  console.log("=====================================");
  console.log("Mode: print-only by default. Worktree creation requires --approve-worktree. Task writing requires --write-task.");
  console.log("");
  console.log(`Finding: ${plan.finding.id} ${plan.finding.title}`);
  console.log(`Priority/status: ${plan.finding.priority} ${plan.finding.status}`);
  console.log(`Repo: ${plan.repo}`);
  console.log(`Policy mode: ${plan.policy.mode}`);
  console.log(`Dispatch decision: ${plan.dispatch.decision}`);
  console.log(`Approval requirement: ${plan.policy.approvalRequirement}`);
  console.log("");
  console.log("Proposed dispatch:");
  console.log(`- phase: ${plan.dispatch.phase}`);
  console.log(`- name: ${plan.dispatch.name}`);
  console.log(`- source repo: ${plan.sourceRepo}`);
  console.log(`- worktree path: ${plan.worktree.path || "none"}`);
  console.log(`- branch: ${plan.worktree.branch}`);
  console.log(`- task packet: ${plan.task.relativePath}`);
  console.log("");
  console.log("Policy checks:");
  if (plan.evaluation.checks.length === 0) {
    console.log("- No create/write flags supplied; print-only dispatch.");
  } else {
    for (const check of plan.evaluation.checks) {
      console.log(`- ${check.ok ? "ok" : "blocked"} ${check.scope}: ${check.reason}`);
    }
  }
  console.log("");
  console.log("Recommended finding brief command:");
  console.log(plan.dispatch.recommendedFindingBriefCommand);
  console.log("");
  console.log("Recommended worktree preview command:");
  console.log(plan.dispatch.recommendedWorktreePreviewCommand);
  console.log("");
  console.log("Exact next safe command:");
  console.log(plan.dispatch.exactNextSafeCommand);
  console.log("");
  console.log("No implementation performed. No tests run. No merge performed.");
  if (plan.worktree.created) console.log(`Worktree created: ${plan.worktree.path}`);
  if (plan.task.written) console.log(`Task packet written: ${plan.task.relativePath}`);
}

function maybeCreateWorktree(plan) {
  if (!plan.evaluation.canCreateWorktree) return plan;
  mkdirSync(plan.worktree.root, { recursive: true });
  const result = runGit(plan.sourceRepo, ["worktree", "add", plan.worktree.path, "-b", plan.worktree.branch]);
  plan.worktree.creationOutput = result.output || result.error || "";
  if (!result.ok) {
    plan.evaluation.checks.push({
      ok: false,
      scope: "worktree",
      reason: `git worktree add failed with exit code ${result.status}: ${plan.worktree.creationOutput}`,
    });
    plan.evaluation.canWriteTask = false;
    return plan;
  }
  plan.worktree.created = true;
  return plan;
}

function maybeWriteTask(plan, force) {
  if (!plan.evaluation.canWriteTask) return plan;
  mkdirSync(taskDir, { recursive: true });
  if (existsSync(plan.task.path) && !force) return plan;
  plan.markdown = renderTaskMarkdown(plan);
  writeFileSync(plan.task.path, plan.markdown, "utf8");
  plan.task.written = true;
  return plan;
}

const args = parseArgs(process.argv.slice(2));

if (!validPhase(args.phase)) {
  const usage = usagePayload("Missing or invalid --phase <number>.");
  if (args.json) process.stdout.write(`${JSON.stringify({ error: usage }, null, 2)}\n`);
  else printUsage(usage);
  process.exit(1);
}

if (args.repo && !allowedRepos.has(args.repo)) {
  const usage = usagePayload(`Invalid --repo ${args.repo}.`);
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

let plan = buildPlan(args, finding, policy, rationale);

const blockedChecks = plan.evaluation.checks.filter((check) => !check.ok);
if ((args.approveWorktree || args.writeTask) && blockedChecks.length > 0) {
  if (args.json) process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  else printPlan(plan);
  process.exit(1);
}

plan = maybeCreateWorktree(plan);
plan = maybeWriteTask(plan, args.force);

const failedAfterAction = plan.evaluation.checks.filter((check) => !check.ok);
if (args.json) {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
} else {
  printPlan(plan);
}

if (failedAfterAction.length > 0) process.exit(1);
