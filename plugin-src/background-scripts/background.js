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
console.log('Background check: version 45');

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'api') {
    // Request to the API. Pass it on to the bridge.
    const data = await asanaBridge.request(
      request.method,
      request.path,
      request.params,
      request.options || {}
    );

    if (data) {
      sendResponse(data);
    }
  } else if (request.type === 'notification') {
    const _notificationID = await chrome.notifications.create(
      request.title,
      request.options
    );
  }
});

// Immediately start preloading - set timer to ping login every 15 seconds
setInterval(async () => {
  const isLoggedIn = await ServerManager.isLoggedIn();
  console.log('### Background: logged in is ', isLoggedIn);
}, 5 * 1000);

// Refresh workspaces and tasks every minute and push to localStorage / cache
setInterval(async () => {
  const workspaces = await ServerManager.workspaces();
  console.log(
    '### Background: GET request has retrieved ' +
      workspaces.length +
      ' workspaces.'
  );
}, 10 * 1000);
