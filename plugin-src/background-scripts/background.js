import 'chrome-extension-async';
import { ExtensionServer } from './ExtensionServer.js';

ExtensionServer.listen();

// TODO: get rid of background script rerouting and only have one-way retrieval calls
//  from tab page to the background script!
