import 'chrome-extension-async';
import { ServerManager } from './server_mngr.js';

const GET_WORKSPACE_KEY = workspace_id => 'workspace_' + workspace_id;
export const ALL_TASKS_KEY = 'all_tasks';
export const ALL_WORKSPACES_KEY = 'all_workspaces';
export const WORKSPACE_COLORS_KEY = 'all_workspace_colors';
export const ME_INFO = 'me_info';

const checkLogin = async () => {
  const loggedIn = await ServerManager.isLoggedIn();
  if (!loggedIn) console.log('### Background: not logged in!');
  return loggedIn;
};

export const update = async () => {
  const loggedIn = await checkLogin();
  if (!loggedIn) return;

  const workspaces = await ServerManager.workspaces();
  if (!workspaces) {
    console.log('### Background: no workspaces detected! Nothing to update.');
    return;
  }

  chrome.storage.local.set({ [ALL_WORKSPACES_KEY]: workspaces });

  const getAndSaveTasks = async workspace => {
    const { gid: wid, name: wname } = workspace;
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

  console.log(
    '### Background: all tasks and workspaces retrieved and saved to local storage!',
    tasks.flat(),
    workspaces
  );
  chrome.storage.local.set({ [ALL_TASKS_KEY]: tasks.flat() });

  return [tasks, workspaces];
};

export const updateTask = async (taskChangedID, changeMade) => {
  const loggedIn = await checkLogin();
  // TODO: make the error available (show it) to users!
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
