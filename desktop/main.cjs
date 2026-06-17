const { app, BrowserWindow, Menu, clipboard, ipcMain, shell, session } = require("electron");
const path = require("node:path");

const DEFAULT_CONSOLE_URL = "http://127.0.0.1:3000/os";
const isSmokeTest = process.argv.includes("--smoke-test");

function resolveConsoleUrl() {
  const configured = process.env.DELTA_OS_CONSOLE_URL || DEFAULT_CONSOLE_URL;
  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Delta OS console URL must be http or https.");
    }
    return url.toString();
  } catch (error) {
    console.warn(`[Delta OS] Invalid DELTA_OS_CONSOLE_URL; falling back to ${DEFAULT_CONSOLE_URL}.`);
    return DEFAULT_CONSOLE_URL;
  }
}

const consoleUrl = resolveConsoleUrl();
let mainWindow = null;
let smokeFinished = false;
let consoleLoadFailed = false;
let fallbackLoading = false;

function finishSmoke(status) {
  if (!isSmokeTest || smokeFinished) return;
  smokeFinished = true;
  console.log(JSON.stringify({
    desktopSmoke: status,
    loadedUrl: mainWindow?.webContents.getURL() || null,
    consoleUrl,
  }));
  setTimeout(() => app.quit(), 250);
}

function safeOpenConsoleInBrowser() {
  shell.openExternal(consoleUrl).catch((error) => {
    console.error(`[Delta OS] Failed to open console URL: ${error.message}`);
  });
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
    if (String(error.message).includes("ERR_ABORTED")) return;
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
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(consoleUrl);
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
  ipcMain.handle("delta-os:reload-console", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(consoleUrl);
    return true;
  });
  ipcMain.handle("delta-os:get-config", () => ({
    consoleUrl,
    shellMode: true,
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
