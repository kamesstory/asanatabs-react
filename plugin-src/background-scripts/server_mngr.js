import { Options } from './options.js';

/**
 * Library of functions for the "server" portion of an extension, which is
 * loaded into the background and popup pages.
 *
 * Some of these functions are asynchronous, because they may have to talk
 * to the Asana API to get results.
 */
export const ServerManager = {
  // Make requests to API to refresh cache at this interval.
  CACHE_REFRESH_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes

  API_Version: '1.0',

  ASANA_BRIDGE_BASE_URL: Options.loginUrl('') + 'api/' + '1.0',

  _url_to_cached_image: {},

  /**
   * Called by the model whenever a request is made and error occurs.
   * Override to handle in a context-appropriate way. Some requests may
   * also take an `errback` parameter which will handle errors with
   * that particular request.
   *
   * @param response {dict} Response from the server.
   */
  onError: function(response) {},

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
    return await chrome.cookies.get({
      url: this.ASANA_BRIDGE_BASE_URL,
      name: 'ticket'
    });
  },

  /**
   * Get the URL of a task given some of its data.
   *
   * @param task {dict}
   * @param callback {Function(url)}
   */
  taskViewUrl: function(task, callback) {
    // We don't know what pot to view it in so we just use the task ID
    // and Asana will choose a suitable default.
    var options = Options.loadOptions();
    var pot_id = task.id;
    var url =
      'https://' + options.asana_host_port + '/0/' + pot_id + '/' + task.id;
    callback(url);
  },

  __request: function(http_method, path, params, options) {
    return chrome.runtime.sendMessage(
      {
        type: 'api',
        method: http_method,
        path: path,
        params: params,
        options: options || {}
      },
      arg => {
        console.log('arg', arg);
        console.log('lasterror', chrome.runtime.lastError);
      }
    );
  },

  /**
   * Requests the set of workspaces the logged-in user is in.
   *
   * @param callback {Function(workspaces)} Callback on success.
   *     workspaces {dict[]}
   */
  workspaces: async function(options) {
    const retrieved = await this.__request('GET', '/workspaces', {}, options);
    console.log('retrieved', retrieved);
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

  /**
   * All the users that have been seen so far, keyed by workspace and user.
   */
  _known_users: {},

  _updateUser: function(workspace_id, user) {
    this._known_users[workspace_id] = this._known_users[workspace_id] || {};
    this._known_users[workspace_id][user.id] = user;
    this._cacheUserPhoto(user);
  },

  _processResponse: function(response) {
    // console.log( "_processResponse method has been entered." );
    if (response === undefined || response.errors) {
      console.log('### ServerManager: ERROR on _processResponse');
    }
    return response;
  },

  _cacheUserPhoto: function(user) {
    var me = this;
    if (user.photo) {
      var url = user.photo.image_60x60;
      if (!(url in me._url_to_cached_image)) {
        var image = new Image();
        image.src = url;
        me._url_to_cached_image[url] = image;
      }
    }
  },

  /**
   * Start fetching all the data needed by the extension so it is available
   * whenever a popup is opened.
   */
  startPrimingCache: function() {
    var me = this;
    me._cache_refresh_interval = setInterval(function() {
      me.refreshCache();
    }, me.CACHE_REFRESH_INTERVAL_MS);
    me.refreshCache();
  },

  refreshCache: function() {
    var me = this;
    // Fetch logged-in user.
    // TODO: figure it out
    me.me(
      function(user) {
        if (!user.errors) {
          // Fetch list of workspaces.
          me.workspaces(function(workspaces) {}, null, {
            miss_cache: true
          });
        }
      },
      null,
      { miss_cache: true }
    );
  }
};
