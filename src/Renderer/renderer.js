const { clipboard, ipcRenderer } = require('electron');
const beautify_js = require('js-beautify');
const lang = require('language-classifier');

ipcRenderer.on('shortcut-hit', (event, arg) => {
  console.log(arg);
})

function formatClipboard() {
  let clipboard_contents = clipboard.readText(),
      language = lang(clipboard_contents),
      output = '';

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

  clipboard.clear();
  clipboard.writeText(output);
}