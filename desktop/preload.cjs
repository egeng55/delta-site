const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deltaDesktop", {
  copyText: (value) => ipcRenderer.invoke("delta-os:copy-text", String(value || "")),
  openConsoleInBrowser: () => ipcRenderer.invoke("delta-os:open-console-in-browser"),
  openExternal: (url) => ipcRenderer.invoke("delta-os:open-external", String(url || "")),
  reloadConsole: () => ipcRenderer.invoke("delta-os:reload-console"),
  showServiceManager: () => ipcRenderer.invoke("delta-os:show-service-manager"),
  getServiceStatus: () => ipcRenderer.invoke("delta-os:get-service-status"),
  startBackend: () => ipcRenderer.invoke("delta-os:start-backend"),
  startSite: () => ipcRenderer.invoke("delta-os:start-site"),
  startAll: () => ipcRenderer.invoke("delta-os:start-all"),
  stopBackend: () => ipcRenderer.invoke("delta-os:stop-backend"),
  stopSite: () => ipcRenderer.invoke("delta-os:stop-site"),
  stopAll: () => ipcRenderer.invoke("delta-os:stop-all"),
  getServiceLogs: () => ipcRenderer.invoke("delta-os:get-service-logs"),
  getConfig: () => ipcRenderer.invoke("delta-os:get-config"),
});
