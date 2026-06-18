#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const findingsDir = path.join(repoRoot, "agent", "findings");
const briefsDir = path.join(repoRoot, "agent", "phase-briefs");

const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
const statusOrder = { open: 0, "pending-human": 1, deferred: 2, resolved: 3 };

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
        body: text.replace(/^---\n[\s\S]*?\n---\n?/, "").trim(),
        ...parseFrontmatter(text),
      };
    });
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const priorityDelta = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
    if (priorityDelta !== 0) return priorityDelta;
    const statusDelta = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    if (statusDelta !== 0) return statusDelta;
    return Number(a.id) - Number(b.id);
  });
}

function selectFinding(findings, args) {
  if (args.id) {
    const finding = findings.find((candidate) => candidate.id === args.id);
    if (!finding) {
      return { finding: null, rationale: `No finding with id ${args.id} exists.` };
    }
    return { finding, rationale: `Selected exact finding id ${args.id}.` };
  }

  if (args.top) {
    const candidates = sortFindings(findings).filter((finding) => {
      if (finding.status === "resolved" || finding.status === "deferred") return false;
      if (finding.status === "pending-human" && finding.agent_executable !== true) return false;
      return finding.agent_executable === true;
    });
    const finding = candidates[0] || null;
    if (!finding) {
      return { finding: null, rationale: "No open agent-actionable finding is available." };
    }
    return {
      finding,
      rationale: `Selected highest-priority agent-actionable finding: ${finding.priority} ${finding.status} id ${finding.id}.`,
    };
  }

  return { finding: null, rationale: "Provide --id <finding-id> or --top." };
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
    ],
  };
}

function list(items) {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : ["none listed"];
  return safeItems.map((item) => `- ${item}`).join("\n");
}

function verificationPlan(finding, repo, routine) {
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

  if (routine === "docs-only") {
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

function buildBrief(args, finding, rationale) {
  const phase = args.phase;
  const name = slugify(args.name || finding.slug || finding.title);
  const repo = args.repo || finding.repo || "site";
  const routine = args.routine || finding.routine || "docs-only";
  const evidenceFiles = Array.isArray(finding.evidence) ? finding.evidence : [];
  const likelyFiles = Array.isArray(finding.likely_files) ? finding.likely_files : [];
  const outOfScope = Array.isArray(finding.out_of_scope) ? finding.out_of_scope : [];
  const verification = verificationPlan(finding, repo, routine);
  const objective = finding.recommended_next_phase || finding.objective || "Define the smallest safe remediation for this finding.";

  return {
    phase,
    name,
    repo,
    routine,
    finding,
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

## Implementation Checklist

- [ ] Inspect the evidence files listed above.
- [ ] Confirm the current state before editing.
- [ ] Make the smallest safe change.
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

## Handoff Expectations

Final report should include:

- files changed
- finding id: ${finding.id}
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

const args = parseArgs(process.argv.slice(2));
const findings = readFindings();

if (!validPhase(args.phase)) {
  const usage = usagePayload("Missing or invalid --phase <number>.");
  if (args.json) process.stdout.write(`${JSON.stringify({ error: usage }, null, 2)}\n`);
  else printUsage(usage);
  process.exit(1);
}

const { finding, rationale } = selectFinding(findings, args);
if (!finding) {
  const usage = usagePayload(rationale);
  if (args.json) process.stdout.write(`${JSON.stringify({ error: usage }, null, 2)}\n`);
  else printUsage(usage);
  process.exit(1);
}

const brief = buildBrief(args, finding, rationale);
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
