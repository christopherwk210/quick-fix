const { clipboard, ipcRenderer, shell, dialog } = require('electron');
const { app } = require('electron').remote;
const beautify_js = require('js-beautify');
const lang = require('language-classifier');
const path = require('path');
const fs = require('fs');
const Switchery = require('switchery-npm');
const stripJsonComments = require('strip-json-comments');
const autoPrefixer = require('autoprefixer');
const postcss = require('postcss');

let showNotifications = false;
let autoPrefix = false;
let beautifyOptions = JSON.parse(
  stripJsonComments(
    fs.readFileSync(
      path.join(__dirname, '../../static/jsbeautifyrc.json'),
      'utf8'
    )
  )
);

//Listen for beautify option changes
ipcRenderer.on('change-beautify', (event, arg) => {
  beautifyOptions = arg;
});

//Listen for showNotification changes
ipcRenderer.on('change-notification', (event, arg) => {
  showNotifications = arg;
  if (arg) {
    document.getElementById('notificationSwitch').click();
  }
});

//Listen for autoPrefix changes
ipcRenderer.on('change-autoprefix', (event, arg) => {
  autoPrefix = arg;
  if (arg) {
    document.getElementById('autoprefixSwitch').click();
  }
});

//Listen for global shortcut hits from the main process
ipcRenderer.on('shortcut-hit', (event, arg) => {
  formatClipboard();
})

//Listen for notification triggers from main process
ipcRenderer.on('show-notification', (event, arg) => {
  new Notification('QuickFix', {
    title: arg.title,
    body: arg.body,
    silent: true
  });
});

function showNotificationChange(element) {
  showNotifications = element.checked;
  ipcRenderer.send('show-notification-change', element.checked);
}

function autoPrefixChange(element) {
  autoPrefix = element.checked;
  ipcRenderer.send('auto-prefix-change', element.checked);
}

/**
 * Opens finder showing the settings file
 */
function showSettings() {
  //Get app data path
  let userDataPath = app.getPath('userData');
  fs.exists(path.join(userDataPath, 'jsbeautifyrc.json'), exists => {
    if (exists) {
      shell.showItemInFolder(path.join(userDataPath, 'jsbeautifyrc.json'));
    } else {
      ipcRenderer.send('cant-find-settings-file', true);
    }
  });
}

/**
 * Sends the reload settings message to the main process
 */
function reloadSettings() {
  ipcRenderer.send('reload-settings', true);
}

/**
 * Sends the reset settings message to main process
 */
function resetSettings() {
  ipcRenderer.send('reset-settings', true);
}

/**
 * Clears & writes new content to the clipboard along with
 * an optional success notification.
 * @param {string} contents Contents to write to the clipboard
 * @param {boolean} notify Toggle showing a notification
 */
function writeClipboard(contents, notify) {
  if (notify) {
    new Notification('QuickFix', {
      title: 'QuickFix',
      body: 'Clipboard formatted!',
      silent: true
    });
  }

  clipboard.clear();
  clipboard.writeText(contents);
}

/**
 * Reads the clipboard contents, beautifies it, then overwrites the clipboard
 * with the output.
 */
function formatClipboard() {
  let clipboard_contents = clipboard.readText(),
      language = lang(clipboard_contents),
      output = '';

  //Make sure there's text to read
  if (clipboard_contents.length === 0) return;

  switch(language) {
    case 'css':
      if (!autoPrefix) {
        output = beautify_js.css(clipboard_contents, beautifyOptions.css);
      } else {
        //Autoprefix first
        postcss([ autoPrefixer ]).process(output).then(function (result) {
          result.warnings().forEach(function (warn) {
            console.warn(warn.toString());
          });
          //Then we beautify after
          writeClipboard(beautify_js.css(result.css, beautifyOptions.css), showNotifications);
        });
        return;
      }
      break;
    case 'html':
      output = beautify_js.html(clipboard_contents, beautifyOptions.html);
      break;
    case 'javascript':
    default:
      output = beautify_js.js_beautify(clipboard_contents, beautifyOptions.js);
      break;
  }

  writeClipboard(output, showNotifications);
}

document.addEventListener("DOMContentLoaded", function() {
  //Add fancy switches 💅
  var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));
  elems.forEach( elem => {
    var switchery = new Switchery(elem, {
      color: '#E2635B',
      secondaryColor: 'rgba(255, 255, 255, 0.9)',
      speed: '0.3s'
    });
  });
});