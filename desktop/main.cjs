const { app, BrowserWindow, Menu, clipboard, ipcMain, shell, session } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { createDesktopHandler, isTrustedNavigation, assertTrustedSender, validateArguments } = require("./ipc-policy.cjs");
const { createDiagnosticRedactor } = require("./diagnostic-redaction.cjs");
const {
  SERVICE_LOG_LIMIT,
  resolveDesktopEntryUrl,
  resolveDesktopRuntime,
} = require("./runtime-config.cjs");

const SITE_ROOT = path.resolve(__dirname, "..");
const BACKEND_ROOT = process.env.DELTA_BACKEND_DIR || path.resolve(SITE_ROOT, "..", "delta-backend");
const isSmokeTest = process.argv.includes("--smoke-test");
const desktopRuntime = resolveDesktopRuntime({ isPackaged: app.isPackaged });
const hqUrl = resolveDesktopEntryUrl(process.env, console.warn);
const consoleUrl = hqUrl;
const publicHqUrl = publicUrl(hqUrl);
const localFallbackUrl = pathToFileURL(path.join(__dirname, "fallback.html")).toString();
const diagnostics = createDiagnosticRedactor();
diagnostics.registerEnvironment(process.env);
let serviceMutation = Promise.resolve();
let queuedMutations = 0;
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
    healthUrl: hqUrl,
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

function publicUrl(value) {
  const url = new URL(value);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  return url.toString();
}

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
    state.logs.push({ service: serviceName, stream, timestamp, line: diagnostics.redact(line) });
  }
  if (state.logs.length > SERVICE_LOG_LIMIT) {
    state.logs.splice(0, state.logs.length - SERVICE_LOG_LIMIT);
  }
}

function attachLogStream(serviceName, streamName, stream) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    // Bound unterminated process output before retaining it.
    if (buffer.length > 65536) buffer = buffer.slice(-65536);
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
    healthUrl: publicUrl(definition.healthUrl),
    cwd: definition.cwd,
    launchable: definition.launchable,
    disabledReason: definition.disabledReason,
    commandPreview: definition.launchable ? [definition.command, ...definition.args].join(" ") : null,
    error: error ? diagnostics.redact(error) : null,
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
    hqUrl: publicHqUrl,
    consoleUrl: publicHqUrl,
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
    const environment = definition.env();
    diagnostics.registerEnvironment(environment);
    const child = spawn(definition.command, definition.args, {
      cwd: definition.cwd,
      env: environment,
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
    hqUrl,
    consoleUrl: hqUrl,
    runtimeMode: desktopRuntime.mode,
    serviceManagerEnabled: desktopRuntime.serviceManagerEnabled,
  }));
  setTimeout(() => app.quit(), 250);
}

function safeOpenHqInBrowser() {
  shell.openExternal(hqUrl).catch((error) => {
    console.error(`[Delta HQ] Failed to open HQ URL: ${error.message}`);
  });
}

function safeOpenExternal(targetUrl) {
  try {
    const target = new URL(targetUrl || hqUrl);
    const allowed = new URL(hqUrl);
    if (!["http:", "https:"].includes(target.protocol) || target.origin !== allowed.origin || target.username || target.password) {
      throw new Error("Only the configured local Delta HQ origin can be opened from the desktop bridge.");
    }
    shell.openExternal(target.toString()).catch((error) => {
      console.error(`[Delta HQ] Failed to open external URL: ${error.message}`);
    });
    return true;
  } catch (error) {
    console.warn(`[Delta HQ] Blocked external URL: ${error.message}`);
    return false;
  }
}

function fallbackUrl(reason) {
  const url = new URL(localFallbackUrl);
  url.searchParams.set("hqUrl", publicHqUrl);
  url.searchParams.set("consoleUrl", publicHqUrl);
  url.searchParams.set("reason", diagnostics.redact(reason || "Delta HQ unavailable"));
  return url.toString();
}

function loadFallback(reason) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  fallbackLoading = true;
  mainWindow.loadURL(fallbackUrl(reason)).catch((error) => {
    const message = String(error.message || error);
    if (message.includes("ERR_ABORTED") || message.includes("(-3)")) return;
    console.error(`[Delta HQ] Failed to load fallback page: ${error.message}`);
    finishSmoke("failed");
  });
}

function buildMenu() {
  const template = [
    {
      label: "Delta HQ",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { label: "Open Delta HQ in Browser", click: safeOpenHqInBrowser },
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
            if (mainWindow && !mainWindow.isDestroyed()) reloadHqWindow();
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function installSafetyGuards() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    console.warn(`[Delta HQ] Blocked permission request: ${permission}`);
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => false);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Delta HQ",
    width: 1440,
    height: 900,
    minWidth: 1060,
    minHeight: 720,
    backgroundColor: "#f4f6f8",
    icon: path.join(__dirname, "..", "public", "icon.png"),
    show: !isSmokeTest,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isTrustedNavigation(mainWindow.webContents.getURL(), { entryUrl: hqUrl, fallbackUrl: localFallbackUrl }, true)) {
      safeOpenExternal(url);
    }
    return { action: "deny" };
  });

  const blockUntrustedNavigation = (event, targetUrl) => {
    if (!isTrustedNavigation(targetUrl, { entryUrl: hqUrl, fallbackUrl: localFallbackUrl }, true)) {
      event.preventDefault();
    }
  };
  mainWindow.webContents.on("will-navigate", blockUntrustedNavigation);
  mainWindow.webContents.on("will-redirect", blockUntrustedNavigation);
  mainWindow.webContents.on("will-attach-webview", (event) => event.preventDefault());

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) return;
    consoleLoadFailed = true;
    console.warn(`[Delta HQ] Failed to load configured workspace: ${diagnostics.redact(errorDescription)}`);
    setTimeout(() => loadFallback(errorDescription), 50);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    const loadedUrl = mainWindow.webContents.getURL();
    if (loadedUrl.startsWith("file://")) {
      finishSmoke("fallback_loaded");
      return;
    }
    if (consoleLoadFailed || fallbackLoading) return;
    finishSmoke("hq_loaded");
  });

  reloadHqWindow();
}

function reloadHqWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  consoleLoadFailed = false;
  fallbackLoading = false;
  mainWindow.loadURL(hqUrl).catch((error) => {
    loadFallback(error.message);
  });
}

function reloadConsoleWindow() {
  reloadHqWindow();
}

app.whenReady().then(() => {
  app.setName("Delta HQ");
  installSafetyGuards();
  buildMenu();

  const handle = (channels, action, options = {}) => {
    for (const channel of channels) {
      ipcMain.handle(channel, createDesktopHandler({
        getWindow: () => mainWindow,
        entryUrl: hqUrl,
        fallbackUrl: localFallbackUrl,
        action,
        ...options,
      }));
    }
  };
  const aliases = (name) => [`delta-hq:${name}`, `delta-os:${name}`];
  // The queue includes authorization, so a request waiting behind another mutation
  // must pass a fresh owner check immediately before its operation begins.
  const mutate = (channels, action) => {
    const checked = createDesktopHandler({
      getWindow: () => mainWindow, entryUrl: hqUrl, fallbackUrl: localFallbackUrl, owner: true, action,
    });
    for (const channel of channels) {
      ipcMain.handle(channel, (event, ...args) => {
        assertTrustedSender(event, mainWindow, { entryUrl: hqUrl, fallbackUrl: localFallbackUrl }, false);
        validateArguments("none", args, hqUrl);
        if (queuedMutations >= 4) throw new Error("Desktop service controls are busy. Try again after the current action completes.");
        queuedMutations += 1;
        const result = serviceMutation.then(() => checked(event, ...args));
        serviceMutation = result.catch(() => {});
        return result.finally(() => { queuedMutations -= 1; });
      });
    }
  };
  handle(aliases("copy-text"), (value) => {
    clipboard.writeText(value);
    return true;
  }, { arguments: "copy" });
  handle(["delta-hq:open-hq-in-browser", "delta-os:open-console-in-browser"], () => {
    safeOpenHqInBrowser();
    return true;
  });
  handle(aliases("open-external"), safeOpenExternal, { arguments: "url" });
  handle(["delta-hq:reload-hq", "delta-os:reload-console"], () => {
    reloadHqWindow();
    return true;
  });
  handle(aliases("show-service-manager"), () => {
    loadFallback("Reconnect to Delta to access owner service controls.");
    return true;
  });
  handle(aliases("get-service-status"), getServiceStatus, { owner: true });
  handle(aliases("get-service-logs"), getServiceLogs, { owner: true });
  mutate(["delta-hq:start-backend", "delta-os:start-backend"], () => startService("backend"));
  mutate(["delta-hq:start-site", "delta-os:start-site"], () => startService("site"));
  mutate(["delta-hq:start-all", "delta-os:start-all"], startAllServices);
  mutate(aliases("stop-backend"), () => stopService("backend"));
  mutate(aliases("stop-site"), () => stopService("site"));
  mutate(["delta-hq:stop-all", "delta-os:stop-all"], stopAllServices);
  handle(aliases("get-config"), () => ({
    hqUrl: publicHqUrl,
    consoleUrl: publicHqUrl,
    shellMode: false,
    desktopMode: desktopRuntime.mode,
    productionPathStatus: desktopRuntime.productionPathStatus,
    serviceManager: desktopRuntime.serviceManagerEnabled,
    serviceManagerDisabledReason: desktopRuntime.serviceManagerDisabledReason,
    micEnabled: false,
    notificationEnabled: false,
    ttsEnabled: false,
    memoryWritesEnabled: false,
  }), { owner: true });

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
