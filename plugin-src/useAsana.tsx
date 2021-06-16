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
            [workspace.name]:
              workspaceColors && workspaceColors[workspace.name]
                ? workspaceColors[workspace.name]
                : randomColor({
                    seed: workspace.gid,
                  }),
          }),
          {}
        );
      setIsOnline(true);
      setWorkspaceColors(updatedWorkspaceColors);
      setTasks(updatedTasks);
      setWorkspaces(updatedWorkspaces);

      await chrome.storage.local.set({
        [Asana.ALL_TASKS_KEY]: updatedTasks,
        [Asana.ALL_WORKSPACES_KEY]: updatedWorkspaces,
        [Asana.WORKSPACE_COLORS_KEY]: updatedWorkspaceColors,
      });
    }
  }, [workspaceColors]);

  useEffect(() => {
    if (
      tasks.length === 0 &&
      workspaces.length === 0 &&
      Object.keys(workspaceColors).length === 0
    ) {
      // console.log(
      //   `useEffect triggering without tasks, workspaces, or workspaceColors`
      // );
      (async () => {
        // Request storage locally
        const [localTasks, localWorkspaces, localColors] = await Promise.all([
          chrome.storage.local.get([Asana.ALL_TASKS_KEY]),
          chrome.storage.local.get([Asana.ALL_WORKSPACES_KEY]),
          chrome.storage.local.get([Asana.WORKSPACE_COLORS_KEY]),
        ]);

        // Needs to be done because for some reason localStorage nests it inside
        //  two layers of keys. Why?
        if (
          Asana.ALL_TASKS_KEY in localTasks &&
          Asana.ALL_WORKSPACES_KEY in localWorkspaces &&
          Asana.WORKSPACE_COLORS_KEY in localColors
        ) {
          setTasks(localTasks[Asana.ALL_TASKS_KEY]);
          setWorkspaces(localWorkspaces[Asana.ALL_WORKSPACES_KEY]);
          setWorkspaceColors(localColors[Asana.WORKSPACE_COLORS_KEY]);
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
