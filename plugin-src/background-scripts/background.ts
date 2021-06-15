import 'chrome-extension-async';
import { update } from './asana';

update();
setInterval(update, 60 * 1000);

chrome.runtime.setUninstallURL('http://jasonwang.tech/asanatabs/');
