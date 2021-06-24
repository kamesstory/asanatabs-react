import 'chrome-extension-async';
import randomColor from 'randomcolor';
import {
  getAllFromStorage,
  saveTasksToStorage,
  saveWorkspaceColorsToStorage,
  saveWorkspacesToStorage,
  TaskWithWorkspace,
  update,
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

// TODO: need to debounce updates that are pushed to Asana
// TODO: debounce pullAllTasks

chrome.runtime.onConnect.addListener(async (port) => {
  const emitter = getEmitter(port);
  if (!emitter) return;

  const { emitToNewTab, emitUpdatedItems } = emitter;

  port.onMessage.addListener(async (message) => {
    const msg = message as FromNewTabMessage;

    if (msg.type === 'pullFromAsana') {
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

        emitUpdatedItems();

        await Promise.all([
          saveTasksToStorage(tasks),
          saveWorkspacesToStorage(workspaces),
          saveWorkspaceColorsToStorage(workspaceColors),
        ]);
      }
    }
  });

  const [localTasks, localWorkspaces, localColors] = await getAllFromStorage();
  tasks = localTasks;
  workspaces = localWorkspaces;
  workspaceColors = localColors;

  emitUpdatedItems(true);
});

update();
setInterval(update, 60 * 1000);

chrome.runtime.setUninstallURL('https://jasonwa.ng/asanatabs/');
