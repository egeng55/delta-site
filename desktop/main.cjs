const { app, BrowserWindow, Menu, clipboard, ipcMain, shell, session } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const {
  SERVICE_LOG_LIMIT,
  resolveConsoleUrl,
  resolveDesktopRuntime,
} = require("./runtime-config.cjs");

const SITE_ROOT = path.resolve(__dirname, "..");
const BACKEND_ROOT = process.env.DELTA_BACKEND_DIR || path.resolve(SITE_ROOT, "..", "delta-backend");
const isSmokeTest = process.argv.includes("--smoke-test");
const desktopRuntime = resolveDesktopRuntime({ isPackaged: app.isPackaged });
const consoleUrl = resolveConsoleUrl(process.env, console.warn);
const serviceDefinitions = {
  backend: {
    label: "Backend",
    cwd: BACKEND_ROOT,
    command: path.join(BACKEND_ROOT, ".venv", "bin", "python"),
    args: ["-m", "uvicorn", "api_server:app", "--host", "127.0.0.1", "--port", "8000"],
    healthUrl: "http://127.0.0.1:8000/health",
    launchable: desktopRuntime.serviceManagerEnabled,
    disabledReason: desktopRuntime.serviceManagerDisabledReason,
    env: () => ({ ...process.env, ...readDotenv(path.join(BACKEND_ROOT, ".env")) }),
  },
  site: {
    label: "Site",
    cwd: SITE_ROOT,
    command: "npm",
    args: ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"],
    healthUrl: consoleUrl,
    launchable: desktopRuntime.serviceManagerEnabled,
    disabledReason: desktopRuntime.serviceManagerDisabledReason,
    env: () => ({ ...process.env }),
  },
};
const services = {
  backend: createServiceState(),
  site: createServiceState(),
};
let mainWindow = null;
let smokeFinished = false;
let consoleLoadFailed = false;
let fallbackLoading = false;

function createServiceState() {
  return {
    child: null,
    logs: [],
    lastError: null,
    lastExit: null,
    startedAt: null,
    stopRequested: false,
  };
}

function readDotenv(envPath) {
  try {
    const env = {};
    const source = fs.readFileSync(envPath, "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key) env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function serviceLog(serviceName, stream, message) {
  const state = services[serviceName];
  if (!state) return;
  const timestamp = new Date().toISOString();
  const lines = String(message || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  for (const line of lines) {
    state.logs.push({ service: serviceName, stream, timestamp, line });
  }
  if (state.logs.length > SERVICE_LOG_LIMIT) {
    state.logs.splice(0, state.logs.length - SERVICE_LOG_LIMIT);
  }
}

function attachLogStream(serviceName, streamName, stream) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const parts = buffer.split(/\r?\n/);
    buffer = parts.pop() || "";
    for (const part of parts) serviceLog(serviceName, streamName, part);
  });
  stream.on("end", () => {
    if (buffer) serviceLog(serviceName, streamName, buffer);
    buffer = "";
  });
}

function probeUrl(targetUrl, timeoutMs = 1500) {
  return new Promise((resolve) => {
    let settled = false;
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (error) {
      resolve({ ok: false, error: `Invalid URL: ${error.message}` });
      return;
    }
    const client = parsed.protocol === "https:" ? https : http;
    const request = client.request(
      parsed,
      { method: "GET", timeout: timeoutMs },
      (response) => {
        response.resume();
        response.on("end", () => {
          if (settled) return;
          settled = true;
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 500,
            statusCode: response.statusCode,
            error: response.statusCode >= 500 ? `HTTP ${response.statusCode}` : null,
          });
        });
      },
    );
    request.on("timeout", () => {
      if (settled) return;
      settled = true;
      request.destroy();
      resolve({ ok: false, error: "Request timed out" });
    });
    request.on("error", (error) => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, error: error.message });
    });
    request.end();
  });
}

async function getSingleServiceStatus(serviceName) {
  const definition = serviceDefinitions[serviceName];
  const state = services[serviceName];
  const checkedAt = new Date().toISOString();
  const probe = await probeUrl(definition.healthUrl);
  const child = state.child;
  const childRunning = Boolean(child && child.exitCode === null && !child.killed);
  let status = "stopped";
  let owner = "none";
  let error = probe.error || state.lastError;

  if (probe.ok) {
    status = "running";
    owner = childRunning ? "desktop" : "external";
    error = state.lastError && childRunning ? state.lastError : null;
  } else if (childRunning) {
    status = "starting";
    owner = "desktop";
  } else if (!definition.launchable) {
    status = "disabled";
    error = definition.disabledReason;
  } else if (state.lastError) {
    status = "error";
  }

  return {
    name: serviceName,
    label: definition.label,
    status,
    owner,
    pid: childRunning ? child.pid : null,
    stoppable: childRunning,
    startedAt: state.startedAt,
    lastCheckedAt: checkedAt,
    healthUrl: definition.healthUrl,
    cwd: definition.cwd,
    launchable: definition.launchable,
    disabledReason: definition.disabledReason,
    commandPreview: definition.launchable ? [definition.command, ...definition.args].join(" ") : null,
    error,
    lastExit: state.lastExit,
    logLines: state.logs.slice(-12),
  };
}

async function getServiceStatus() {
  const [backend, site] = await Promise.all([
    getSingleServiceStatus("backend"),
    getSingleServiceStatus("site"),
  ]);
  return {
    consoleUrl,
    generatedAt: new Date().toISOString(),
    services: { backend, site },
    desktop: {
      mode: desktopRuntime.mode,
      productionPathStatus: desktopRuntime.productionPathStatus,
      serviceManagerEnabled: desktopRuntime.serviceManagerEnabled,
      serviceManagerDisabledReason: desktopRuntime.serviceManagerDisabledReason,
    },
    safety: {
      arbitraryShellExecution: false,
      micEnabled: false,
      notificationEnabled: false,
      ttsEnabled: false,
      memoryWritesEnabled: false,
      stopsOnlyDesktopLaunchedProcesses: true,
    },
  };
}

async function startService(serviceName) {
  const definition = serviceDefinitions[serviceName];
  const state = services[serviceName];
  if (!definition || !state) throw new Error(`Unknown service: ${serviceName}`);

  if (!definition.launchable) {
    state.lastError = definition.disabledReason;
    serviceLog(serviceName, "system", definition.disabledReason);
    return getServiceStatus();
  }

  const current = await getSingleServiceStatus(serviceName);
  if (current.status === "running" && current.owner === "external") {
    serviceLog(serviceName, "system", `${definition.label} is already running outside the desktop app.`);
    return getServiceStatus();
  }
  if (state.child && state.child.exitCode === null && !state.child.killed) {
    serviceLog(serviceName, "system", `${definition.label} is already starting or running.`);
    return getServiceStatus();
  }

  state.lastError = null;
  state.lastExit = null;
  state.stopRequested = false;
  state.startedAt = new Date().toISOString();
  serviceLog(serviceName, "system", `Starting ${definition.label} with allowlisted desktop command.`);

  try {
    const child = spawn(definition.command, definition.args, {
      cwd: definition.cwd,
      env: definition.env(),
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    state.child = child;
    serviceLog(serviceName, "system", `${definition.label} process started with pid ${child.pid}.`);
    attachLogStream(serviceName, "stdout", child.stdout);
    attachLogStream(serviceName, "stderr", child.stderr);
    child.on("error", (error) => {
      state.lastError = error.message;
      serviceLog(serviceName, "error", error.message);
    });
    child.on("exit", (code, signal) => {
      state.lastExit = {
        code,
        signal,
        at: new Date().toISOString(),
      };
      serviceLog(serviceName, "system", `${definition.label} exited with code ${code ?? "null"} signal ${signal ?? "null"}.`);
      if (!state.stopRequested && code !== 0) {
        state.lastError = `${definition.label} exited unexpectedly with code ${code ?? "null"} signal ${signal ?? "null"}.`;
      }
      state.child = null;
      state.stopRequested = false;
    });
  } catch (error) {
    state.lastError = error.message;
    serviceLog(serviceName, "error", error.message);
  }
  return getServiceStatus();
}

async function stopService(serviceName) {
  const definition = serviceDefinitions[serviceName];
  const state = services[serviceName];
  if (!definition || !state) throw new Error(`Unknown service: ${serviceName}`);

  if (!state.child || state.child.exitCode !== null || state.child.killed) {
    serviceLog(serviceName, "system", `${definition.label} was not launched by this desktop app; nothing stopped.`);
    return getServiceStatus();
  }

  state.stopRequested = true;
  state.lastError = null;
  serviceLog(serviceName, "system", `Stopping ${definition.label} process ${state.child.pid}.`);
  state.child.kill("SIGTERM");
  setTimeout(() => {
    if (state.child && state.child.exitCode === null && !state.child.killed) {
      serviceLog(serviceName, "system", `${definition.label} did not exit after SIGTERM; sending SIGKILL.`);
      state.child.kill("SIGKILL");
    }
  }, 5000).unref?.();
  return getServiceStatus();
}

async function startAllServices() {
  await startService("backend");
  await startService("site");
  return getServiceStatus();
}

async function stopAllServices() {
  await stopService("site");
  await stopService("backend");
  return getServiceStatus();
}

function getServiceLogs() {
  return {
    backend: services.backend.logs.slice(-SERVICE_LOG_LIMIT),
    site: services.site.logs.slice(-SERVICE_LOG_LIMIT),
  };
}

function finishSmoke(status) {
  if (!isSmokeTest || smokeFinished) return;
  smokeFinished = true;
  console.log(JSON.stringify({
    desktopSmoke: status,
    loadedUrl: mainWindow?.webContents.getURL() || null,
    consoleUrl,
    runtimeMode: desktopRuntime.mode,
    serviceManagerEnabled: desktopRuntime.serviceManagerEnabled,
  }));
  setTimeout(() => app.quit(), 250);
}

function safeOpenConsoleInBrowser() {
  shell.openExternal(consoleUrl).catch((error) => {
    console.error(`[Delta OS] Failed to open console URL: ${error.message}`);
  });
}

function safeOpenExternal(targetUrl) {
  try {
    const target = new URL(targetUrl || consoleUrl);
    const allowed = new URL(consoleUrl);
    if (!["http:", "https:"].includes(target.protocol) || target.origin !== allowed.origin) {
      throw new Error("Only the configured local Delta OS origin can be opened from the desktop bridge.");
    }
    shell.openExternal(target.toString()).catch((error) => {
      console.error(`[Delta OS] Failed to open external URL: ${error.message}`);
    });
    return true;
  } catch (error) {
    console.warn(`[Delta OS] Blocked external URL: ${error.message}`);
    return false;
  }
}

function fallbackUrl(reason) {
  const url = new URL(`file://${path.join(__dirname, "fallback.html")}`);
  url.searchParams.set("consoleUrl", consoleUrl);
  url.searchParams.set("reason", reason || "OS Console unavailable");
  return url.toString();
}

function loadFallback(reason) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  fallbackLoading = true;
  mainWindow.loadURL(fallbackUrl(reason)).catch((error) => {
    const message = String(error.message || error);
    if (message.includes("ERR_ABORTED") || message.includes("(-3)")) return;
    console.error(`[Delta OS] Failed to load fallback page: ${error.message}`);
    finishSmoke("failed");
  });
}

function buildMenu() {
  const template = [
    {
      label: "Delta OS",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { label: "Open OS Console in Browser", click: safeOpenConsoleInBrowser },
        { label: "Show Service Manager", click: () => loadFallback("Service manager opened manually") },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Refresh",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) reloadConsoleWindow();
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function installSafetyGuards() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    console.warn(`[Delta OS] Blocked permission request: ${permission}`);
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => false);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Delta OS",
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 720,
    backgroundColor: "#0f1115",
    icon: path.join(__dirname, "..", "public", "icon.png"),
    show: !isSmokeTest,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url).catch((error) => {
        console.error(`[Delta OS] Failed to open external URL: ${error.message}`);
      });
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (targetUrl.startsWith("file://")) return;
    try {
      const target = new URL(targetUrl);
      const allowed = new URL(consoleUrl);
      if (target.origin === allowed.origin) return;
    } catch {
      // Fall through to blocking unknown navigations.
    }
    event.preventDefault();
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      shell.openExternal(targetUrl).catch((error) => {
        console.error(`[Delta OS] Failed to open external navigation: ${error.message}`);
      });
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    consoleLoadFailed = true;
    console.warn(`[Delta OS] Failed to load ${validatedURL}: ${errorDescription}`);
    setTimeout(() => loadFallback(errorDescription), 50);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    const loadedUrl = mainWindow.webContents.getURL();
    if (loadedUrl.startsWith("file://")) {
      finishSmoke("fallback_loaded");
      return;
    }
    if (consoleLoadFailed || fallbackLoading) return;
    finishSmoke("console_loaded");
  });

  reloadConsoleWindow();
}

function reloadConsoleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  consoleLoadFailed = false;
  fallbackLoading = false;
  mainWindow.loadURL(consoleUrl).catch((error) => {
    loadFallback(error.message);
  });
}

app.whenReady().then(() => {
  app.setName("Delta OS");
  installSafetyGuards();
  buildMenu();

  ipcMain.handle("delta-os:copy-text", (_event, value) => {
    clipboard.writeText(String(value || ""));
    return true;
  });
  ipcMain.handle("delta-os:open-console-in-browser", () => {
    safeOpenConsoleInBrowser();
    return true;
  });
  ipcMain.handle("delta-os:open-external", (_event, targetUrl) => safeOpenExternal(String(targetUrl || consoleUrl)));
  ipcMain.handle("delta-os:reload-console", () => {
    reloadConsoleWindow();
    return true;
  });
  ipcMain.handle("delta-os:show-service-manager", () => {
    loadFallback("Service manager opened manually");
    return true;
  });
  ipcMain.handle("delta-os:get-service-status", () => getServiceStatus());
  ipcMain.handle("delta-os:start-backend", () => startService("backend"));
  ipcMain.handle("delta-os:start-site", () => startService("site"));
  ipcMain.handle("delta-os:start-all", () => startAllServices());
  ipcMain.handle("delta-os:stop-backend", () => stopService("backend"));
  ipcMain.handle("delta-os:stop-site", () => stopService("site"));
  ipcMain.handle("delta-os:stop-all", () => stopAllServices());
  ipcMain.handle("delta-os:get-service-logs", () => getServiceLogs());
  ipcMain.handle("delta-os:get-config", () => ({
    consoleUrl,
    shellMode: false,
    desktopMode: desktopRuntime.mode,
    productionPathStatus: desktopRuntime.productionPathStatus,
    serviceManager: desktopRuntime.serviceManagerEnabled,
    serviceManagerDisabledReason: desktopRuntime.serviceManagerDisabledReason,
    micEnabled: false,
    notificationEnabled: false,
    ttsEnabled: false,
    memoryWritesEnabled: false,
  }));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  for (const serviceName of Object.keys(services)) {
    const state = services[serviceName];
    if (state.child && state.child.exitCode === null && !state.child.killed) {
      state.stopRequested = true;
      state.child.kill("SIGTERM");
    }
  }
});
