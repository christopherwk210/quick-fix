const { clipboard } = require('electron');
const beautify_js = require('js-beautify');
const lang = require('language-classifier');

function readClip() {
  console.log(beautify_js.js_beautify(clipboard.readText()));
}