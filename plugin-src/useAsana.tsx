import { useCallback, useEffect, useState } from 'react';
import { Workspace } from './background-scripts/serverManager';
import * as Asana from './background-scripts/asana';
import randomColor from 'randomcolor';
import React from 'react';

const useAsana = (): [
  boolean,
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
  const [isOnline, setIsOnline] = useState(false);

  const pullAllFromAsana = useCallback(async () => {
    // Request updates from Asana and re-render
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
      setIsOnline(true);
      setWorkspaceColors(updatedWorkspaceColors);
      setTasks(updatedTasks);
      setWorkspaces(updatedWorkspaces);

      await Promise.all([
        Asana.saveTasksToStorage(updatedTasks),
        Asana.saveWorkspacesToStorage(updatedWorkspaces),
        Asana.saveWorkspaceColorsToStorage(updatedWorkspaceColors),
      ]);
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
    isOnline,
    tasks,
    workspaces,
    workspaceColors,
    setTasks,
    pullAllFromAsana,
  ];
};

export default useAsana;
