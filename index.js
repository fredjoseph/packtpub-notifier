let Promise = require('bluebird');
const cheerio = require("cheerio");
var cp = require('child_process');
const open = require("open");
var ws = require('windows-shortcuts');
const notifier = require('node-notifier');
const request = Promise.promisifyAll(require("request"));
var fs = Promise.promisifyAll(require('fs'));

const PACKTPUB_URL = 'https://www.packtpub.com/packt/offers/free-learning';

const SNORE_TOAST_EXE_PATH = __dirname + "/node_modules/node-notifier/vendor/snoreToast/SnoreToast.exe";
const WINDOWS_APP_ID_PATH = __dirname + '/vendor/Win7AppId/Win7AppId.exe';

const SHORTCUT_FULL_PATH = '%AppData%/Microsoft/Windows/Start Menu/Programs/PacktpubNotifier.lnk';
const SHORTCUT_REL_PATH = '/Microsoft/Windows/Start Menu/Programs/PacktpubNotifier.lnk';
const APP_ID = "Snore.PacktpubNotifier";

process.env.DEBUG = true;

request.getAsync(PACKTPUB_URL)
.then(content => {
  let $ = cheerio.load(content.body);
  let title = $('.dotd-title h2').text().trim();
  if (title === '') {
    throw "No free ebook today";
  }
  return Promise.resolve({title});
})
.then(params => {
  ws.create(SHORTCUT_FULL_PATH, SNORE_TOAST_EXE_PATH);
  return Promise.delay(2500, params);
})
.then(params => {
  addAppIdToShortcut(process.env.APPDATA + SHORTCUT_REL_PATH, APP_ID);
  return Promise.delay(1000, params);
})
.then(params => {
  notifier.notify({
    'title': 'Free PacktPub Ebook',
    'message': params.title,
    'wait': true,
    'appName': APP_ID
  })
  .on('click', (obj, options) => {
    open(PACKTPUB_URL);
  })
  return Promise.delay(500);
})
.then(_ => {
  fs.unlinkSync(process.env.APPDATA + SHORTCUT_REL_PATH);
})
.catch(e => console.error(e));

function addAppIdToShortcut(shortcutPath, appId) {
	var params = [];
	params.push(shortcutPath);
	params.push(appId);
	cp.execFile(WINDOWS_APP_ID_PATH, params, (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
  });
};