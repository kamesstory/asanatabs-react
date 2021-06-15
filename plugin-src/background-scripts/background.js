import 'chrome-extension-async';
import { update } from './asana.js';

update();
setInterval(update, 60 * 1000);

chrome.runtime.setUninstallURL('http://jasonwang.tech/asanatabs/');
