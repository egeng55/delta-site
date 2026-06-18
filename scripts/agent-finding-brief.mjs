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

const briefsDir = path.join(repoRoot, "agent", "phase-briefs");

function parseArgs(argv) {
  const values = {
    id: null,
    top: false,
    phase: null,
    name: null,
    routine: null,
    repo: null,
    write: false,
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
    } else if (arg === "--routine") {
      values.routine = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--repo") {
      values.repo = argv[index + 1] || null;
      index += 1;
    } else if (arg === "--write") {
      values.write = true;
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

function usagePayload(message = null) {
  return {
    title: "Delta Maintenance Finding Brief Generator",
    message,
    required: ["--phase <number>", "--id <finding-id> or --top"],
    optional: [
      "--name <slug>",
      "--routine <routine>",
      "--repo <site|backend|mobile|multi>",
      "--write",
      "--force",
      "--json",
    ],
    examples: [
      "npm run agent:finding:brief -- --top --phase 74",
      "npm run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy",
      "npm run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy --write",
      "npm --silent run agent:finding:brief -- --id 002 --phase 74 --name mobile-cache-strategy --json",
    ],
    safety: [
      "Print-only by default.",
      "Writes only with --write under agent/phase-briefs/.",
      "Does not implement findings.",
      "Does not run tests, create worktrees, call services, or commit.",
      "Refuses blocked findings.",
    ],
  };
}

function list(items) {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : ["none listed"];
  return safeItems.map((item) => `- ${item}`).join("\n");
}

function verificationPlan(finding, repo, routine, policy) {
  if (policy.actionMode === "human_required") {
    const commands = ["Review the manual/provider checklist without printing secrets."];
    if (repo === "backend" || finding.security_related === true) {
      commands.push("cd /Users/egeng/delta-backend");
      commands.push(".venv/bin/python scripts/secret_scan.py");
    }
    return commands;
  }

  if (repo === "mobile") {
    return [
      "cd /Users/egeng/delta-mobile",
      "npm test -- --runInBand",
      "Do not run lint unless the mobile repo defines a lint script.",
    ];
  }

  if (repo === "backend") {
    const commands = ["cd /Users/egeng/delta-backend"];
    if (finding.security_related === true || /credential|secret|security/i.test(finding.title || "")) {
      commands.push(".venv/bin/python scripts/secret_scan.py");
    }
    commands.push(".venv/bin/python -m pytest tests/test_conversation_runtime.py tests/test_late_caffeine_demo.py tests/test_behavioral_os.py tests/test_bedroom_copilot.py");
    return commands;
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

function approvalText(policy) {
  if (policy.actionMode === "human_required") {
    return "Human/provider action is required. This brief is a manual checklist and confirmation plan only.";
  }
  if (policy.actionMode === "implementation_requires_approval") {
    return "Human approval is required before any implementation, code, runtime, storage, or cross-repo changes.";
  }
  if (policy.actionMode === "docs_eval_autofix_allowed") {
    return "Docs/eval-only changes may be prepared only within the explicitly scoped phase and should wait for human merge review.";
  }
  if (policy.actionMode === "worktree_allowed") {
    return "A worktree may be recommended or created only after an explicit reviewed command; implementation still needs separate approval.";
  }
  return "This brief is planning-only unless a later phase explicitly authorizes implementation.";
}

function buildBrief(args, finding, policy, rationale) {
  const phase = args.phase;
  const name = slugify(args.name || finding.slug || finding.title);
  const repo = args.repo || finding.repo || "site";
  const routine = args.routine || finding.routine || "docs-only";
  const evidenceFiles = Array.isArray(finding.evidence) ? finding.evidence : [];
  const likelyFiles = Array.isArray(finding.likely_files) ? finding.likely_files : [];
  const outOfScope = Array.isArray(finding.out_of_scope) ? finding.out_of_scope : [];
  const verification = verificationPlan(finding, repo, routine, policy);
  const objective = finding.recommended_next_phase || finding.objective || "Define the smallest safe remediation for this finding.";

  return {
    phase,
    name,
    repo,
    routine,
    finding,
    policy,
    rationale,
    targetPath: path.join(briefsDir, `phase-${paddedPhase(phase)}-${name}.md`),
    markdown: `# Delta Phase ${phase}: ${name}

Generated by: \`scripts/agent-finding-brief.mjs\`

This is a planning artifact derived from a maintenance finding. It does not
implement the remediation, run verification, create worktrees, call services, or
commit changes.

## Phase Identity

- Phase: ${phase}
- Name: ${name}
- Source finding id: ${finding.id}
- Source finding title: ${finding.title}
- Source priority: ${finding.priority}
- Source status: ${finding.status}
- Repo: ${repo}
- Recommended routine: ${routine}
- Selection rationale: ${rationale}

## Maintenance Policy

- Action mode: ${policy.actionMode}
- Policy reason: ${policy.reason}
- Approval requirement: ${approvalText(policy)}

Allowed next commands:
${list(policy.allowedNextCommands)}

Forbidden actions:
${list(policy.forbiddenActions)}

## Objective

${objective}

## Evidence

${list(evidenceFiles)}

Do not paste, print, or infer secret values from evidence files.

## Scope

Repos in scope:
- ${repo}

Likely files:
${list(likelyFiles)}

Explicitly out of scope:
${list(outOfScope)}

## Safety Boundaries

- No Supabase mutation unless explicitly scoped by the final remediation phase.
- No mic, TTS, or notifications.
- No memory writes.
- No auth, billing, legal, schema, or deployment changes unless this finding explicitly requires them.
- No \`npm audit fix\`.
- No secret logging.
- No destructive cleanup.
- No backend/mobile/site runtime behavior changes outside the selected repo and phase scope.
- Follow the policy action mode before creating worktrees or making implementation changes.

## Implementation Checklist

- [ ] Inspect the evidence files listed above.
- [ ] Confirm the current state before editing.
- [ ] Re-check policy with \`npm run agent:policy -- --id ${finding.id}\`.
- [ ] Make the smallest safe change only if this phase and policy allow it.
- [ ] Update tests and docs for the changed behavior.
- [ ] Update the maintenance finding status only after implementation and verification.
- [ ] Keep provider/manual-action findings open or \`pending-human\` until a human confirms completion.

## Verification Plan

\`\`\`bash
${verification.join("\n")}
\`\`\`

## Finding Update Rule

- Do not mark the finding resolved until implementation is complete and verified.
- If this phase only creates a plan, the finding remains open.
- If human/provider action is required, the finding remains \`pending-human\`.
- Include the policy action mode and approval requirement in the handoff.

## Handoff Expectations

Final report should include:

- files changed
- finding id: ${finding.id}
- policy action mode: ${policy.actionMode}
- approval requirement
- finding status change, if any
- verification results
- safety confirmations
- next recommended finding or phase
- commit hash if committed
- final repo status
- exact safest next command
`,
  };
}

function printUsage(payload) {
  console.log(payload.title);
  console.log("=========================================");
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

const args = parseArgs(process.argv.slice(2));
const findings = readFindings();
const policyConfig = readPolicy();

if (!validPhase(args.phase)) {
  const usage = usagePayload("Missing or invalid --phase <number>.");
  if (args.json) process.stdout.write(`${JSON.stringify({ error: usage }, null, 2)}\n`);
  else printUsage(usage);
  process.exit(1);
}

const { finding, policy, rationale } = selectFinding(findings, policyConfig, args);
if (!finding) {
  const usage = usagePayload(rationale);
  if (args.json) process.stdout.write(`${JSON.stringify({ error: usage }, null, 2)}\n`);
  else printUsage(usage);
  process.exit(1);
}

if (policy.actionMode === "blocked" || policy.actionMode === "report_only") {
  const message = policy.actionMode === "blocked"
    ? `Policy blocked finding ${finding.id}; refusing to generate an implementation brief.`
    : `Policy classifies finding ${finding.id} as report_only; refusing to generate a phase brief.`;
  const payload = { error: message, finding, policy, rationale };
  if (args.json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else console.error(message);
  process.exit(1);
}

const brief = buildBrief(args, finding, policy, rationale);
const payload = {
  generatedBy: "scripts/agent-finding-brief.mjs",
  printOnlyDefault: true,
  wroteFile: false,
  targetPath: path.relative(repoRoot, brief.targetPath),
  selection: {
    findingId: finding.id,
    title: finding.title,
    priority: finding.priority,
    status: finding.status,
    rationale,
  },
  policy,
  phaseIdentity: {
    phase: brief.phase,
    name: brief.name,
    repo: brief.repo,
    routine: brief.routine,
  },
  evidence: finding.evidence || [],
  likelyFiles: finding.likely_files || [],
  markdown: brief.markdown,
};

if (args.write) {
  if (existsSync(brief.targetPath) && !args.force) {
    const message = `Refusing to overwrite existing brief: ${path.relative(repoRoot, brief.targetPath)}. Use --force intentionally.`;
    if (args.json) process.stdout.write(`${JSON.stringify({ ...payload, error: message }, null, 2)}\n`);
    else console.error(message);
    process.exit(1);
  }
  mkdirSync(briefsDir, { recursive: true });
  writeFileSync(brief.targetPath, brief.markdown, "utf8");
  payload.wroteFile = true;
}

if (args.json) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} else {
  console.log(brief.markdown);
  if (args.write) {
    console.log(`\nPhase brief written: ${path.relative(repoRoot, brief.targetPath)}`);
  } else {
    console.log("\nPrint-only: no files written. Add --write to create the phase brief file.");
  }
}
