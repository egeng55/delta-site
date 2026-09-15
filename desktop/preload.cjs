const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deltaDesktop", {
  copyText: (value) => ipcRenderer.invoke("delta-hq:copy-text", String(value || "")),
  openHqInBrowser: () => ipcRenderer.invoke("delta-hq:open-hq-in-browser"),
  openConsoleInBrowser: () => ipcRenderer.invoke("delta-os:open-console-in-browser"),
  openExternal: (url) => ipcRenderer.invoke("delta-hq:open-external", String(url || "")),
  reloadHq: () => ipcRenderer.invoke("delta-hq:reload-hq"),
  reloadConsole: () => ipcRenderer.invoke("delta-os:reload-console"),
  showServiceManager: () => ipcRenderer.invoke("delta-hq:show-service-manager"),
  getServiceStatus: () => ipcRenderer.invoke("delta-hq:get-service-status"),
  startBackend: () => ipcRenderer.invoke("delta-hq:start-backend"),
  startSite: () => ipcRenderer.invoke("delta-hq:start-site"),
  startAll: () => ipcRenderer.invoke("delta-hq:start-all"),
  stopBackend: () => ipcRenderer.invoke("delta-hq:stop-backend"),
  stopSite: () => ipcRenderer.invoke("delta-hq:stop-site"),
  stopAll: () => ipcRenderer.invoke("delta-hq:stop-all"),
  getServiceLogs: () => ipcRenderer.invoke("delta-hq:get-service-logs"),
  getConfig: () => ipcRenderer.invoke("delta-hq:get-config"),
});
