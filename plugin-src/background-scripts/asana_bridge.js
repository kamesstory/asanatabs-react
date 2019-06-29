import { Options } from './options.js';

/**
 * Functionality to communicate with the Asana API. This should get loaded
 * in the "server" portion of the chrome extension because it will make
 * HTTP requests and needs cross-domain privileges.
 *
 * The bridge does not need to use an auth token to connect to
 * the API. Since it is a browser extension it can access the user's cookies
 * and can use them to authenticate to the API. This capability is specific
 * to browser extensions, and other types of applications would have to obtain
 * an auth token to communicate with the API.
 */

class AsanaBridge {
  /**
   * @type {String} Version of the Asana API to use.
   */
  API_VERSION = '1.0';

  /**
   * @type {Integer} How long an entry stays in the cache.
   */
  CACHE_TTL_MS = 15 * 60 * 1000;

  /**
   * @type {Boolean} Set to true on the server (background page), which will
   *     actually make the API requests. Clients will just talk to the API
   *     through the ExtensionServer.
   */
  is_server = false;

  /**
   * @type {dict} Map from API path to cache entry for recent GET requests.
   *     date {Date} When cache entry was last refreshed
   *     response {*} Cached request.
   */
  _cache = {};

  /**
   * @param opt_options {dict} Options to use; if unspecified will be loaded.
   * @return {String} The base URL to use for API requests.
   */
  baseApiUrl(opt_options) {
    let options = opt_options || Options.loadOptions();
    return 'https://' + options.asana_host_port + '/api/' + this.API_VERSION;
  }

  /**
   * Make a request to the Asana API.
   *
   * @param http_method {String} HTTP request method to use (e.g. "POST")
   * @param path {String} Path to call.
   * @param params {dict} Parameters for API method; depends on method.
   * @param callback {Function(response: dict)} Callback on completion.
   *     status {Integer} HTTP status code of response.
   *     data {dict} Object representing response of API call, depends on
   *         method. Only available if response was a 200.
   *     error {String?} Error message, if there was a problem.
   * @param options {dict?}
   *     miss_cache {Boolean} Do not check cache before requesting
   */
  async request(http_method, path, params, options) {
    http_method = http_method.toUpperCase();

    // If we're not the server page, send a message to it to make the
    // API request.
    if (!this.is_server) {
      console.log('### AsanaBridge: We are not the server page!');
      console.info(
        '### AsanaBridge: Received Client API Request',
        http_method,
        path,
        params
      );
      return;
    }

    if (http_method === 'PINGTEST') {
      console.log('### AsanaBridge: ping test registered!');
      // alert('Greetings from AsanaBridge! Ping test received.');
      return;
    }

    console.info(
      '### AsanaBridge: Server API Request',
      http_method,
      path,
      params
    );

    // Be polite to Asana API and tell them who we are.
    let manifest = chrome.runtime.getManifest();
    let client_name = [
      'chrome-extension',
      chrome.i18n.getMessage('@@extension_id'),
      manifest.version,
      manifest.name
    ].join(':');

    //
    let url = this.baseApiUrl() + path;
    let body_data;
    if (http_method === 'PUT' || http_method === 'POST') {
      // POST/PUT request, put params in body
      body_data = {
        data: params,
        options: { client_name: client_name }
      };
    } else {
      // GET/DELETE request, add params as URL parameters.
      let url_params = { opt_client_name: client_name, ...params };
      url +=
        '?' +
        Object.entries(url_params)
          .map(([key, value]) => key + '=' + value)
          .join('&');
    }

    console.log('### AsanaBridge: Making request to API', http_method, url);

    const cookie = await chrome.cookies.get({
      url: url,
      name: 'ticket'
    });

    console.log('### AsanaBridge: Cookie is ', cookie);

    if (!cookie) {
      return {
        status: 401,
        error: 'Not Authorized'
      };
    }

    // Note that any URL fetched here must be matched by a permission in
    // the manifest.json file!
    const response = await fetch(url, {
      method: http_method,
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Allow-Asana-Client': '1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body_data)
    });
    if (response.status !== 200) {
      console.log('### AsanaBridge: ERROR, response status ' + response.status);
    }

    const json = await response.json();
    console.log('### AsanaBridge: JSON response', json['data']);
    return json.data;
  }

  _readCache(path, date) {
    let entry = this._cache[path];
    if (entry && entry.date >= date - this.CACHE_TTL_MS) {
      return entry.response;
    }
    return null;
  }

  _writeCache(path, response, date) {
    this._cache[path] = {
      response: response,
      date: date
    };
  }
}

export default AsanaBridge;
