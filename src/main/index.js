//Electron stuffs
const {
  globalShortcut,
  app,
  BrowserWindow,
  Tray,
  Menu,
  shell,
  ipcMain,
  dialog } = require('electron');

//Node
const path = require('path'),
      url = require('url'),
      fs = require('fs');

//Third party
const settings = require('electron-settings'),
      stripJsonComments = require('strip-json-comments');

//Thank you https://github.com/sindresorhus/electron-is-dev!
const isDev = process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);

let mainWindow, aboutWindow, tray, forceQuit = false;
let userDataPath = app.getPath('userData');

//Load user settings
let showNotifications = settings.get('showNotifications', false);
let autoPrefix = settings.get('autoPrefix', false);

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
    height: 500,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

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

  //Pass along our initial values
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('change-notification', showNotifications);
    mainWindow.webContents.send('change-autoprefix', autoPrefix);
    mainWindow.webContents.send('change-beautify', beautifyOptions);
  });
}

/**
 * Create and show the about window
 */
function handleAboutWindow() {
  if (!aboutWindow) {
    aboutWindow = new BrowserWindow({
      width: 250,
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
 * Attempts to load the beautify options from the file.
 * If it fails, the default options are returned.
 * @return {object} Beautify options object
 */
function readBeautifyOptions() {
  try {
    return JSON.parse(
      stripJsonComments(
        fs.readFileSync(
          path.join(userDataPath, 'jsbeautifyrc.json'),
          'utf8'
        )
      )
    );
  } catch(e) {
    return JSON.parse(
      stripJsonComments(
        fs.readFileSync(
          path.join(__dirname, '../static/jsbeautifyrc.json'),
          'utf8'
        )
      )
    );
  }
}

/**
 * Loads settings from flat file storage
 */
function loadSettings() {
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
          beautifyOptions = readBeautifyOptions();
        }
      });
    }
  });
}

/**
 * Sets up ipcMain callbacks
 */
function ipcSetup() {
  //Settings reset
  ipcMain.on('reset-settings', (event, args) => {
    dialog.showMessageBox(mainWindow, {
      title: 'Warning',
      icon: path.join(__dirname, '../static/original_icon.png'),
      message: 'Are you sure you want to reset your settings to default?',
      type: 'warning',
      defaultId: 1,
      cancelId: 1,
      buttons: ['Yes', 'Cancel']
    }, res => {
      if (res === 0) {
        fs.unlink(path.join(userDataPath, 'jsbeautifyrc.json'), () => {
          fs.createReadStream(path.join(__dirname, '../static/jsbeautifyrc.json')).pipe(fs.createWriteStream(path.join(userDataPath, 'jsbeautifyrc.json')));
        });

        //Load default options
        beautifyOptions = JSON.parse(
          stripJsonComments(
            fs.readFileSync(
              path.join(__dirname, '../static/jsbeautifyrc.json'),
              'utf8'
            )
          )
        );

        //Notify the user about it
        event.sender.send('show-notification', {
          title: 'QuickFix',
          body: 'Settings successfully reset to default.'
        });
      }
    });
  });

  //Cant find settings file
  ipcMain.on('cant-find-settings-file', (event, args) => {
    //Copy the default first
    fs.createReadStream(path.join(__dirname, '../static/jsbeautifyrc.json')).pipe(fs.createWriteStream(path.join(userDataPath, 'jsbeautifyrc.json')));

    //Show it!
    shell.showItemInFolder(path.join(userDataPath, 'jsbeautifyrc.json'));

    //Notify our user
    event.sender.send('show-notification', {
      title: 'QuickFix',
      body: 'Warning: Couldn\'t find settings file. Default settings created.'
    });
  });

  //Reload settings
  ipcMain.on('reload-settings', (event, args) => {
    beautifyOptions = readBeautifyOptions();
    mainWindow.webContents.send('change-beautify', beautifyOptions);
    event.sender.send('show-notification', {
      title: 'QuickFix',
      body: 'Settings reloaded!'
    });
  });

  //Notification setting toggle
  ipcMain.on('show-notification-change', (event, args) => {
    settings.set('showNotifications', args);
    showNotifications = args;
  });

  //Auto prefix setting toggle
  ipcMain.on('auto-prefix-change', (event, args) => {
    settings.set('autoPrefix', args);
    autoPrefix = args;
  });
}

/**
 * Set up our application
 */
app.on('ready', () => {
  loadSettings();
  createWindow();
  setupTray();
  ipcSetup();

  const ret = globalShortcut.register('CommandOrControl+B', () => {
    mainWindow.webContents.send('shortcut-hit', 'ping');
  });

  //Don't show our app in the dock
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