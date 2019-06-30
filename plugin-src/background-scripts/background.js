import 'chrome-extension-async';
import AsanaBridge from './asana_bridge.js';
import { ServerManager } from './server_mngr.js';

const asanaBridge = new AsanaBridge();
asanaBridge.is_server = true;

/**
 * The "server" portion of the chrome extension, which listens to events
 * from other clients such as the popup or per-page content windows.
 */
/**
 * Call from the background page: listen to chrome events and
 * requests from page clients, which can't make cross-domain requests.
 */
// Mark our Api Bridge as the server side (the one that actually makes
// API requests to Asana vs. just forwarding them to the server window).
console.log('ExtensionServer reloaded at ' + new Date().toString());
console.log('Background check: version 50');

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  chrome.extension
    .getBackgroundPage()
    .console.log('### Background: chrome runtime request sent from ', sender);
  if (request.type === 'api') {
    // Request to the API. Pass it on to the bridge.
    chrome.extension
      .getBackgroundPage()
      .console.log('### Background: api request sent from ', sender);
    const data = await asanaBridge.request(
      request.method,
      request.path,
      request.params,
      request.options || {}
    );
    sendResponse(data);
    return true;
  } else if (request.type === 'notification') {
    chrome.notifications.create(request.title, request.options);
  }
});

// Immediately start preloading - set timer to ping login every 15 seconds
setInterval(async () => {
  const isLoggedIn = await ServerManager.isLoggedIn();
  console.log('### Background: logged in is ', isLoggedIn);

  chrome.extension
    .getBackgroundPage()
    .console.log('### Background: retrieving workspaces in the background!');
  const workspaces = await ServerManager.workspaces();
  console.log(
    '### Background: GET request has retrieved ' +
      workspaces.length +
      ' workspaces.'
  );
}, 5 * 1000);
