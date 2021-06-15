import { Options } from './options';

/**
 * Library of functions for the "server" portion of an extension, which is
 * loaded into the background and popup pages.
 *
 * Some of these functions are asynchronous, because they may have to talk
 * to the Asana API to get results.
 */
export const ServerManager = {
  ASANA_BRIDGE_BASE_URL: Options.loginUrl() + 'api/' + '1.0',

  /**
   * Determine if the user is logged in.
   *
   * @param callback {Function(is_logged_in)} Called when request complete.
   *     is_logged_in {Boolean} True iff the user is logged in to Asana.
   */
  isLoggedIn: async function () {
    const cookie = await chrome.cookies.get({
      url: this.ASANA_BRIDGE_BASE_URL,
      name: 'ticket',
    });

    return !!(cookie && cookie.value);
  },

  _request: async function (
    httpMethod: string,
    path: string,
    params: object,
    options?: any[]
  ) {
    const formattedRequest = httpMethod.toUpperCase();

    if (formattedRequest === 'PINGTEST') {
      console.log('### ServerManager: ping test registered!');
      return;
    }

    // Be polite to Asana API and tell them who we are.
    let manifest = chrome.runtime.getManifest();
    let client_name = [
      'chrome-extension',
      chrome.i18n.getMessage('@@extension_id'),
      manifest.version,
      manifest.name,
    ].join(':');

    let url = this.ASANA_BRIDGE_BASE_URL + path;
    let body_data;
    if (formattedRequest === 'PUT' || formattedRequest === 'POST') {
      // POST/PUT request, put params in body
      body_data = {
        data: params,
        options: { client_name: client_name },
      };
    } else {
      // GET/DELETE request, add params as URL parameters.
      let optionsString = !options
        ? 'opt_fields=' + options.join(',') + '&'
        : '';
      let url_params = { opt_client_name: client_name, ...params };
      url +=
        '?' +
        optionsString +
        Object.entries(url_params)
          .map(([key, value]) => key + '=' + value)
          .join('&');
    }

    const cookie = await chrome.cookies.get({
      url: url,
      name: 'ticket',
    });

    if (!cookie) {
      return {
        status: 401,
        error: 'Not Authorized',
      };
    }

    // Note that any URL fetched here must be matched by a permission in
    // the manifest.json file!
    console.log('### ServerManager: fetching with body', body_data);
    const response = await fetch(url, {
      method: formattedRequest,
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Allow-Asana-Client': '1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body_data),
    });
    if (response.status !== 200 && response.status !== 201)
      console.log(
        '### ServerManager: ERROR, response status ' + response.status
      );

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
  workspaces: async function (options: any[]) {
    const retrieved = await this._request('GET', '/workspaces', {}, options);
    return this._processResponse(retrieved);
  },

  /**
   * Requests the set of tasks assigned to the logged-in user from a single workspace
   *
   * @param callback {Function(workspaces)} Callback on success.
   *     workspaces {dict[]}
   */
  tasks: async function (workspaceId: string, options: any[]) {
    const params = {
      assignee: 'me',
      completed_since: 'now',
      limit: 100,
      workspace: workspaceId,
    }; // assignee=me&completed_since=now&limit=100&workspace=[workspace_id]
    const retrieved = await this._request('GET', '/tasks', params, options);

    return this._processResponse(retrieved);
  },

  // /**
  //  * Requests the set of users in a workspace.
  //  *
  //  * @param callback {Function(users)} Callback on success.
  //  *     users {dict[]}
  //  */
  // users: async function (workspaceId: string, options: any[]) {
  //   const retrieved: any[] = await this._request(
  //     'GET',
  //     '/workspaces/' + workspaceId + '/users',
  //     { opt_fields: 'name,photo.image_60x60' },
  //     options
  //   );

  //   retrieved.forEach((user) => this._updateUser(workspaceId, user));
  //   return this._processResponse(retrieved);
  // },

  /**
   * Requests the user record for the logged-in user.
   *
   * @param callback {Function(user)} Callback on success.
   *     user {dict[]}
   */
  me: async function (options: any[]) {
    const retrieved = await this._request('GET', '/users/me', {}, options);

    return this._processResponse(retrieved);
  },

  /**
   * Makes an Asana API request to add a task in the system.
   *
   * @param task {dict} Task fields.
   * @param callback {Function(response)} Callback on success.
   */
  createTask: async function (workspaceId: string, task: object) {
    const retrieved = await this._request(
      'POST',
      '/workspaces/' + workspaceId + '/tasks',
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
  modifyTask: async function (taskChangedId: string, changeMade: object) {
    const retrieved = await this._request(
      'PUT',
      '/tasks/' + taskChangedId + '',
      changeMade
    );

    return this._processResponse(retrieved);
  },

  // /**
  //  * Requests user type-ahead completions for a query.
  //  */
  // userTypeahead: async function (workspaceId: string, query: string) {
  //   const retrieved = await this._request(
  //     'GET',
  //     '/workspaces/' + workspaceId + '/typeahead',
  //     {
  //       type: 'user',
  //       query,
  //       count: 10,
  //       opt_fields: 'name,photo.image_60x60',
  //     },
  //     {
  //       miss_cache: true, // Always skip the cache.
  //     }
  //   );

  //   return this._processResponse(retrieved);
  // },

  logEvent: async function (event: object) {
    await this._request('POST', '/logs', event);
  },

  _processResponse: function (response: any) {
    if (response === undefined || response.errors)
      console.log('### ServerManager: ERROR on _processResponse');
    return response;
  },
};
