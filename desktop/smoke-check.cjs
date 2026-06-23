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
const runtimeConfigPath = path.join(__dirname, "runtime-config.cjs");
const packagePath = path.join(root, "package.json");

for (const file of [mainPath, preloadPath, fallbackPath, runtimeConfigPath, packagePath]) {
  assert(fs.existsSync(file), `${path.relative(root, file)} is missing`);
}

const main = fs.readFileSync(mainPath, "utf8");
const preload = fs.readFileSync(preloadPath, "utf8");
const fallback = fs.readFileSync(fallbackPath, "utf8");
const runtimeConfig = require(runtimeConfigPath);
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

assert(packageJson.scripts["desktop:dev"], "desktop:dev script is missing");
assert(packageJson.scripts["desktop:check"], "desktop:check script is missing");
assert(packageJson.scripts["desktop:smoke:services"], "desktop:smoke:services script is missing");
assert(main.includes("setPermissionRequestHandler"), "permission request handler is missing");
assert(main.includes("setPermissionCheckHandler"), "permission check handler is missing");
assert(main.includes("nodeIntegration: false"), "nodeIntegration must remain disabled");
assert(main.includes("contextIsolation: true"), "contextIsolation must remain enabled");
assert(main.includes("sandbox: true"), "renderer sandbox must remain enabled");
assert(!main.includes("exec("), "desktop shell must not execute commands");
assert(main.includes('require("node:child_process")'), "desktop service manager should use child_process spawn from main only");
assert(main.includes("spawn(definition.command, definition.args"), "desktop service manager must launch fixed definitions with spawn");
assert(main.includes("shell: false"), "desktop service manager must keep shell execution disabled");
assert(main.includes("serviceDefinitions"), "allowlisted service definitions are missing");
assert(main.includes('args: ["-m", "uvicorn", "api_server:app", "--host", "127.0.0.1", "--port", "8000"]'), "backend allowlisted command is missing");
assert(main.includes('args: ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"]'), "site allowlisted command is missing");
assert(main.includes("resolveDesktopRuntime({ isPackaged: app.isPackaged })"), "packaged runtime resolution is missing");
assert(main.includes("if (!definition.launchable)"), "packaged service start guard is missing");
assert(main.includes("serviceManagerEnabled"), "service manager enabled status is missing");
assert(main.includes('"delta-os:start-backend"'), "startBackend IPC handler is missing");
assert(main.includes('"delta-os:start-site"'), "startSite IPC handler is missing");
assert(main.includes('"delta-os:start-all"'), "startAll IPC handler is missing");
assert(main.includes('"delta-os:stop-all"'), "stopAll IPC handler is missing");
assert(main.includes("safeOpenExternal"), "safe external URL handling is missing");
assert(main.includes("target.origin !== allowed.origin"), "external URL handling must stay origin-restricted");
assert(preload.includes("contextBridge"), "preload must expose a narrow bridge");
assert(!preload.includes("child_process"), "preload must not use child_process");
assert(!preload.includes("exec"), "preload must not expose command execution");
assert(preload.includes("startBackend"), "preload startBackend bridge is missing");
assert(preload.includes("getServiceStatus"), "preload service status bridge is missing");
assert(!preload.includes("runCommand"), "preload must not expose arbitrary command APIs");
assert(fallback.includes("Delta OS service manager"), "service manager fallback copy is missing");
assert(fallback.includes("Start Services"), "service manager start action is missing");
assert(fallback.includes("No microphone capture"), "service manager safety copy is missing");
assert(fallback.includes("No backend TTS"), "service manager TTS safety copy is missing");
assert(fallback.includes("Packaged Delta OS does not start local development services"), "packaged mode service-manager copy is missing");
assert(fallback.includes("serviceManagerEnabled"), "fallback must render service-manager enabled state");
assert(runtimeConfig.resolveDesktopRuntime({ isPackaged: false }).serviceManagerEnabled === true, "development runtime must allow local service manager");
assert(runtimeConfig.resolveDesktopRuntime({ isPackaged: true }).serviceManagerEnabled === false, "packaged runtime must not launch local dev services");
assert(
  runtimeConfig.resolveConsoleUrl({ DELTA_OS_CONSOLE_URL: "delta://bad" }, () => {}) === runtimeConfig.DEFAULT_CONSOLE_URL,
  "invalid console URL should fall back safely",
);

console.log("Desktop shell check passed.");
