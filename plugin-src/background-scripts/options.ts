/**
 * Module to load/save options to preferences. Options are represented
 * as a dictionary with the following fields:
 *
 *     asana_host_port {String} host and (optional) port of the asana
 *         server to connect to.
 *     default_workspace_id {Integer} ID of the workspace that tasks should
 *         go into by default. The user will be allowed to choose a
 *         different option when adding a task. This is 0 if no default
 *         workspace is selected.
 *
 * They are stored off in browser local storage for the extension as a
 * single serialized string, read/written all-or-nothing.
 */
type Options = {
  asana_host_port?: string;
  default_workspace_id?: number;
};

export const Options = {
  /**
   * @param opt_options {dict} Options to use; if unspecified will be loaded.
   * @return {String} The URL for the login page.
   */
  loginUrl: function (options?: Options) {
    return (
      'https://' + (options ?? Options.loadOptions()).asana_host_port + '/'
    );
  },

  /**
   * @param opt_options {dict} Options to use; if unspecified will be loaded.
   * @return {String} The URL for the signup page.
   */
  signupUrl: function () {
    return 'http://asana.com/?utm_source=chrome&utm_medium=ext&utm_campaign=ext';
  },

  /**
   * @return {dict} Default options.
   */
  defaultOptions: function (): Options {
    return {
      asana_host_port: 'app.asana.com',
      default_workspace_id: 0,
    };
  },

  /**
   * Load the user's preferences synchronously from local storage.
   *
   * @return {dict} The user's stored options
   */
  loadOptions: function () {
    const options_json = localStorage.options;
    let options: Options;
    if (!options_json) {
      options = this.defaultOptions();
      localStorage.options = JSON.stringify(options);
      return options;
    } else {
      options = JSON.parse(options_json);
      return options;
    }
  },

  /**
   * Save the user's preferences synchronously to local storage.
   * Overwrites all options.
   *
   * @param options {dict} The user's options.
   */
  saveOptions: function (options: Options) {
    localStorage.options = JSON.stringify(options);
  },

  /**
   * Reset the user's preferences to the defaults.
   */
  resetOptions: function () {
    delete localStorage.options;
    this.loadOptions();
  },
};
