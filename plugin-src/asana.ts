import 'chrome-extension-async';
import {
  ServerManager,
  Task,
  Workspace,
} from './background-scripts/serverManager';

const ALL_TASKS_KEY = 'all_tasks';
const ALL_WORKSPACES_KEY = 'all_workspaces';
const WORKSPACE_COLORS_KEY = 'all_workspace_colors';
// export const ME_INFO = 'me_info';

const checkLogin = async () => {
  const loggedIn = await ServerManager.isLoggedIn();
  return loggedIn;
};

export type TaskWithWorkspace = Task & {
  workspace: string;
  workspace_name: string;
};

export const getAllFromStorage = async (): Promise<
  [TaskWithWorkspace[], Workspace[], Record<string, string>]
> => {
  const [localTasks, localWorkspaces, localColors] = await Promise.all([
    chrome.storage.local.get([ALL_TASKS_KEY]),
    chrome.storage.local.get([ALL_WORKSPACES_KEY]),
    chrome.storage.local.get([WORKSPACE_COLORS_KEY]),
  ]);

  // Needs to be done because for some reason localStorage nests it inside
  //  two layers of keys. Why?
  if (
    ALL_TASKS_KEY in localTasks &&
    ALL_WORKSPACES_KEY in localWorkspaces &&
    WORKSPACE_COLORS_KEY in localColors
  ) {
    const tasks = localTasks[ALL_TASKS_KEY];
    const workspaces = localWorkspaces[ALL_WORKSPACES_KEY];
    const colors = localColors[WORKSPACE_COLORS_KEY];
    return [tasks, workspaces, colors];
  }
  return [[], [], {}];
};

export const saveTasksToStorage = async (tasks: TaskWithWorkspace[]) => {
  await chrome.storage.local.set({ [ALL_TASKS_KEY]: tasks });
};

export const saveWorkspacesToStorage = async (workspaces: Workspace[]) => {
  await chrome.storage.local.set({ [ALL_WORKSPACES_KEY]: workspaces });
};

export const saveWorkspaceColorsToStorage = async (
  workspaceColors: Record<string, string>
) => {
  await chrome.storage.local.set({
    [WORKSPACE_COLORS_KEY]: workspaceColors,
  });
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

  saveWorkspacesToStorage(workspaces);

  const getAndSaveTasks = async (workspace: Workspace) => {
    const { gid: wid, name: workspaceName } = workspace;
    const tasksForWorkspace = await ServerManager.tasks(wid, [
      'due_on',
      'name',
    ]);
    if (!tasksForWorkspace) return null;

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
  saveTasksToStorage(filteredTasks);

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
