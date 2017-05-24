const { clipboard, ipcRenderer } = require('electron');
const beautify_js = require('js-beautify');
const lang = require('language-classifier');
const path = require('path');
const Moon = require("moonjs");

//Listen for global shortcut hits from the main process
ipcRenderer.on('shortcut-hit', (event, arg) => {
  formatClipboard();
})

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