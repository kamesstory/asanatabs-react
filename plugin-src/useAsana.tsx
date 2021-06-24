import { useCallback, useEffect, useState } from 'react';
import { Workspace } from './background-scripts/serverManager';
import { TaskWithWorkspace } from './asana';
import React from 'react';
import { FromNewTabMessage, ToNewTabMessage } from './messages';

export type OnlineStatus = 'online' | 'offline' | 'loading';

const port = chrome.runtime.connect({ name: 'asanatabs' });
const emitToBackground = (msg: FromNewTabMessage) => {
  port.postMessage(msg);
};

const useAsana = (): [
  OnlineStatus,
  TaskWithWorkspace[],
  Workspace[],
  Record<string, string>,
  React.Dispatch<React.SetStateAction<TaskWithWorkspace[]>>,
  () => Promise<void>
] => {
  const [tasks, setTasks] = useState<TaskWithWorkspace[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceColors, setWorkspaceColors] = useState<
    Record<string, string>
  >({});
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('loading');

  const pullAllFromAsana = useCallback(async () => {
    emitToBackground({ type: 'pullFromAsana' });
  }, []);

  useEffect(() => {
    const onMessageListener = (message: Object) => {
      const msg = message as ToNewTabMessage;

      if (msg.type === 'updateAll') {
        // TODO: need better state for loading vs offline vs online
        if (!msg.isLocal && onlineStatus === 'loading') {
          setOnlineStatus('online');
        }
        setTasks(msg.tasks);
        setWorkspaces(msg.workspaces);
        setWorkspaceColors(msg.workspaceColors);
      } else if (msg.type === 'pullFailed') {
        if (onlineStatus === 'loading') setOnlineStatus('offline');
      }
    };

    port.onMessage.addListener(onMessageListener);

    return () => {
      port.onMessage.removeListener(onMessageListener);
    };
  }, [onlineStatus]);

  return [
    onlineStatus,
    tasks,
    workspaces,
    workspaceColors,
    setTasks,
    pullAllFromAsana,
  ];
};

export default useAsana;
