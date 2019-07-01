import { ServerManager } from './server_mngr.js';

const RefreshData = {
  get listenerPort() {
    return chrome.runtime.connect({
      name: 'asanatabs-background-listener-port'
    });
  },

  // Immediately start preloading - set timer to ping login every 15 seconds
  setupIntervalRetrieval: () => {
    setInterval(async () => {
      const isLoggedIn = await ServerManager.isLoggedIn();
      console.log('### Background: logged in is ', isLoggedIn);

      chrome.extension
        .getBackgroundPage()
        .console.log(
          '### Background: retrieving workspaces in the background!'
        );
      const workspaces =
        (await ServerManager.workspaces(RefreshData.listenerPort)) || [];
      console.log(
        '### Background: GET request has retrieved workspaces.',
        workspaces
      );

      RefreshData.listenerPort.postMessage({ type: 'ping' });
    }, 5 * 1000);
  }
};

RefreshData.setupIntervalRetrieval();
