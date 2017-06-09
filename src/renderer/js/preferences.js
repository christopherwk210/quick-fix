const { clipboard, ipcRenderer, shell, dialog } = require('electron');
const { app } = require('electron').remote;
const beautify_js = require('js-beautify');
const lang = require('language-classifier');
const path = require('path');
const fs = require('fs');
const Switchery = require('switchery-npm');

//Listen for global shortcut hits from the main process
ipcRenderer.on('shortcut-hit', (event, arg) => {
  formatClipboard();
})

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
      //Reset
    }
  });
}

/**
 * Sends the reset settings message to main process
 */
function resetSettings() {
  ipcRenderer.send('reset-settings', true);
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
      output = beautify_js.css(clipboard_contents);
      break;
    case 'html':
      output = beautify_js.html(clipboard_contents);
      break;
    case 'javascript':
    default:
      output = beautify_js.js_beautify(clipboard_contents);
      break;
  }

  new Notification('QuickFix', {
    title: 'QuickFix',
    body: 'Clipboard formatted!',
    silent: true
  });

  clipboard.clear();
  clipboard.writeText(output);
}

document.addEventListener("DOMContentLoaded", function() {
  //Add fancy switches 💅
  var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));
  elems.forEach( elem => {
    var switchery = new Switchery(elem, {
      color: '#E2635B',
      speed: '0.3s'
    });
  });
});