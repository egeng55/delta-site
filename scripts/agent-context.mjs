#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const outputJson = args.includes("--json");
const compactOutput = args.includes("--compact");
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
  "docs/AGENT_PHASE_BRIEFS.md",
  "docs/AGENT_HANDOFF_TEMPLATE.md",
  "docs/AGENT_VERIFICATION_MATRIX.md",
  "docs/AGENT_SLASH_COMMANDS.md",
  "docs/AGENT_ROLES.md",
  "docs/AGENT_EVALS.md",
  "docs/AGENT_ROUTINES.md",
  "docs/AGENT_ORCHESTRATION.md",
  "docs/AGENT_MAINTENANCE.md",
  "docs/AGENT_FINDING_BRIEFS.md",
  "docs/AGENT_MCP_STRATEGY.md",
  "docs/AGENT_PARALLEL_WORKFLOWS.md",
];

const importantDocs = [
  "AGENTS.md",
  "README.md",
  "docs/DESKTOP_APP.md",
  ...requiredDocs.filter((docPath) => docPath !== "AGENTS.md"),
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
  "agent:maintenance",
  "agent:finding:brief",
  "agent:phase:brief",
  "agent:phase:start",
  "agent:phase:handoff",
];

const highRiskPaths = [
  {
    path: "src/components/OSConsole.tsx",
    reason: "/os cockpit, browser TTS preview, read-only conversation UI, readiness UI",
  },
  {
    path: "src/app/(marketing)/os/page.tsx",
    reason: "/os route boundary; preserve read-only cockpit behavior",
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
    path: "src/lib/systemReadinessApi.ts",
    reason: "read-only readiness API client; must remain side-effect-free",
  },
  {
    path: "src/lib/osConsoleFixtures.ts",
    reason: "proof/readiness fixtures and terminal commands; must keep fallback labels honest",
  },
  {
    path: "src/lib/supabase.ts",
    reason: "Supabase client boundary; avoid write-capable behavior from site phases",
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
    path: "src/app/(marketing)/cookies/page.tsx",
    reason: "cookies/legal copy boundary",
  },
  {
    path: "supabase/migrations",
    reason: "schema/migration boundary; should not be touched from delta-site phases",
  },
];

const riskGroups = {
  critical: [
    { path: "src/context/AuthContext.tsx", reason: "auth behavior" },
    { path: "src/app/(marketing)/privacy/page.tsx", reason: "privacy/legal copy" },
    { path: "src/app/(marketing)/terms/page.tsx", reason: "terms/legal copy" },
    { path: "src/app/(marketing)/cookies/page.tsx", reason: "cookies/legal copy" },
    { path: "supabase/migrations", reason: "schema and migrations" },
    { path: ".env", reason: "local secrets; must remain untracked" },
    { path: ".env.local", reason: "local secrets; must remain untracked" },
  ],
  high: [
    { path: "desktop/main.cjs", reason: "Electron main process and service spawning" },
    { path: "desktop/preload.cjs", reason: "renderer bridge and IPC boundary" },
    { path: "desktop/fallback.html", reason: "service manager UI and local commands" },
    { path: "src/app/(marketing)/os/page.tsx", reason: "/os route boundary" },
    { path: "src/components/OSConsole.tsx", reason: "/os cockpit and browser TTS preview" },
    { path: "src/lib/browserSpeech.ts", reason: "browser speech synthesis helper" },
    { path: "src/lib/conversationApi.ts", reason: "backend conversation API client" },
    { path: "src/lib/systemReadinessApi.ts", reason: "backend readiness API client" },
    { path: "src/lib/osConsoleFixtures.ts", reason: "/os fallback fixture and terminal command copy" },
    { path: "src/lib/supabase.ts", reason: "Supabase client boundary" },
  ],
  medium: [
    { path: "package.json", reason: "package and verification scripts" },
    { path: "package-lock.json", reason: "dependency lockfile" },
    { path: "desktop/smoke-check.cjs", reason: "desktop smoke and safety checks" },
    { path: "scripts/agent-verify.mjs", reason: "verification wrapper" },
    { path: "scripts/agent-context.mjs", reason: "repo map source of truth" },
  ],
  normal: [
    { path: "AGENTS.md", reason: "agent policy docs" },
    { path: "docs/", reason: "documentation" },
    { path: "evals/", reason: "deterministic eval fixtures" },
    { path: "scripts/agent-*.mjs", reason: "read-only/advisory agent scripts unless scoped otherwise" },
    { path: "src/**/*.test.*", reason: "tests" },
  ],
};

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

function runGitRaw(argsForGit, cwd = repoRoot) {
  const result = spawnSync("git", argsForGit, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  if (result.error) return { ok: false, output: result.error.message };
  return {
    ok: result.status === 0,
    output: (result.stdout || result.stderr || "").replace(/\r?\n$/, ""),
  };
}

function unique(values) {
  return [...new Set(values)];
}

function workspacePaths() {
  const repoParent = path.dirname(repoRoot);
  const parentName = path.basename(repoParent);
  const homeCandidate = parentName === "delta" || parentName === "delta-worktrees" ? path.dirname(repoParent) : repoParent;

  return {
    repoParent,
    homeCandidate,
    preferredProductRoot: path.join(homeCandidate, "delta"),
    canonicalWorktreeRoot: path.join(homeCandidate, "delta-worktrees"),
    layout: parentName === "delta" ? "grouped-delta" : parentName === "delta-worktrees" ? "worktree" : "flat",
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
    note: "Morning-Standup is an unrelated project and is never scanned by agent:context.",
  };
}

function fileExists(relativePath) {
  return existsSync(path.join(repoRoot, relativePath));
}

function collectFiles(relativeDirectory, options = {}) {
  const maxDepth = options.maxDepth ?? 3;
  const maxFiles = options.maxFiles ?? 120;
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

function inferRoute(filePath) {
  const routePart = filePath
    .replace(/^src\/app/, "")
    .replace(/\/(page|route|layout)\.(tsx|ts)$/, "")
    .replace(/\/\(([^)]+)\)/g, "");
  return routePart || "/";
}

function routeKind(filePath) {
  if (filePath.endsWith("/page.tsx")) return "page";
  if (filePath.endsWith("/layout.tsx")) return "layout";
  if (filePath.endsWith("/route.ts")) return "api-route";
  return "unknown";
}

function appRouteMap() {
  return collectFiles("src/app", { maxDepth: 6, maxFiles: 160 })
    .filter((filePath) => /\/(page|route|layout)\.(tsx|ts)$/.test(filePath) || filePath === "src/app/layout.tsx")
    .map((filePath) => ({
      file: filePath,
      route: inferRoute(filePath),
      kind: routeKind(filePath),
      risk: riskForPath(filePath),
    }));
}

function classifyComponent(filePath) {
  if (/\.test\.(tsx|ts|js)$/.test(filePath)) return "test";
  if (/\.tsx$/.test(filePath)) return "UI component";
  return "unknown";
}

function componentMap() {
  return collectFiles("src/components", { maxDepth: 1, maxFiles: 120 }).map((filePath) => ({
    file: filePath,
    classification: classifyComponent(filePath),
    highlight: ["src/components/OSConsole.tsx", "src/components/OSConsole.test.tsx"].includes(filePath),
    risk: riskForPath(filePath),
  }));
}

function desktopKind(filePath) {
  if (filePath === "desktop/main.cjs") return "Electron main/service manager";
  if (filePath === "desktop/preload.cjs") return "Electron preload bridge";
  if (filePath === "desktop/fallback.html") return "service-manager fallback UI";
  if (filePath === "desktop/smoke-check.cjs") return "desktop smoke/check script";
  return "desktop support file";
}

function desktopMap() {
  return collectFiles("desktop", { maxDepth: 1, maxFiles: 40 }).map((filePath) => ({
    file: filePath,
    kind: desktopKind(filePath),
    risk: riskForPath(filePath),
  }));
}

function testMap() {
  return [
    ...collectFiles("src", { maxDepth: 6, maxFiles: 200 }),
    ...collectFiles("desktop", { maxDepth: 2, maxFiles: 40 }),
  ]
    .filter((filePath) => /\.test\.(tsx|ts|js)$/.test(filePath) || filePath.includes("smoke"))
    .map((filePath) => ({
      file: filePath,
      type: filePath.includes("smoke") ? "smoke/check" : "test",
      likelyCommand: filePath.startsWith("desktop/") ? "npm run desktop:check" : "npm test -- --runInBand",
    }));
}

function docsMap() {
  const docs = unique([
    ...importantDocs,
    ...collectFiles("docs", { maxDepth: 1, maxFiles: 120 }),
    ...collectFiles("agent/phase-briefs", { maxDepth: 1, maxFiles: 60 }),
  ]);
  return docs.filter((filePath) => fileExists(filePath)).map((filePath) => ({
    file: filePath,
    kind: filePath.startsWith("agent/phase-briefs/") ? "phase brief" : filePath.includes("AGENT") ? "agent doc" : "project doc",
    risk: riskForPath(filePath),
  }));
}

function evalSummary() {
  const evalRoot = path.join(repoRoot, "evals");
  const files = collectFiles("evals", { maxDepth: 4, maxFiles: 80 }).filter((filePath) => filePath.endsWith(".json"));
  const categoryCounts = {};
  const fileSummaries = [];
  const issues = [];
  let totalItems = 0;

  if (!existsSync(evalRoot)) {
    return { root: "evals", totalItems, files: fileSummaries, categories: categoryCounts, issues: ["evals directory missing"] };
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

      const categories = {};
      totalItems += items.length;
      for (const item of items) {
        if (item && typeof item.category === "string") {
          categories[item.category] = (categories[item.category] || 0) + 1;
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
      }
      fileSummaries.push({ file: relativePath, count: items.length, categories });
    } catch (error) {
      issues.push(`${relativePath}: ${error.message}`);
    }
  }

  return { root: "evals", totalItems, files: fileSummaries, categories: categoryCounts, issues };
}

function scriptInventory() {
  return {
    packageAgentScripts: Object.entries(packageScripts)
      .filter(([name]) => name.startsWith("agent:"))
      .map(([name, command]) => ({ name, command })),
    localAgentScripts: collectFiles("scripts", { maxDepth: 1, maxFiles: 120 })
      .filter((filePath) => /^scripts\/agent-.*\.mjs$/.test(filePath))
      .map((filePath) => ({ file: filePath, risk: riskForPath(filePath) })),
  };
}

function recentCommits() {
  const result = runGit(["log", "-5", "--pretty=format:%h%x09%s"]);
  if (!result.ok || result.output.length === 0) return [];
  return result.output.split(/\r?\n/).map((line) => {
    const [hash, ...subjectParts] = line.split("\t");
    return { hash, subject: subjectParts.join("\t") };
  });
}

function statusSummary() {
  const status = runGitRaw(["status", "--short"]);
  return {
    clean: status.ok ? status.output.length === 0 : null,
    summary: status.ok ? status.output || "clean" : status.output,
    changedFiles: status.ok && status.output
      ? status.output.split(/\r?\n/).map((line) => ({ status: line.slice(0, 2).trim(), file: line.slice(3).trim() })).filter((item) => item.file)
      : [],
  };
}

function globPatternToRegex(pattern) {
  return pattern
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "__SINGLE_STAR__")
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/__DOUBLE_STAR__/g, ".*")
    .replace(/__SINGLE_STAR__/g, "[^/]*");
}

function riskForPath(filePath) {
  for (const [level, entries] of Object.entries(riskGroups)) {
    for (const entry of entries) {
      if (entry.path.endsWith("/")) {
        if (filePath.startsWith(entry.path)) return level;
      } else if (entry.path.includes("*")) {
        const regex = new RegExp(`^${globPatternToRegex(entry.path)}$`);
        if (regex.test(filePath)) return level;
      } else if (filePath === entry.path) {
        return level;
      }
    }
  }
  if (/\.test\.(tsx|ts|js)$/.test(filePath)) return "normal";
  if (filePath.startsWith("docs/") || filePath.startsWith("evals/") || filePath.startsWith("agent/phase-briefs/")) return "normal";
  if (filePath.startsWith("scripts/agent-")) return "normal";
  return "normal";
}

function riskClassification() {
  return Object.fromEntries(Object.entries(riskGroups).map(([level, entries]) => [
    level,
    entries.map((entry) => ({ ...entry, exists: entry.path.includes("*") ? null : fileExists(entry.path) })),
  ]));
}

function inferRecommendation(changedFiles) {
  if (changedFiles.length === 0) {
    return {
      routine: "inspect",
      verificationScope: "desktop",
      reason: "working tree is clean; start by choosing a routine and highest-risk verification scope",
      commands: [
        "npm run agent:routine -- --list",
        "npm run agent:verify -- --desktop",
      ],
    };
  }

  const files = changedFiles.map((item) => item.file);
  const docsOnly = files.every((file) => file.startsWith("docs/") || file === "AGENTS.md" || file.startsWith("agent/phase-briefs/") || file.startsWith("evals/"));
  const touchesDesktop = files.some((file) => (
    file.startsWith("desktop/") ||
    file.includes("OSConsole") ||
    file.startsWith("src/app/(marketing)/os/") ||
    file === "src/lib/browserSpeech.ts" ||
    file === "src/lib/osConsoleFixtures.ts"
  ));
  const touchesSource = files.some((file) => file.startsWith("src/app/") || file.startsWith("src/components/") || file.startsWith("src/lib/"));
  const touchesScriptsOrPackage = files.some((file) => file.startsWith("scripts/") || file === "package.json" || file === "package-lock.json");

  if (touchesDesktop) {
    return {
      routine: "desktop",
      verificationScope: "desktop",
      reason: "changes touch /os, browser speech, or Electron desktop files",
      commands: ["npm run agent:verify -- --desktop"],
    };
  }
  if (touchesSource) {
    return {
      routine: "site",
      verificationScope: "site",
      reason: "changes touch site source files",
      commands: ["npm run agent:verify -- --site"],
    };
  }
  if (touchesScriptsOrPackage) {
    return {
      routine: "site",
      verificationScope: "site",
      reason: "changes touch package metadata or executable agent scripts",
      commands: ["npm run agent:verify -- --site"],
    };
  }
  if (docsOnly) {
    return {
      routine: "docs-only",
      verificationScope: "docs-only",
      reason: "changes are limited to docs, eval fixtures, or phase briefs",
      commands: ["npm run agent:verify -- --docs-only"],
    };
  }
  return {
    routine: "site",
    verificationScope: "site",
    reason: "changed files do not match a narrower routine; site verification is the conservative default",
    commands: ["npm run agent:verify -- --site"],
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
    options: {
      json: outputJson,
      compact: compactOutput,
    },
    repoIdentity: {
      name: path.basename(repoRoot),
      root: repoRoot,
      branch: branch.ok ? branch.output : "unknown",
      head: head.ok ? head.output : "unknown",
      workingTreeClean: status.clean,
      gitStatus: status.summary,
      changedFiles: status.changedFiles,
      packageName: packageJson.name,
      packageVersion: packageJson.version,
    },
    recentCommits: recentCommits(),
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
    maps: {
      coreDirectories: {
        "src/app": fileExists("src/app"),
        "src/components": fileExists("src/components"),
        "src/lib": fileExists("src/lib"),
        desktop: fileExists("desktop"),
        docs: fileExists("docs"),
        evals: fileExists("evals"),
        scripts: fileExists("scripts"),
        "agent/phase-briefs": fileExists("agent/phase-briefs"),
      },
      routes: appRouteMap(),
      components: componentMap(),
      desktop: desktopMap(),
      tests: testMap(),
      docs: docsMap(),
      evals: evalSummary(),
      scripts: scriptInventory(),
    },
    highRiskPaths: highRiskPaths.map((item) => ({
      ...item,
      exists: fileExists(item.path),
      risk: riskForPath(item.path),
    })),
    riskClassification: riskClassification(),
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
    recommendedRoutineAndVerification: inferRecommendation(status.changedFiles),
    suggestedNextCommands: [
      "npm run agent:preflight",
      "npm run agent:status",
      "npm run agent:context",
      "npm run agent:routine -- --list",
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

function printFileRows(items, formatter, indent = "") {
  for (const item of items) console.log(`${indent}- ${formatter(item)}`);
}

function printCompactMarkdown(context) {
  console.log("# Delta Site Agent Context Bundle (Compact)");
  console.log("");
  console.log(`Generated: ${context.generatedAt}`);
  console.log("Mode: read-only stdout context bundle. No files are written and no services are called.");
  console.log("");
  console.log(`- repo: ${context.repoIdentity.name}`);
  console.log(`- root: ${context.repoIdentity.root}`);
  console.log(`- branch: ${context.repoIdentity.branch}`);
  console.log(`- HEAD: ${context.repoIdentity.head}`);
  console.log(`- working tree clean: ${printBoolean(context.repoIdentity.workingTreeClean)}`);
  console.log(`- Morning-Standup included: ${printBoolean(context.productWorkspace.morningStandup.includedInDeltaContext)}`);
  console.log(`- routes: ${context.maps.routes.length}`);
  console.log(`- components: ${context.maps.components.length}`);
  console.log(`- desktop files: ${context.maps.desktop.length}`);
  console.log(`- tests/smoke files: ${context.maps.tests.length}`);
  console.log(`- docs: ${context.maps.docs.length}`);
  console.log(`- eval fixtures: ${context.maps.evals.files.length} files / ${context.maps.evals.totalItems} items`);
  console.log(`- recommended routine: ${context.recommendedRoutineAndVerification.routine}`);
  console.log(`- recommended verification: ${context.recommendedRoutineAndVerification.verificationScope}`);
  console.log("");
  console.log("Suggested commands:");
  printList(context.recommendedRoutineAndVerification.commands);
}

function printMarkdown(context) {
  if (compactOutput) {
    printCompactMarkdown(context);
    return;
  }

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
  if (context.repoIdentity.changedFiles.length > 0) {
    console.log("- changed files:");
    printFileRows(context.repoIdentity.changedFiles, (item) => `${item.status || "?"} ${item.file}`, "  ");
  }

  printSection("Recent Commits");
  if (context.recentCommits.length === 0) console.log("- unavailable");
  else printFileRows(context.recentCommits, (commit) => `${commit.hash} ${commit.subject}`);

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
  console.log(`- note: ${morningStandup.note}`);

  printSection("Agent Foundation Status");
  console.log("- required docs:");
  for (const [docPath, present] of Object.entries(context.agentFoundation.requiredDocs)) {
    console.log(`  - ${docPath}: ${printBoolean(present)}`);
  }
  console.log("- agent package scripts:");
  for (const [script, command] of Object.entries(context.agentFoundation.packageScripts)) {
    console.log(`  - ${script}: ${command || "missing"}`);
  }

  printSection("Route Map");
  printFileRows(context.maps.routes, (route) => `${route.route} (${route.kind}, ${route.risk}) — ${route.file}`);

  printSection("Component Map");
  printFileRows(context.maps.components, (component) => `${component.file} — ${component.classification}, risk=${component.risk}${component.highlight ? ", highlight" : ""}`);

  printSection("Desktop/Electron Map");
  printFileRows(context.maps.desktop, (desktopFile) => `${desktopFile.file} — ${desktopFile.kind}, risk=${desktopFile.risk}`);

  printSection("Test Map");
  printFileRows(context.maps.tests, (testFile) => `${testFile.file} — ${testFile.type}; ${testFile.likelyCommand}`);

  printSection("Docs Map");
  printFileRows(context.maps.docs, (doc) => `${doc.file} — ${doc.kind}, risk=${doc.risk}`);

  printSection("Eval Map");
  console.log(`- total eval items: ${context.maps.evals.totalItems}`);
  console.log("- fixture files:");
  printFileRows(context.maps.evals.files, (fixture) => `${fixture.file}: ${fixture.count} (${Object.keys(fixture.categories).join(", ") || "uncategorized"})`, "  ");
  console.log("- categories:");
  for (const [category, count] of Object.entries(context.maps.evals.categories)) {
    console.log(`  - ${category}: ${count}`);
  }
  if (context.maps.evals.issues.length > 0) {
    console.log("- issues:");
    printList(context.maps.evals.issues, "  ");
  }

  printSection("Script Inventory");
  console.log("- package agent scripts:");
  printFileRows(context.maps.scripts.packageAgentScripts, (script) => `${script.name}: ${script.command}`, "  ");
  console.log("- local agent scripts:");
  printFileRows(context.maps.scripts.localAgentScripts, (script) => `${script.file} — risk=${script.risk}`, "  ");

  printSection("High-Risk Paths");
  for (const item of context.highRiskPaths) {
    console.log(`- ${item.path}: ${item.exists ? "present" : "absent"}; risk=${item.risk} — ${item.reason}`);
  }

  printSection("Risk Classification");
  for (const [level, entries] of Object.entries(context.riskClassification)) {
    console.log(`- ${level}:`);
    printFileRows(entries, (entry) => `${entry.path}: ${entry.exists === null ? "pattern" : entry.exists ? "present" : "absent"} — ${entry.reason}`, "  ");
  }

  printSection("Recommended Routine And Verification");
  console.log(`- routine: ${context.recommendedRoutineAndVerification.routine}`);
  console.log(`- verification scope: ${context.recommendedRoutineAndVerification.verificationScope}`);
  console.log(`- reason: ${context.recommendedRoutineAndVerification.reason}`);
  console.log("- commands:");
  printList(context.recommendedRoutineAndVerification.commands, "  ");

  printSection("Verification Summary");
  console.log("- docs-only:");
  printList(context.verificationSummary.docsOnly, "  ");
  console.log("- site:");
  printList(context.verificationSummary.site, "  ");
  console.log("- desktop:");
  printList(context.verificationSummary.desktop, "  ");

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
