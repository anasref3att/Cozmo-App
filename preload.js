const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cozmo', {
  checkAuth: () => ipcRenderer.invoke('auth:check'),
  startLogin: () => ipcRenderer.invoke('auth:login'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  onAuthResult: (cb) => ipcRenderer.on('auth:result', (_e, ok) => cb(ok)),
  onBootstrapStatus: (cb) => ipcRenderer.on('bootstrap:status', (_e, text) => cb(text)),
});
