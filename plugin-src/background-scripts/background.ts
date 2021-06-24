import 'chrome-extension-async';
import { getAllFromStorage, TaskWithWorkspace, update } from '../asana';
import { Workspace } from './serverManager';

export type GetAllFromStorageMessage = {
  type: 'getAllFromStorage';
};

export type FromNewTabMessage = GetAllFromStorageMessage;

export type SendAllFromStorageMessage = {
  type: 'sendAllFromStorage';
  tasks: TaskWithWorkspace[];
  workspaces: Workspace[];
  workspaceColors: Record<string, string>;
};

export type ToNewTabMessage = SendAllFromStorageMessage;

const getEmitter = (port: chrome.runtime.Port) => {
  if (port.name !== 'asanatabs') return;

  const emitToNewTab = (message: ToNewTabMessage) => {
    port.postMessage(message);
  };

  return emitToNewTab;
};

chrome.runtime.onConnect.addListener(async (port) => {
  const emitToNewTab = getEmitter(port);
  if (!emitToNewTab) return;

  port.onMessage.addListener(async (message) => {
    const msg = message as FromNewTabMessage;

    if (msg.type === 'getAllFromStorage') {
      const [localTasks, localWorkspaces, localColors] =
        await getAllFromStorage();

      emitToNewTab({
        type: 'sendAllFromStorage',
        tasks: localTasks,
        workspaces: localWorkspaces,
        workspaceColors: localColors,
      });
    }
  });
});

update();
setInterval(update, 60 * 1000);

chrome.runtime.setUninstallURL('https://jasonwa.ng/asanatabs/');
