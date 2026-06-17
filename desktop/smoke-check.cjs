const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    console.error(`Desktop shell check failed: ${message}`);
    process.exit(1);
  }
}

const root = path.join(__dirname, "..");
const mainPath = path.join(__dirname, "main.cjs");
const preloadPath = path.join(__dirname, "preload.cjs");
const fallbackPath = path.join(__dirname, "fallback.html");
const packagePath = path.join(root, "package.json");

for (const file of [mainPath, preloadPath, fallbackPath, packagePath]) {
  assert(fs.existsSync(file), `${path.relative(root, file)} is missing`);
}

const main = fs.readFileSync(mainPath, "utf8");
const preload = fs.readFileSync(preloadPath, "utf8");
const fallback = fs.readFileSync(fallbackPath, "utf8");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

assert(packageJson.scripts["desktop:dev"], "desktop:dev script is missing");
assert(packageJson.scripts["desktop:check"], "desktop:check script is missing");
assert(main.includes("setPermissionRequestHandler"), "permission request handler is missing");
assert(main.includes("setPermissionCheckHandler"), "permission check handler is missing");
assert(main.includes("nodeIntegration: false"), "nodeIntegration must remain disabled");
assert(main.includes("contextIsolation: true"), "contextIsolation must remain enabled");
assert(main.includes("sandbox: true"), "renderer sandbox must remain enabled");
assert(!main.includes("child_process"), "desktop shell must not use child_process");
assert(!main.includes("exec("), "desktop shell must not execute commands");
assert(preload.includes("contextBridge"), "preload must expose a narrow bridge");
assert(!preload.includes("child_process"), "preload must not use child_process");
assert(fallback.includes("Delta OS Console is not reachable"), "fallback page copy is missing");
assert(fallback.includes("This shell does not start services"), "fallback safety copy is missing");

console.log("Desktop shell check passed.");
