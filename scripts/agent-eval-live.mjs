#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const {
  liveEvalReportPath,
  parseArgs,
  printText,
  renderLiveEvalReport,
  runLiveEval,
} = require("./agent-eval-live-core.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const runsDir = path.join(repoRoot, "agent", "runs");

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2), process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error(
      "Usage: npm run agent:eval:live -- [--backend-url <url>] [--expected-domain <id>] [--json] [--require-live] [--write] [--force]",
    );
    process.exit(2);
  }

  const result = await runLiveEval(options);
  let output = result;
  if (options.write) {
    try {
      const writtenReport = writeReport(result, options.force);
      output = {
        ...result,
        report: {
          written: true,
          path: path.relative(repoRoot, writtenReport.path),
          absolutePath: writtenReport.path,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exit(1);
    }
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    printText(output);
    if (output.report?.written) {
      console.log("");
      console.log(`Report written: ${output.report.path}`);
    }
  }

  if (output.status === "failed") process.exit(1);
}

function writeReport(result, force) {
  mkdirSync(runsDir, { recursive: true });
  const now = new Date();
  const reportPath = liveEvalReportPath(runsDir, now);
  if (existsSync(reportPath) && !force) {
    throw new Error(`Live eval report already exists: ${path.relative(repoRoot, reportPath)}. Pass --force to overwrite.`);
  }
  writeFileSync(reportPath, renderLiveEvalReport(result, now), { encoding: "utf8" });
  return { path: reportPath };
}

await main();
