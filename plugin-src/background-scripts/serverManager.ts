import { Options } from './options';

export type Workspace = {
  resource_type: 'workspace';
  gid: string;
  name: string;
};

export type Task = {
  resource_type: 'task';
  gid: string;
  name: string;
  id?: string | number;
  workspace?: string;
  workspace_name?: string;
  due_at?: string;
  due_on?: string;
  completed?: boolean;
};

export type Me = {
  resource_type: 'user';
  gid: string;
  name: string;
  email?: string;
};

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

    // Be polite to Asana API and tell them who we are.
    const manifest = chrome.runtime.getManifest();
    const client_name = [
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
        options: { client_name },
      };
    } else {
      // GET/DELETE request, add params as URL parameters.
      const optionsString = options
        ? 'opt_fields=' + options.join(',') + '&'
        : '';
      const urlParams = new URLSearchParams({
        opt_client_name: client_name,
        ...params,
      });
      url += '?' + optionsString + urlParams.toString();
    }

    // Note that any URL fetched here must be matched by a permission in
    // the manifest.json file!
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

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Could not successfully ${formattedRequest} ${url}`);
    }

    const json = await response.json();
    return json.data;
  },

  /**
   * Requests the set of workspaces the logged-in user is in.
   *
   * @param callback {Function(workspaces)} Callback on success.
   *     workspaces {dict[]}
   */
  workspaces: async function (options?: any[]) {
    const retrieved: Workspace[] = await this._request(
      'GET',
      '/workspaces',
      {},
      options
    );
    return retrieved;
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
    };
    const retrieved: Task[] = await this._request(
      'GET',
      '/tasks',
      params,
      options
    );
    return retrieved;
  },

  /**
   * Requests the user record for the logged-in user.
   *
   * @param callback {Function(user)} Callback on success.
   *     user {dict[]}
   */
  me: async function (options?: any[]) {
    const retrieved: Me = await this._request('GET', '/users/me', {}, options);
    return retrieved;
  },

  /**
   * Makes an Asana API request to add a task in the system.
   *
   * @param task {dict} Task fields.
   * @param callback {Function(response)} Callback on success.
   */
  createTask: async function (workspaceId: string, task: object) {
    const retrieved: Task = await this._request(
      'POST',
      '/workspaces/' + workspaceId + '/tasks',
      task
    );
    return retrieved;
  },

  /**
   * Makes an Asana API request to complete a task in the system.
   *
   * @param task {dict} Task fields.
   * @param callback {Function(response)} Callback on success.
   */
  modifyTask: async function (taskChangedId: string, changeMade: object) {
    const retrieved: Task = await this._request(
      'PUT',
      '/tasks/' + taskChangedId + '',
      changeMade
    );
    return retrieved;
  },

  logEvent: async function (event: object) {
    await this._request('POST', '/logs', event);
  },
};
