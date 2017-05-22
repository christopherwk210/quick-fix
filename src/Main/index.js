const { electron, globalShortcut, app, BrowserWindow, Tray, Menu } = require('electron');
const settings = require('electron-settings');
const path = require('path');
const url = require('url');

let mainWindow, aboutWindow, tray;

/**
 * Create the main settings window
 */
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../renderer/views/preferences.html'),
    protocol: 'file:',
    slashes: true
  }));
}

/**
 * Initial load/set up of user settings
 */
function handleSettings() {
  let all_settings = settings.getAll();
}

function handleAboutWindow() {
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      width: 200,
      height: 200,
      resizable: false,
      minimizable: false,
      maximizable: false,
      skipTaskbar: true,
      title: ''
    });

    aboutWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../renderer/views/about.html'),
      protocol: 'file:',
      slashes: true
    }));

    aboutWindow.on('closed', () => {
      about = null;
    });
  }
}

/**
 * Sets up the tray icon and it's context menu
 */
function setupTray() {
  //Use the approapriate icon per OS
  if (process.platform !== 'darwin') {
    tray = new Tray(path.join(__dirname, '../images/win_icon.ico'));
  } else {
    tray = new Tray(path.join(__dirname, '../images/tray_icon_gray.png'));
    tray.setPressedImage(path.join(__dirname, '../images/tray_icon_color.png'));
  }

  //A nice tooltip
  tray.setToolTip('QuickFix');

  //Create the context menu
  let contextMenu = Menu.buildFromTemplate([
    {label: 'Preferences...', type: 'normal'},
    {label: 'About QuickFix', type: 'normal', click: handleAboutWindow},    
    {type: 'separator'},
    {label: 'Quit', type: 'normal', role: 'quit'}
  ])

  //Apply the menu
  tray.setContextMenu(contextMenu);
}

/**
 * Set up our application
 */
app.on('ready', () => {
  createWindow();
  handleSettings();
  setupTray();

  const ret = globalShortcut.register('CommandOrControl+B', () => {
    mainWindow.webContents.send('shortcut-hit', 'ping');
  });

  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

/**
 * Prevent app from closing when all windows are closed
 */
app.on('window-all-closed', () => {
  //😎
})