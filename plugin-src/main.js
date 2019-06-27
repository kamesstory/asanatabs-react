import AsanaBridge from './background-scripts/asana_bridge';

document.addEventListener('DOMContentLoaded', function() {
  // Handler when the DOM is fully loaded
  chrome.runtime.sendMessage(
    {
      type: 'api',
      method: 'pingtest'
    },
    () => console.log('### Main.js: pingtest sent!')
  );
});
