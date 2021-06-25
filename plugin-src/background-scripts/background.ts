import 'chrome-extension-async';
import randomColor from 'randomcolor';
import {
  createTask,
  getAllFromStorage,
  saveTasksToStorage,
  saveWorkspaceColorsToStorage,
  saveWorkspacesToStorage,
  TaskWithWorkspace,
  update,
  updateTask,
} from '../asana';
import { Workspace } from './serverManager';
import debounce from 'lodash.debounce';
import { FromNewTabMessage, ToNewTabMessage } from '../messages';

// Do we have to do a read-write lock now?
// Or batched updates? Thoughts for later.
let tasks: TaskWithWorkspace[];
let workspaces: Workspace[];
let workspaceColors: Record<string, string>;

const getEmitter = (port: chrome.runtime.Port) => {
  if (port.name !== 'asanatabs') return;

  const emitToNewTab = (message: ToNewTabMessage) => {
    port.postMessage(message);
  };

  const emitUpdatedItems = (isLocal?: boolean) =>
    emitToNewTab({
      type: 'updateAll',
      isLocal,
      tasks,
      workspaces,
      workspaceColors,
    });

  return { emitToNewTab, emitUpdatedItems };
};

// TODO: pull from Asana after createTask and updateTask return

const getUpdatesFromAsana = async () => {
  const [updatedTasks, updatedWorkspaces] = await update();

  if (updatedTasks && updatedWorkspaces) {
    const updatedWorkspaceColors: Record<string, string> =
      updatedWorkspaces.reduce(
        (colorsMap, workspace) => ({
          ...colorsMap,
          [workspace.gid]:
            workspaceColors[workspace.gid] ??
            randomColor({
              seed: workspace.gid,
            }),
        }),
        {}
      );
    tasks = updatedTasks;
    workspaces = updatedWorkspaces;
    workspaceColors = updatedWorkspaceColors;

    await Promise.all([
      saveTasksToStorage(tasks),
      saveWorkspacesToStorage(workspaces),
      saveWorkspaceColorsToStorage(workspaceColors),
    ]);
  }
};

// TODO: need to debounce updates that are pushed to Asana
// TODO: debounce pullAllTasks

chrome.runtime.onConnect.addListener(async (port) => {
  const emitter = getEmitter(port);
  if (!emitter) return;

  const { emitToNewTab, emitUpdatedItems } = emitter;

  const getUpdatesFromAsanaAndEmit = async () => {
    try {
      await getUpdatesFromAsana();
      emitUpdatedItems();
    } catch (e) {
      emitToNewTab({ type: 'pullFailed' });
    }
  };

  port.onMessage.addListener(async (message) => {
    const msg = message as FromNewTabMessage;

    if (msg.type === 'pullFromAsana') {
      await getUpdatesFromAsanaAndEmit();
    } else if (msg.type === 'createTask') {
      await createTask(msg.workspaceId, msg.task);
    } else if (msg.type === 'updateTask') {
      await updateTask(msg.taskChangedId, msg.changeMade);
    }
  });

  const [localTasks, localWorkspaces, localColors] = await getAllFromStorage();
  tasks = localTasks;
  workspaces = localWorkspaces;
  workspaceColors = localColors;

  emitUpdatedItems(true);
  await getUpdatesFromAsanaAndEmit();
});

getUpdatesFromAsana();
setInterval(getUpdatesFromAsana, 60 * 1000);

chrome.runtime.setUninstallURL('https://jasonwa.ng/asanatabs/');
