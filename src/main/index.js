const { electron, globalShortcut, app, BrowserWindow, Tray, Menu, shell } = require('electron');
const settings = require('electron-settings');
const path = require('path');
const url = require('url');
const fs = require('fs');
const stripJsonComments = require('strip-json-comments');

let mainWindow, aboutWindow, tray, forceQuit = false;

//Load the default JSBeautify settings
let beautifyOptions = JSON.parse(
  stripJsonComments(
    fs.readFileSync(
      path.join(__dirname, '../static/jsbeautifyrc.json'),
      'utf8'
    )
  )
);

/**
 * Create the main settings window
 */
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 600,
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

  mainWindow.on('close', e => {
    if (!forceQuit) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

/**
 * Initial load/set up of user settings
 */
function handleSettings() {
  let all_settings = settings.getAll();
}

/**
 * Create and show the about window
 */
function handleAboutWindow() {
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      width: 300,
      height: 400,
      resizable: false,
      minimizable: false,
      maximizable: false,
      skipTaskbar: true,
      title: '',
      show: false
    });

    aboutWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../renderer/views/about.html'),
      protocol: 'file:',
      slashes: true
    }));

    aboutWindow.once('ready-to-show', () => {
      aboutWindow.show();
    });

    aboutWindow.on('closed', () => {
      aboutWindow = null;
    });
  } else {
    aboutWindow.focus();
  }
}

/**
 * Show the preferences window
 */
function handlePreferencesWindow() {
  mainWindow.show();
}

/**
 * Sets up the tray icon and it's context menu
 */
function setupTray() {
  //Use the approapriate icon per OS
  if (process.platform !== 'darwin') {
    tray = new Tray(path.join(__dirname, '../static/win_icon.ico'));
  } else {
    tray = new Tray(path.join(__dirname, '../static/tray_icon_gray.png'));
    tray.setPressedImage(path.join(__dirname, '../static/tray_icon_color.png'));
  }

  //A nice tooltip
  tray.setToolTip('QuickFix');

  //Create the context menu
  let contextMenu = Menu.buildFromTemplate([
    {label: 'Preferences...', type: 'normal', click: handlePreferencesWindow},
    {label: 'About QuickFix', type: 'normal', click: handleAboutWindow},    
    {type: 'separator'},
    {label: 'Quit', type: 'normal', role: 'quit'}
  ]);

  //Apply the menu
  tray.setContextMenu(contextMenu);
}

/**
 * Loads settings from flat file storage
 */
function loadSettings() {
  //Get app data path
  let userDataPath = app.getPath('userData');

  //Check if the folder exists
  fs.exists(userDataPath, exists => {
    //If it doesn't, create it and put the default options there
    if (!exists) {
      fs.createReadStream(path.join(__dirname, '../static/jsbeautifyrc.json')).pipe(fs.createWriteStream(path.join(userDataPath, 'jsbeautifyrc.json')));
    } else {
      //If the folder exists, check if the settings file exists
      fs.exists(path.join(userDataPath, 'jsbeautifyrc.json'), fileExists => {
        if (!fileExists) {
          //If it doesn't, put the default there
          fs.createReadStream(path.join(__dirname, '../static/jsbeautifyrc.json')).pipe(fs.createWriteStream(path.join(userDataPath, 'jsbeautifyrc.json')));
        } else {
          //If it does, read the settings that are there
        }
      });
    }
  });
}

/**
 * Set up our application
 */
app.on('ready', () => {
  loadSettings();
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
 * Use force to remove the preferences window
 */
app.on('before-quit', () => {
  forceQuit = true;
});

/**
 * Prevent app from closing when all windows are closed
 */
app.on('window-all-closed', () => {
  //😎
});