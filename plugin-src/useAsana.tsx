import { useCallback, useEffect, useState } from 'react';
import { Workspace } from './background-scripts/serverManager';
import * as Asana from './asana';
import randomColor from 'randomcolor';
import React from 'react';

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
    if (
      tasks.length === 0 &&
      workspaces.length === 0 &&
      Object.keys(workspaceColors).length === 0
    ) {
      (async () => {
        const [localTasks, localWorkspaces, localColors] =
          await Asana.getAllFromStorage();

        if (
          localTasks.length > 0 &&
          localWorkspaces.length > 0 &&
          Object.keys(localColors).length > 0
        ) {
          setTasks(localTasks);
          setWorkspaces(localWorkspaces);
          setWorkspaceColors(localColors);
        }

        await pullAllFromAsana();
      })();
    }
  }, [pullAllFromAsana, tasks, workspaceColors, workspaces]);

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
