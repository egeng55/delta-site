/** @jest-environment node */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const owner = { access: { userId: "owner-id", role: "owner", permissions: ["runtime.execute"] } };

function boot() {
  const handlers = new Map();
  const events = new Map();
  const spawn = jest.fn();
  const fetch = jest.fn(async () => new Response(JSON.stringify(owner), { headers: { "content-type": "application/json" } }));
  const writeText = jest.fn();
  const openExternal = jest.fn(async () => {});
  const contents = {
    mainFrame: { url: "" }, getURL() { return this.mainFrame.url; }, isDestroyed: () => false,
    session: { fetch }, setWindowOpenHandler: jest.fn(), on: (name, callback) => events.set(name, callback),
  };
  const window = { webContents: contents, isDestroyed: () => false, loadURL: jest.fn(async (url) => { contents.mainFrame.url = url; }) };
  const electron = {
    app: { isPackaged: true, whenReady: () => ({ then: (cb) => cb() }), setName: jest.fn(), on: jest.fn() },
    BrowserWindow: jest.fn(() => window),
    Menu: { buildFromTemplate: (x) => x, setApplicationMenu: jest.fn() },
    clipboard: { writeText }, shell: { openExternal },
    ipcMain: { handle: (name, callback) => handlers.set(name, callback) },
    session: { defaultSession: { setPermissionRequestHandler: jest.fn(), setPermissionCheckHandler: jest.fn() } },
  };
  const desktopDir = __dirname;
  vm.runInNewContext(fs.readFileSync(path.join(desktopDir, "main.cjs"), "utf8"), {
    require: (name) => name === "electron" ? electron : name === "node:child_process" ? { spawn } :
      name.startsWith("./") ? require(path.join(desktopDir, name)) : require(name),
    __dirname: desktopDir, process: { env: {}, argv: [], platform: "darwin" },
    URL, console, setTimeout, clearTimeout,
  });
  return { handlers, events, spawn, fetch, writeText, openExternal, contents, window, event: { sender: contents, senderFrame: contents.mainFrame } };
}

const privileged = [
  "get-service-status", "get-service-logs", "get-config", "start-backend", "start-site", "start-all", "stop-backend", "stop-site", "stop-all",
];

describe("main process bridge wiring", () => {
  it("defaults to the workspace and protects every privileged channel and legacy alias", async () => {
    const f = boot();
    expect(f.contents.getURL()).toBe("http://127.0.0.1:3000/workspace");
    f.fetch.mockImplementation(async () => new Response("{}", { status: 401 }));
    for (const prefix of ["delta-hq", "delta-os"]) {
      for (const name of privileged) {
        const handler = f.handlers.get(`${prefix}:${name}`);
        expect(handler).toEqual(expect.any(Function));
        await expect(Promise.resolve().then(() => handler(f.event))).rejects.toThrow("Desktop access denied");
      }
    }
    expect(f.spawn).not.toHaveBeenCalled();
  });

  it("allows authenticated owner config without exposing session or environment secrets", async () => {
    const f = boot();
    const config = await f.handlers.get("delta-hq:get-config")(f.event);
    expect(config).toMatchObject({ hqUrl: "http://127.0.0.1:3000/workspace", serviceManager: false, shellMode: false });
    expect(config).not.toHaveProperty("env");
    expect(config).not.toHaveProperty("cookie");
    expect(f.fetch).toHaveBeenCalledTimes(1);
  });

  it("permits safe recovery actions but rejects privileged actions from recovery", async () => {
    const f = boot();
    await f.handlers.get("delta-hq:show-service-manager")(f.event);
    expect(f.contents.getURL()).toMatch(/^file:/);
    await f.handlers.get("delta-hq:copy-text")(f.event, "Offline");
    await f.handlers.get("delta-hq:open-hq-in-browser")(f.event);
    expect(f.writeText).toHaveBeenCalledWith("Offline");
    expect(f.openExternal).toHaveBeenCalledWith("http://127.0.0.1:3000/workspace");
    await expect(f.handlers.get("delta-hq:get-config")(f.event)).rejects.toThrow("Desktop access denied");
    expect(f.fetch).not.toHaveBeenCalled();
    await f.handlers.get("delta-hq:reload-hq")(f.event);
    expect(f.contents.getURL()).toBe("http://127.0.0.1:3000/workspace");
  });

  it("blocks external navigation, redirects, arbitrary files, and webviews", () => {
    const f = boot();
    for (const name of ["will-navigate", "will-redirect"]) {
      for (const url of ["file:///etc/passwd", "https://evil.test", "javascript:alert(1)"]) {
        const preventDefault = jest.fn();
        f.events.get(name)({ preventDefault }, url);
        expect(preventDefault).toHaveBeenCalled();
      }
    }
    const preventDefault = jest.fn();
    f.events.get("will-attach-webview")({ preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(f.openExternal).not.toHaveBeenCalled();
  });

  it("rejects untrusted safe-action IPC before clipboard or browser effects", async () => {
    const f = boot();
    f.contents.mainFrame.url = "https://evil.test";
    await expect(f.handlers.get("delta-hq:copy-text")(f.event, "Poisoned")).rejects.toThrow("Desktop access denied");
    await expect(f.handlers.get("delta-hq:open-hq-in-browser")(f.event)).rejects.toThrow("Desktop access denied");
    expect(f.writeText).not.toHaveBeenCalled();
    expect(f.openExternal).not.toHaveBeenCalled();
  });
});
