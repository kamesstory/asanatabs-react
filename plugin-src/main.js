import { ServerManager } from './background-scripts/server_mngr.js';

document.addEventListener('DOMContentLoaded', function() {
  // Handler when the DOM is fully loaded
  chrome.runtime.sendMessage(
    {
      type: 'api',
      method: 'pingtest'
    },
    () => console.log('### Main.js: pingtest sent!')
  );

  // Immediately load workspaces from cache
  // If cache is empty, request all tasks from server
});
