import 'chrome-extension-async';
import { ServerManager } from './background-scripts/server_mngr.js';

document.addEventListener('DOMContentLoaded', async function() {
  // Handler when the DOM is fully loaded
  await chrome.runtime.sendMessage({
    type: 'api',
    method: 'pingtest'
  });
  console.log('### Main.js: pingtest sent!');

  // BIG TODO: https://stackoverflow.com/questions/48969495/in-javascript-how-do-i-should-i-use-async-await-with-xmlhttprequest

  // Immediately load workspaces from cache
  // If cache is empty, request all tasks from server
  const retrievedWorkspaces = await ServerManager.workspaces();
  console.log('GET request has retrieved workspaces.', retrievedWorkspaces);
});
