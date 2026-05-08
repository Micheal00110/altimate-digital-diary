// Main process for MyChild Diary Electron app
import { app, BrowserWindow, Menu, shell, ipcMain, Notification } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const isDev = process.env.NODE_ENV !== 'production';
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'MyChild Diary',
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: false,
    show: false,
  });

  // Build application menu
  const template = [
    {
      label: 'MyChild Diary',
      submenu: [
        { label: 'About MyChild Diary', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: () => {} },
        { type: 'separator' },
        { label: 'Hide MyChild Diary', accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Cmd+Alt+H', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit MyChild Diary', accelerator: 'Cmd+Q', role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+Cmd+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
        { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
        { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' },
        { label: 'Select All', accelerator: 'Cmd+A', role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'Cmd+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'Cmd+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'Cmd+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
        { label: 'Zoom', role: 'zoom' },
        { label: 'Close', accelerator: 'Cmd+W', role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://mychilddiary.app/docs'),
        },
        {
          label: 'Support',
          click: () => shell.openExternal('https://mychilddiary.app/support'),
        },
        {
          label: 'Privacy Policy',
          click: () => shell.openExternal('https://mychilddiary.app/privacy'),
        },
        {
          label: 'Terms of Service',
          click: () => shell.openExternal('https://mychilddiary.app/terms'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// IPC handlers
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.handle('show-notification', (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Simple file-based store for offline data
const storePath = join(app.getPath('userData'), 'store');
if (!existsSync(storePath)) {
  mkdirSync(storePath, { recursive: true });
}

ipcMain.handle('store-get', async (event, key) => {
  const { readFileSync } = await import('fs');
  try {
    const file = join(storePath, `${key}.json`);
    if (existsSync(file)) {
      return JSON.parse(readFileSync(file, 'utf-8'));
    }
    return null;
  } catch {
    return null;
  }
});

ipcMain.handle('store-set', async (event, key, value) => {
  const { writeFileSync } = await import('fs');
  try {
    const file = join(storePath, `${key}.json`);
    writeFileSync(file, JSON.stringify(value), 'utf-8');
  } catch (e) {
    console.error('Store set error:', e);
  }
});

ipcMain.handle('store-delete', async (event, key) => {
  const { unlinkSync } = await import('fs');
  try {
    const file = join(storePath, `${key}.json`);
    if (existsSync(file)) {
      unlinkSync(file);
    }
  } catch (e) {
    console.error('Store delete error:', e);
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent navigation to external sites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    if (isDev && parsedUrl.hostname === 'localhost') return;
    if (!isDev && url.startsWith(`file://${__dirname}`)) return;
    event.preventDefault();
  });
});
