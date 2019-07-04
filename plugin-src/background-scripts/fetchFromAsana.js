import 'chrome-extension-async';
import { ServerManager } from './server_mngr.js';

const GET_WORKSPACE_KEY = workspace_id => 'workspace_' + workspace_id;
export const TASKS_KEY = 'all_tasks';
export const WORKSPACES_KEY = 'all_workspaces';

const checkLogin = async () => {
  const loggedIn = await ServerManager.isLoggedIn();
  if (!loggedIn) console.log('### Background: not logged in!');
  return loggedIn;
};

export const update = async () => {
  console.log('### Background: this is version 1');

  const loggedIn = await checkLogin();
  if (!loggedIn) return;

  const workspaces = await ServerManager.workspaces();
  if (!workspaces) {
    console.log('### Background: no workspaces!');
    return;
  }
  chrome.storage.local.set({ [WORKSPACES_KEY]: workspaces });

  chrome.storage.local.get(['key'], function(result) {
    console.log('Value currently is ' + result.key);
  });

  const getAndSaveTasks = async workspace => {
    const { id: wid, name: wname } = workspace;
    const tasksForWorkspace = await ServerManager.tasks(wid);
    if (!tasksForWorkspace) {
      console.log('### Background: no tasks for workspace ' + wname);
      return;
    }
    chrome.storage.local.set({ [GET_WORKSPACE_KEY(wid)]: tasksForWorkspace });
    return tasksForWorkspace.map(task => ({
      ...task,
      workspace: wid,
      workspace_name: wname
    }));
  };

  const tasks = await Promise.all(
    workspaces.map(workspace => getAndSaveTasks(workspace))
  );

  chrome.storage.local.set({ [TASKS_KEY]: tasks.flat() });

  console.log(
    '### Background: all the tasks retrieved, flattened!',
    tasks.flat()
  );

  return tasks;
};
