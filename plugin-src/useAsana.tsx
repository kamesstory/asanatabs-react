import { useCallback, useEffect, useState } from 'react';
import { Workspace } from './background-scripts/serverManager';
import * as Asana from './asana';
import randomColor from 'randomcolor';
import React from 'react';
import { ToNewTabMessage } from './messages';

export type OnlineStatus = 'online' | 'offline' | 'loading';

const useAsana = (): [
  OnlineStatus,
  Asana.TaskWithWorkspace[],
  Workspace[],
  Record<string, string>,
  React.Dispatch<React.SetStateAction<Asana.TaskWithWorkspace[]>>,
  () => Promise<void>
] => {
  const [tasks, setTasks] = useState<Asana.TaskWithWorkspace[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceColors, setWorkspaceColors] = useState<
    Record<string, string>
  >({});
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('loading');

  const pullAllFromAsana = useCallback(async () => {
    // Request updates from Asana and re-render
    try {
      // TODO: switch to get emitted values from the background
      const [updatedTasks, updatedWorkspaces] = await Asana.update();

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
        setOnlineStatus('online');
        setWorkspaceColors(updatedWorkspaceColors);
        setTasks(updatedTasks);
        setWorkspaces(updatedWorkspaces);

        await Promise.all([
          Asana.saveTasksToStorage(updatedTasks),
          Asana.saveWorkspacesToStorage(updatedWorkspaces),
          Asana.saveWorkspaceColorsToStorage(updatedWorkspaceColors),
        ]);
      }
    } catch (e) {
      setOnlineStatus('offline');
    }
  }, [workspaceColors]);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'asanatabs' });

    const onMessageListener = (message: Object) => {
      const msg = message as ToNewTabMessage;

      if (msg.type === 'updateAll') {
        // TODO: need better state for loading vs offline vs online
        if (!msg.isLocal) {
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
      port.disconnect();
    };
  }, []);

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
