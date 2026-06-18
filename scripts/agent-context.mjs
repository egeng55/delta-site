#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const outputJson = args.includes("--json");
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const packageScripts = packageJson.scripts || {};

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "logs",
  "node_modules",
  "out",
  "screenshots",
]);

const textExtensions = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mdc",
  ".mjs",
  ".ts",
  ".tsx",
]);

const requiredDocs = [
  "AGENTS.md",
  ".cursor/rules/delta-site-agent-rules.mdc",
  "docs/AGENTIC_DEVELOPMENT.md",
  "docs/AGENT_WORKSPACE_LAYOUT.md",
  "docs/AGENT_SAFETY_BOUNDARIES.md",
  "docs/AGENT_PHASE_BRIEF_TEMPLATE.md",
  "docs/AGENT_HANDOFF_TEMPLATE.md",
  "docs/AGENT_VERIFICATION_MATRIX.md",
  "docs/AGENT_SLASH_COMMANDS.md",
  "docs/AGENT_ROLES.md",
  "docs/AGENT_EVALS.md",
  "docs/AGENT_ROUTINES.md",
  "docs/AGENT_ORCHESTRATION.md",
  "docs/AGENT_MCP_STRATEGY.md",
  "docs/AGENT_PARALLEL_WORKFLOWS.md",
];

const agentScriptNames = [
  "agent:preflight",
  "agent:status",
  "agent:context",
  "agent:safety-scan",
  "agent:eval",
  "agent:verify",
  "agent:routine",
  "agent:orchestrate",
  "agent:phase:start",
  "agent:phase:handoff",
];

const highRiskPaths = [
  {
    path: "src/components/OSConsole.tsx",
    reason: "/os cockpit, browser TTS preview, read-only conversation UI, readiness UI",
  },
  {
    path: "src/lib/browserSpeech.ts",
    reason: "browser speechSynthesis helper; must stay user-triggered and frontend-only",
  },
  {
    path: "src/lib/conversationApi.ts",
    reason: "read-only conversation API client; must not add write or side-effect calls",
  },
  {
    path: "src/lib/osConsoleFixtures.ts",
    reason: "proof/readiness fixtures and terminal commands; must keep fallback labels honest",
  },
  {
    path: "desktop/main.cjs",
    reason: "Electron main process, service manager, process spawning, security settings",
  },
  {
    path: "desktop/preload.cjs",
    reason: "renderer bridge; must not expose arbitrary shell, filesystem, or secrets",
  },
  {
    path: "desktop/fallback.html",
    reason: "service-manager fallback UI; must remain local and allowlisted",
  },
  {
    path: "src/context/AuthContext.tsx",
    reason: "auth-sensitive frontend boundary",
  },
  {
    path: "src/app/(marketing)/privacy/page.tsx",
    reason: "privacy/legal copy boundary",
  },
  {
    path: "src/app/(marketing)/terms/page.tsx",
    reason: "terms/legal copy boundary",
  },
  {
    path: "supabase/migrations",
    reason: "schema/migration boundary; should not be touched from delta-site phases",
  },
];

function runGit(argsForGit, cwd = repoRoot) {
  const result = spawnSync("git", argsForGit, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  if (result.error) return { ok: false, output: result.error.message };
  return {
    ok: result.status === 0,
    output: (result.stdout || result.stderr || "").trim(),
  };
}

function unique(values) {
  return [...new Set(values)];
}

function workspacePaths() {
  const repoParent = path.dirname(repoRoot);
  const homeCandidate = path.basename(repoParent) === "delta" ? path.dirname(repoParent) : repoParent;

  return {
    repoParent,
    homeCandidate,
    preferredProductRoot: path.join(homeCandidate, "delta"),
    canonicalWorktreeRoot: path.join(homeCandidate, "delta-worktrees"),
    layout: path.basename(repoParent) === "delta" ? "grouped-delta" : "flat",
  };
}

function workspaceCandidates() {
  const paths = workspacePaths();
  return unique([
    paths.repoParent,
    paths.preferredProductRoot,
    paths.homeCandidate,
  ]);
}

function findRepo(name) {
  for (const candidate of workspaceCandidates()) {
    const repoPath = path.join(candidate, name);
    if (existsSync(repoPath)) return repoPath;
  }
  return null;
}

function isInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function morningStandupStatus(paths) {
  const candidates = {
    canonicalSeparate: path.join(paths.homeCandidate, "morning-standup"),
    legacyHomeCaps: path.join(paths.homeCandidate, "Morning-Standup"),
    legacyDeltaCaps: path.join(paths.preferredProductRoot, "Morning-Standup"),
    legacyDeltaLower: path.join(paths.preferredProductRoot, "morning-standup"),
  };

  const found = Object.values(candidates).filter((candidate) => existsSync(candidate));
  const selectedPath = found[0] || null;
  const insideDelta = selectedPath ? isInside(selectedPath, paths.preferredProductRoot) : false;

  let status = "not_found";
  if (selectedPath && insideDelta) status = "legacy_inside_delta_excluded";
  if (selectedPath && !insideDelta) status = "separate_and_excluded";

  return {
    status,
    path: selectedPath,
    includedInDeltaContext: false,
    oldDeltaPathExists: existsSync(candidates.legacyDeltaCaps),
    canonicalSeparatePathExists: existsSync(candidates.canonicalSeparate),
  };
}

function fileExists(relativePath) {
  return existsSync(path.join(repoRoot, relativePath));
}

function collectFiles(relativeDirectory, options = {}) {
  const maxDepth = options.maxDepth ?? 3;
  const maxFiles = options.maxFiles ?? 80;
  const root = path.join(repoRoot, relativeDirectory);
  const files = [];

  function walk(directory, depth) {
    if (!existsSync(directory) || files.length >= maxFiles) return;
    if (depth > maxDepth) return;

    for (const entry of readdirSync(directory).sort()) {
      if (files.length >= maxFiles) break;
      if (ignoredDirectories.has(entry)) continue;

      const absolutePath = path.join(directory, entry);
      const relativePath = path.relative(repoRoot, absolutePath);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath, depth + 1);
        continue;
      }

      if (!stats.isFile()) continue;
      if (!textExtensions.has(path.extname(entry))) continue;
      files.push(relativePath);
    }
  }

  walk(root, 0);
  return files;
}

function appRoutes() {
  return collectFiles("src/app", { maxDepth: 6, maxFiles: 120 })
    .filter((filePath) => /\/(page|route|layout)\.(tsx|ts)$/.test(filePath))
    .map((filePath) => {
      const routePath = filePath
        .replace(/^src\/app/, "")
        .replace(/\/page\.tsx$/, "")
        .replace(/\/route\.ts$/, "")
        .replace(/\/layout\.tsx$/, "/layout")
        .replace(/\/\(([^)]+)\)/g, "")
        || "/";
      return { file: filePath, route: routePath };
    });
}

function evalSummary() {
  const evalRoot = path.join(repoRoot, "evals");
  const files = collectFiles("evals", { maxDepth: 4, maxFiles: 80 }).filter((filePath) => filePath.endsWith(".json"));
  const categoryCounts = {};
  const fileCounts = {};
  const issues = [];
  let totalItems = 0;

  if (!existsSync(evalRoot)) {
    return { root: "evals", totalItems, files: fileCounts, categories: categoryCounts, issues: ["evals directory missing"] };
  }

  for (const relativePath of files) {
    const absolutePath = path.join(repoRoot, relativePath);
    try {
      const parsed = JSON.parse(readFileSync(absolutePath, "utf8"));
      const items = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.items) ? parsed.items : null;
      if (!items) {
        issues.push(`${relativePath}: expected array or object with items array`);
        continue;
      }

      fileCounts[relativePath] = items.length;
      totalItems += items.length;
      for (const item of items) {
        if (item && typeof item.category === "string") {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
      }
    } catch (error) {
      issues.push(`${relativePath}: ${error.message}`);
    }
  }

  return { root: "evals", totalItems, files: fileCounts, categories: categoryCounts, issues };
}

function statusSummary() {
  const status = runGit(["status", "--short"]);
  return {
    clean: status.ok ? status.output.length === 0 : null,
    summary: status.ok ? status.output || "clean" : status.output,
  };
}

function buildContext() {
  const paths = workspacePaths();
  const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
  const head = runGit(["rev-parse", "--short", "HEAD"]);
  const status = statusSummary();
  const siblingRepos = {
    "delta-site": repoRoot,
    "delta-backend": findRepo("delta-backend"),
    "delta-mobile": findRepo("delta-mobile"),
  };

  return {
    generatedAt: new Date().toISOString(),
    mode: "read-only stdout context bundle",
    repoIdentity: {
      name: path.basename(repoRoot),
      root: repoRoot,
      branch: branch.ok ? branch.output : "unknown",
      head: head.ok ? head.output : "unknown",
      workingTreeClean: status.clean,
      gitStatus: status.summary,
      packageName: packageJson.name,
      packageVersion: packageJson.version,
    },
    productWorkspace: {
      layout: paths.layout,
      preferredProductRoot: paths.preferredProductRoot,
      canonicalWorktreeRoot: paths.canonicalWorktreeRoot,
      deltaProductRepos: ["delta-site", "delta-backend", "delta-mobile"],
      siblingRepos,
      morningStandup: morningStandupStatus(paths),
    },
    agentFoundation: {
      requiredDocs: Object.fromEntries(requiredDocs.map((docPath) => [docPath, fileExists(docPath)])),
      packageScripts: Object.fromEntries(agentScriptNames.map((script) => [script, packageScripts[script] || null])),
    },
    projectMap: {
      directories: {
        "src/app": fileExists("src/app"),
        "src/components": fileExists("src/components"),
        "src/lib": fileExists("src/lib"),
        desktop: fileExists("desktop"),
        docs: fileExists("docs"),
        evals: fileExists("evals"),
        scripts: fileExists("scripts"),
      },
      appRoutes: appRoutes(),
      components: collectFiles("src/components", { maxDepth: 1, maxFiles: 80 }),
      libraryFiles: collectFiles("src/lib", { maxDepth: 2, maxFiles: 80 }),
      desktopFiles: collectFiles("desktop", { maxDepth: 1, maxFiles: 40 }),
      agentDocs: requiredDocs.filter((docPath) => fileExists(docPath)),
      agentScripts: collectFiles("scripts", { maxDepth: 1, maxFiles: 80 }).filter((filePath) => filePath.startsWith("scripts/agent-")),
    },
    highRiskPaths: highRiskPaths.map((item) => ({
      ...item,
      exists: fileExists(item.path),
    })),
    verificationSummary: {
      docsOnly: [
        "npm run agent:preflight",
        "npm run agent:safety-scan",
      ],
      site: [
        "npm run agent:preflight",
        "npm run agent:safety-scan",
        "npm test -- --runInBand",
        "npm run lint",
        "npm run build",
      ],
      desktop: [
        "npm run agent:preflight",
        "npm run agent:safety-scan",
        "npm test -- --runInBand",
        "npm run lint",
        "npm run build",
        "npm run desktop:check",
        "npm run desktop:smoke",
        "npm run desktop:smoke:services",
      ],
    },
    evalSummary: evalSummary(),
    suggestedNextCommands: [
      "npm run agent:preflight",
      "npm run agent:status",
      "npm run agent:context",
      "npm run agent:safety-scan",
      "npm run agent:eval",
      "npm run agent:verify -- --desktop",
    ],
    safetyNotes: [
      "This script is read-only and writes no bundle file.",
      "Morning-Standup is excluded from Delta product context.",
      "Generated directories such as node_modules, .next, coverage, dist, build, screenshots, logs, and caches are not scanned.",
      "Future repo-map MCPs should wrap this script instead of replacing script-first checks.",
    ],
  };
}

function printBoolean(value) {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

function printSection(title) {
  console.log("");
  console.log(`## ${title}`);
}

function printList(items, indent = "") {
  for (const item of items) console.log(`${indent}- ${item}`);
}

function printMarkdown(context) {
  console.log("# Delta Site Agent Context Bundle");
  console.log("");
  console.log(`Generated: ${context.generatedAt}`);
  console.log("Mode: read-only stdout context bundle. No files are written and no services are called.");

  printSection("Repo Identity");
  console.log(`- repo: ${context.repoIdentity.name}`);
  console.log(`- root: ${context.repoIdentity.root}`);
  console.log(`- branch: ${context.repoIdentity.branch}`);
  console.log(`- HEAD: ${context.repoIdentity.head}`);
  console.log(`- working tree clean: ${printBoolean(context.repoIdentity.workingTreeClean)}`);
  console.log(`- package: ${context.repoIdentity.packageName}@${context.repoIdentity.packageVersion}`);
  console.log(`- git status: ${context.repoIdentity.gitStatus}`);

  printSection("Product Workspace Identity");
  console.log(`- layout: ${context.productWorkspace.layout}`);
  console.log(`- preferred product root: ${context.productWorkspace.preferredProductRoot}`);
  console.log(`- canonical worktree root: ${context.productWorkspace.canonicalWorktreeRoot}`);
  console.log("- Delta product repos:");
  for (const [name, repoPath] of Object.entries(context.productWorkspace.siblingRepos)) {
    console.log(`  - ${name}: ${repoPath || "not found"}`);
  }

  printSection("Morning-Standup Exclusion");
  const morningStandup = context.productWorkspace.morningStandup;
  console.log(`- status: ${morningStandup.status}`);
  console.log(`- path: ${morningStandup.path || "not found"}`);
  console.log(`- included in Delta context: ${printBoolean(morningStandup.includedInDeltaContext)}`);
  console.log(`- old Delta path exists: ${printBoolean(morningStandup.oldDeltaPathExists)}`);
  console.log(`- separate path exists: ${printBoolean(morningStandup.canonicalSeparatePathExists)}`);

  printSection("Agent Foundation Status");
  console.log("- required docs:");
  for (const [docPath, present] of Object.entries(context.agentFoundation.requiredDocs)) {
    console.log(`  - ${docPath}: ${printBoolean(present)}`);
  }
  console.log("- agent package scripts:");
  for (const [script, command] of Object.entries(context.agentFoundation.packageScripts)) {
    console.log(`  - ${script}: ${command || "missing"}`);
  }

  printSection("Project Map");
  console.log("- core directories:");
  for (const [directory, present] of Object.entries(context.projectMap.directories)) {
    console.log(`  - ${directory}: ${printBoolean(present)}`);
  }
  console.log("- app routes:");
  for (const route of context.projectMap.appRoutes) {
    console.log(`  - ${route.route}: ${route.file}`);
  }
  console.log("- components:");
  printList(context.projectMap.components, "  ");
  console.log("- library files:");
  printList(context.projectMap.libraryFiles, "  ");
  console.log("- desktop files:");
  printList(context.projectMap.desktopFiles, "  ");
  console.log("- agent scripts:");
  printList(context.projectMap.agentScripts, "  ");

  printSection("High-Risk Paths");
  for (const item of context.highRiskPaths) {
    console.log(`- ${item.path}: ${item.exists ? "present" : "absent"} — ${item.reason}`);
  }

  printSection("Verification Summary");
  console.log("- docs-only:");
  printList(context.verificationSummary.docsOnly, "  ");
  console.log("- site:");
  printList(context.verificationSummary.site, "  ");
  console.log("- desktop:");
  printList(context.verificationSummary.desktop, "  ");

  printSection("Eval Summary");
  console.log(`- total eval items: ${context.evalSummary.totalItems}`);
  console.log("- fixture files:");
  for (const [filePath, count] of Object.entries(context.evalSummary.files)) {
    console.log(`  - ${filePath}: ${count}`);
  }
  console.log("- categories:");
  for (const [category, count] of Object.entries(context.evalSummary.categories)) {
    console.log(`  - ${category}: ${count}`);
  }
  if (context.evalSummary.issues.length > 0) {
    console.log("- issues:");
    printList(context.evalSummary.issues, "  ");
  }

  printSection("Suggested Next Commands");
  printList(context.suggestedNextCommands);

  printSection("Safety Notes");
  printList(context.safetyNotes);
}

const context = buildContext();

if (outputJson) {
  console.log(JSON.stringify(context, null, 2));
} else {
  printMarkdown(context);
}
