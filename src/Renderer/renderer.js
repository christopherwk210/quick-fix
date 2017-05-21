const { clipboard } = require('electron');
const beautify_js = require('js-beautify');
const lang = require('language-classifier');

function formatClipboard() {
  let clipboard_contents = clipboard.readText(),
      language = lang(clipboard_contents),
      output = '';

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

  console.log(output);
}