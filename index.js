let Promise = require('bluebird');
const cheerio = require("cheerio");
const openurl = require("openurl");
const notifier = Promise.promisifyAll(require('node-notifier'));
var ws = Promise.promisifyAll(require('windows-shortcuts'));
var cp = Promise.promisifyAll(require('child_process'));
const request = Promise.promisifyAll(require("request"));
var fs = Promise.promisifyAll(require('fs'));
var regedit = Promise.promisifyAll(require('regedit'));

var utils = require('./utils.js');

const PACKTPUB_URL = 'https://www.packtpub.com/packt/offers/free-learning';

const SNORE_TOAST_EXE_PATH = __dirname + "/node_modules/node-notifier/vendor/snoreToast/SnoreToast.exe";
const WINDOWS_APP_ID_PATH = __dirname + '/vendor/Win7AppId/Win7AppId.exe';

const SHORTCUT_PATH = process.env.APPDATA + '/Microsoft/Windows/Start Menu/Programs/PacktpubNotifier.lnk';
const APP_ID = "Snore.PacktpubNotifier";

async function main() {
    let [err, title] = await utils.to_array(getEbookTitle());
    if (err) throw err;
    
    if (!title) {
        throw new Error("No free ebook today");
    }
    
    try {
        await createShortcut();
        Promise.delay(2500);  // Weird : `SnoreToast` displays nothing if called to soon after the shortcut creation
        const notificationDuration = await getNotificationDuration();
        // Use a retry strategy in case the previous delay was not enough
        await utils.retry(() => notify(title, notificationDuration), {retry: 2, interval: 100})
    } catch (err) {
        throw err;
    } finally {
        removeShortcut();
    }
}

async function getEbookTitle() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAsString = new Date().toISOString().substr(0, 10);
    const tomorrowAsString = tomorrow.toISOString().substr(0, 10);

    const [err, response] = await utils.to_array(request.getAsync(`https://services.packtpub.com/free-learning-v1/offers?dateFrom=${todayAsString}&dateTo=${tomorrowAsString}`));
    if (err) throw new Error(err);

    let content = JSON.parse(response.body);
    if (content.data && content.data.length > 0) {
        productId = content.data[0].productId;

        const [err, response] = await utils.to_array(request.getAsync(`https://static.packt-cdn.com/products/${productId}/summary`));
        if (err) throw new Error(err);

        content = JSON.parse(response.body);
        return content.title;
    }

    return;
}

async function createShortcut() {
    let appIdFn = async () => {
            let err, data;
            [err] = await utils.to_array(cp.execFileAsync(WINDOWS_APP_ID_PATH, [SHORTCUT_PATH, APP_ID]));
            if (err) throw err;
            // Sometimes the association failed without error. **Seems solved in new versions of Windows 10**
            // => Check if association succeeded by getting the current `app id` associated with the shortcut
            [err, data] = await utils.to_array(cp.execFileAsync(WINDOWS_APP_ID_PATH, [SHORTCUT_PATH]));
            
            if (data && data.includes(APP_ID)) return data;

            throw new Error("Failed to apply app id")
        };

    const [err] = await utils.to_array(ws.createAsync(SHORTCUT_PATH, SNORE_TOAST_EXE_PATH));
    if (err) throw new Error(err);

    // Weird : Sometimes the process failed to associate the `app id` with the shortcut. **Seems solved in new versions of Windows 10**
    // => This step is encapsulated in a `retry` strategy
    return utils.retry(appIdFn, {retry: 10, interval: 100});
}

async function getNotificationDuration() {
    const REGISTRY_KEY_PATH = 'HKCU\\Control Panel\\Accessibility';
    const REGISTRY_VALUE_NAME = 'MessageDuration';
    const DEFAULT_DURATION = 5;
    
    const [err, result] = await utils.to_array(regedit.listAsync(REGISTRY_KEY_PATH));
    if (err) return DEFAULT_DURATION;
    
    const valueObj = result[REGISTRY_KEY_PATH].values[REGISTRY_VALUE_NAME];
    return valueObj ? valueObj.value : DEFAULT_DURATION;
}

async function notify(message, duration) {
    const NOTIFICATION_ID = 100
    
    // Security for stopping the notification process if it's launched since more than `duration` + 5 seconds
    const canceller = utils.promiseTimeout(duration * 1000 + 5000);
    let promiseCancel = canceller.promise.then(async () => {
        await notifier.notifyAsync({'close': NOTIFICATION_ID});
        throw 'TIMEOUT';
    })

    if (!notifier.eventNames().includes('click')) {
        notifier.on('click', (_) => openurl.open(PACKTPUB_URL));
    }

    let promiseNotify = notifier.notifyAsync({
            'title': 'Free PacktPub Ebook',
            'message': message,
            'wait': true,
            'id': NOTIFICATION_ID,
            'appName': APP_ID
        }).then(() => canceller.cancel())

    const [err] = await utils.to_array(Promise.race([promiseCancel, promiseNotify]));
    if (err) throw new Error(err)
}

function removeShortcut() {
    if (fs.existsSync(SHORTCUT_PATH)) {
        fs.unlinkSync(SHORTCUT_PATH);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
