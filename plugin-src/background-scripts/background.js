import 'chrome-extension-async';
import { update } from './fetchFromAsana.js';

update();
setInterval(update, 60 * 1000);
