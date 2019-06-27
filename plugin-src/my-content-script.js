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

chrome.cookies.get(
  {
    url: AsanaBridge.baseApiUrl(),
    name: 'ticket'
  },
  function(cookie) {
    callback(!!(cookie && cookie.value));
  }
);
