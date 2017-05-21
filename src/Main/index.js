const { electron, globalShortcut, app, BrowserWindow, Tray, Menu } = require('electron');
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

function setupTray() {
  if (process.platform !== 'darwin') {
    tray = new Tray(path.join(__dirname, '../images/win_icon.ico'));
  } else {
    tray = new Tray(path.join(__dirname, '../images/tray_icon_gray.png'));
    tray.setPressedImage(path.join(__dirname, '../images/tray_icon_color.png'));
  }
  tray.setToolTip('QuickFix');

  let contextMenu = Menu.buildFromTemplate([
    {label: 'Preferences...', type: 'normal'},
    {label: 'About QuickFix', type: 'normal'},    
    {type: 'separator'},
    {label: 'Quit', type: 'normal', role: 'quit'}
  ])

  tray.setContextMenu(contextMenu)
}

app.on('ready', () => {
  createWindow();
  handleSettings();
  setupTray();

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