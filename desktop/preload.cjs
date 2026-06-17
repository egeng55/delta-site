const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deltaDesktop", {
  copyText: (value) => ipcRenderer.invoke("delta-os:copy-text", String(value || "")),
  openConsoleInBrowser: () => ipcRenderer.invoke("delta-os:open-console-in-browser"),
  reloadConsole: () => ipcRenderer.invoke("delta-os:reload-console"),
  getConfig: () => ipcRenderer.invoke("delta-os:get-config"),
});
