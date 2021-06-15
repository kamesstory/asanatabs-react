// USE THIS instead of asanabridge.request to send requests to backend server
// chrome.runtime.sendMessage(
//   {
//     type: 'api',
//     method: http_method,
//     path: path,
//     params: params,
//     options: options || {}
//   },
//   callback
// );

// NOTE: WE DO NOT NEED A CONTENT SCRIPT BECAUSE WE NEVER NEED TO INJECT SCRIPTS INTO ANY
//       WEBPAGE BESIDES THE NEW TAB (UNLESS WE WANT TO POP SOMETHING UP IN ASANA)

// chrome.cookies.get(
//   {
//     url: AsanaBridge.baseApiUrl(),
//     name: 'ticket'
//   },
//   function(cookie) {
//     console.log('Cookies exist: ' + !!(cookie && cookie.value));
//   }
// );

// alert('Hello from your Chrome extension!');
