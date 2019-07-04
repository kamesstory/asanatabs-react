import { Options } from './options.js';

/**
 * Library of functions for the "server" portion of an extension, which is
 * loaded into the background and popup pages.
 *
 * Some of these functions are asynchronous, because they may have to talk
 * to the Asana API to get results.
 */
export const ServerManager = {
  ASANA_BRIDGE_BASE_URL: Options.loginUrl('') + 'api/' + '1.0',

  /**
   * Called by the model whenever a request is made and error occurs.
   * Override to handle in a context-appropriate way. Some requests may
   * also take an `errback` parameter which will handle errors with
   * that particular request.
   *
   * @param response {dict} Response from the server.
   */
  onError: function(response) {
    console.error('### ServerManager: ERROR thrown!');
  },

  /**
   * Requests the user's preferences for the extension.
   *
   * @param callback {Function(options)} Callback on completion.
   *     options {dict} See Options for details.
   */
  options: function(callback) {
    callback(Options.loadOptions());
  },

  /**
   * Saves the user's preferences for the extension.
   *
   * @param options {dict} See Options for details.
   * @param callback {Function()} Callback on completion.
   */
  saveOptions: function(options, callback) {
    Options.saveOptions(options);
    callback();
  },

  /**
   * Determine if the user is logged in.
   *
   * @param callback {Function(is_logged_in)} Called when request complete.
   *     is_logged_in {Boolean} True iff the user is logged in to Asana.
   */
  isLoggedIn: async function() {
    const cookie = await chrome.cookies.get({
      url: this.ASANA_BRIDGE_BASE_URL,
      name: 'ticket'
    });

    return !!(cookie && cookie.value);
  },

  __request: async function(http_method, path, params, options) {
    http_method = http_method.toUpperCase();

    if (http_method === 'PINGTEST') {
      console.log('### ServerManager: ping test registered!');
      // alert('Greetings from ServerManager! Ping test received.');
      return;
    }

    // Be polite to Asana API and tell them who we are.
    let manifest = chrome.runtime.getManifest();
    let client_name = [
      'chrome-extension',
      chrome.i18n.getMessage('@@extension_id'),
      manifest.version,
      manifest.name
    ].join(':');

    //
    let url = this.ASANA_BRIDGE_BASE_URL + path;
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

    const cookie = await chrome.cookies.get({
      url: url,
      name: 'ticket'
    });

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
      console.log(
        '### ServerManager: ERROR, response status ' + response.status
      );
    }

    const json = await response.json();
    console.log('### ServerManager: JSON response', json['data']);
    return json.data;
  },

  /**
   * Requests the set of workspaces the logged-in user is in.
   *
   * @param callback {Function(workspaces)} Callback on success.
   *     workspaces {dict[]}
   */
  workspaces: async function(options) {
    console.log('### ServerManager: inside workspaces!');

    const retrieved = await this.__request('GET', '/workspaces', {}, options);
    return this._processResponse(retrieved);
  },

  /**
   * Requests the set of tasks assigned to the logged-in user from a single workspace
   *
   * @param callback {Function(workspaces)} Callback on success.
   *     workspaces {dict[]}
   */
  tasks: async function(workspace_id, options) {
    var params = {
      assignee: 'me',
      completed_since: 'now',
      limit: 100,
      workspace: workspace_id
    }; // assignee=me&completed_since=now&limit=100&workspace=[workspace_id]
    const retrieved = await this.__request('GET', '/tasks', params, options);

    return this._processResponse(retrieved);
  },

  /**
   * Requests the set of users in a workspace.
   *
   * @param callback {Function(users)} Callback on success.
   *     users {dict[]}
   */
  users: async function(workspace_id, options) {
    const retrieved = await this.__request(
      'GET',
      '/workspaces/' + workspace_id + '/users',
      { opt_fields: 'name,photo.image_60x60' },
      options
    );

    retrieved.forEach(user => this._updateUser(workspace_id, user));
    return this._processResponse(retrieved);
  },

  /**
   * Requests the user record for the logged-in user.
   *
   * @param callback {Function(user)} Callback on success.
   *     user {dict[]}
   */
  me: async function(options) {
    const retrieved = await this.__request('GET', '/users/me', {}, options);

    return this._processResponse(retrieved);
  },

  /**
   * Makes an Asana API request to add a task in the system.
   *
   * @param task {dict} Task fields.
   * @param callback {Function(response)} Callback on success.
   */
  createTask: async function(workspace_id, task) {
    const retrieved = await this.__request(
      'POST',
      '/workspaces/' + workspace_id + '/tasks',
      task
    );

    return this._processResponse(retrieved);
  },

  /**
   * Makes an Asana API request to complete a task in the system.
   *
   * @param task {dict} Task fields.
   * @param callback {Function(response)} Callback on success.
   */
  modifyTask: async function(task_id, task) {
    const retrieved = await this.__request(
      'PUT',
      '/tasks/' + task_id + '',
      task
    );

    return this._processResponse(retrieved);
  },

  /**
   * Requests user type-ahead completions for a query.
   */
  userTypeahead: async function(workspace_id, query) {
    const retrieved = await this.__request(
      'GET',
      '/workspaces/' + workspace_id + '/typeahead',
      {
        type: 'user',
        query: query,
        count: 10,
        opt_fields: 'name,photo.image_60x60'
      },
      {
        miss_cache: true // Always skip the cache.
      }
    );

    // callback(retrieved, function(users) {
    //         users.forEach(function(user) {
    //           this._updateUser(workspace_id, user);
    //         });
    //         callback(users);
    //       }, errback);
    return this._processResponse(retrieved);
  },

  logEvent: async function(event) {
    await this.__request('POST', '/logs', event);
  },

  _processResponse: function(response) {
    // console.log( "_processResponse method has been entered." );
    if (response === undefined || response.errors) {
      console.log('### ServerManager: ERROR on _processResponse');
    }
    return response;
  }
};
