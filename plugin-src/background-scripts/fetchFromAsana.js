import 'chrome-extension-async';
import { ServerManager } from './server_mngr.js';

const GET_WORKSPACE_KEY = workspace_id => 'workspace_' + workspace_id;
export const ALL_TASKS_KEY = 'all_tasks';
export const ALL_WORKSPACES_KEY = 'all_workspaces';
export const WORKSPACE_COLORS_KEY = 'all_workspace_colors';
export const ME_INFO = 'me_info';

export const checkLogin = async () => {
  let [connected, loggedIn] = await Promise.all([
    ServerManager.ping(),
    ServerManager.isLoggedIn()
  ]);
  if (!loggedIn)
    console.log('### Background: not logged in according to cookies!');
  return !connected || loggedIn;
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
  chrome.storage.local.set({ [ALL_WORKSPACES_KEY]: workspaces });

  const getAndSaveTasks = async workspace => {
    const { id: wid, name: wname } = workspace;
    let options = ['due_on', 'name'];
    const tasksForWorkspace = await ServerManager.tasks(wid, options);
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

  chrome.storage.local.set({ [ALL_TASKS_KEY]: tasks.flat() });

  console.log(
    '### Background: all the tasks retrieved, flattened!',
    tasks.flat()
  );

  return [tasks, workspaces];
};

export const updateTask = async (taskChangedID, changeMade) => {
  const loggedIn = await checkLogin();
  // TODO: make the error available to users!
  if (!loggedIn) return;
  const modifiedTask = await ServerManager.modifyTask(
    taskChangedID,
    changeMade
  );
  return modifiedTask;
};

export const createTask = async (workspace_id, task) => {
  const loggedIn = await checkLogin();
  if (!loggedIn) return;
  console.log('### AsanaFetcher: workspace ID is ', workspace_id);
  const createdTask = await ServerManager.createTask(workspace_id, task);
  update();

  return createdTask;
};

export const retrieveMe = async () => {
  const loggedIn = await checkLogin();
  if (!loggedIn) return;
  const me = await ServerManager.me();
  return me;
};
