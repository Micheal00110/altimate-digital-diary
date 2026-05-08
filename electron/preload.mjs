// Preload script for Electron - exposes safe APIs to renderer
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => process.platform,

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // Notifications
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', title, body),

  // Store for offline capability
  getStoreValue: (key) => ipcRenderer.invoke('store-get', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('store-set', key, value),
  deleteStoreValue: (key) => ipcRenderer.invoke('store-delete', key),

  // Events
  onUpdateAvailable: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
});
