#!/usr/bin/env node

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  parseArgs,
  printText,
  runLiveEval,
} = require("./agent-eval-live-core.cjs");

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2), process.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    console.error(
      "Usage: npm run agent:eval:live -- [--backend-url <url>] [--expected-domain <id>] [--json] [--require-live]",
    );
    process.exit(2);
  }

  const result = await runLiveEval(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    printText(result);
  }

  if (result.status === "failed") process.exit(1);
}

await main();
