import AsanaBridge from './asana_bridge.js';

export const ExtensionServer = {
  /**
   * Call from the background page: listen to chrome events and
   * requests from page clients, which can't make cross-domain requests.
   */
  listen: function() {
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
    console.log('Background check: version 53');

    chrome.runtime.onConnect.addListener(port => {
      console.log('pot', port);

      port.onMessage.addListener(async (request, sender, sendResponse) => {
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
        } else if (request.type === 'ping') {
          console.log('### Background: ping to onMessage listener received!');
        }
      });
    });
  }
};
