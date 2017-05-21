const { electron, globalShortcut, app, BrowserWindow, Tray } = require('electron');
const settings = require('electron-settings');

const path = require('path');
const url = require('url');

let tray;
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600});

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function handleSettings() {
  let all_settings = settings.getAll();
}

app.on('ready', () => {
  createWindow();
  handleSettings();

  const ret = globalShortcut.register('CommandOrControl+B', () => {
    mainWindow.webContents.send('shortcut-hit', 'ping');
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});