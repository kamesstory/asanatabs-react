import 'chrome-extension-async';
import { ServerManager, Task, Workspace } from './serverManager';

const GET_WORKSPACE_KEY = (workspaceId: string) => 'workspace_' + workspaceId;
export const ALL_TASKS_KEY = 'all_tasks';
export const ALL_WORKSPACES_KEY = 'all_workspaces';
export const WORKSPACE_COLORS_KEY = 'all_workspace_colors';
export const ME_INFO = 'me_info';

const checkLogin = async () => {
  const loggedIn = await ServerManager.isLoggedIn();
  return loggedIn;
};

export type TaskWithWorkspace = Task & {
  workspace: string;
  workspace_name: string;
};

export const update = async (): Promise<[TaskWithWorkspace[], Workspace[]]> => {
  const loggedIn = await checkLogin();
  if (!loggedIn) {
    throw new Error('Cannot update since user is not logged in to Asana.');
  }

  const workspaces = await ServerManager.workspaces();
  if (!workspaces) {
    throw new Error('Cannot update since user has no workspaces in Asana.');
  }

  chrome.storage.local.set({ [ALL_WORKSPACES_KEY]: workspaces });

  const getAndSaveTasks = async (workspace: Workspace) => {
    const { gid: wid, name: workspaceName } = workspace;
    const tasksForWorkspace = await ServerManager.tasks(wid, [
      'due_on',
      'name',
    ]);
    if (!tasksForWorkspace) return null;

    chrome.storage.local.set({ [GET_WORKSPACE_KEY(wid)]: tasksForWorkspace });
    return tasksForWorkspace.map<TaskWithWorkspace>((task) => ({
      ...task,
      workspace: wid,
      workspace_name: workspaceName,
    }));
  };

  const tasks = await Promise.all(
    workspaces.map((workspace) => getAndSaveTasks(workspace))
  );
  const filteredTasks = tasks.flatMap((t) => (!t ? [] : t));
  chrome.storage.local.set({ [ALL_TASKS_KEY]: filteredTasks });

  return [filteredTasks, workspaces];
};

export const updateTask = async (taskChangedId: string, changeMade: object) => {
  const loggedIn = await checkLogin();
  // TODO: make the error available (show it) to users!
  if (!loggedIn) return;
  const modifiedTask = await ServerManager.modifyTask(
    taskChangedId,
    changeMade
  );
  return modifiedTask;
};

export const createTask = async (workspaceId: string, task: object) => {
  const loggedIn = await checkLogin();
  if (!loggedIn) return;
  const createdTask = await ServerManager.createTask(workspaceId, task);
  update();

  return createdTask;
};

export const me = async () => {
  const loggedIn = await checkLogin();
  if (!loggedIn) return;
  const me = await ServerManager.me();
  return me;
};
