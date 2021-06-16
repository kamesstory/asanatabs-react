/** @jsx jsx */
import 'chrome-extension-async';
import { App } from './App';
import { jsx } from '@emotion/core';
import ReactDOM from 'react-dom';
import './style.css';
import * as AsanaFetcher from './background-scripts/asana';
import randomColor from 'randomcolor';
import { format as dateFormat } from 'date-fns';
import { Workspace } from './background-scripts/serverManager';
import { TaskWithWorkspace } from './background-scripts/asana';

/*
 * TODO: need to set assignee_status
 * TODO: rerenders on background update
 * TODO: let the user know if they are not logged into Asana / have cookies enabled!
 * TODO: actually build out a "no login, no saved storage" use case
 *  set default values for tasks, workspaces, workspaceColors
 * TODO: allow for offline!
 */
export type ChangeType = 'markdone';

const main = async () => {
  chrome.storage.local.clear();

  let tasks: TaskWithWorkspace[] = [],
    workspaces: Workspace[] = [],
    workspaceColors: Record<string, any> = {};
  let onTaskChanged: (
    changeType: ChangeType,
    taskChangedId: string,
    changesMade: object
  ) => void;
  let onTaskCreated: (
    description: string,
    startDate: Date,
    dueDate: Date,
    workspace: Workspace
  ) => void;
  let isOnline = false;
  let me: any;

  const retrieveMe = async () => {
    me = await AsanaFetcher.retrieveMe();
    chrome.storage.local.set({ [AsanaFetcher.ME_INFO]: me });
  };

  const renderApp = () => {
    ReactDOM.render(
      <App
        workspaces={workspaces}
        tasks={tasks}
        workspaceColors={workspaceColors}
        onTaskChanged={onTaskChanged}
        onTaskCreated={onTaskCreated}
        isOnline={isOnline}
      />,
      document.getElementById('root')
    );
  };

  // ----------------------------------------------------
  // CALLBACKS
  // ----------------------------------------------------

  onTaskChanged = async (changeType, taskChangedId, changeMade) => {
    tasks = tasks.map((t) =>
      t.id === taskChangedId || t.gid === taskChangedId
        ? { ...t, ...changeMade }
        : t
    );
    switch (changeType) {
      case 'markdone': {
        AsanaFetcher.updateTask(taskChangedId, changeMade);
        chrome.storage.local.set({ [AsanaFetcher.ALL_TASKS_KEY]: tasks });
        return;
      }
      default: {
        throw new Error(`Change of type ${changeType} is not implemented.`);
      }
    }
    renderApp();
  };

  onTaskCreated = async (description, startDate, dueDate, workspace) => {
    // TODO: need to incorporate startDate
    const task = {
      name: description,
      due_on: dateFormat(dueDate, 'YYYY-MM-DD'),
      assignee: 'me',
    };
    AsanaFetcher.createTask(workspace.gid, task);

    const fake_id = +new Date();
    const fake_gid = fake_id.toString(36);

    // TODO: can migrate to offline fake_id-based model that has queue of changes
    //  but requires full diff strategy
    tasks.push({
      ...task,
      resource_type: 'task',
      workspace: workspace.gid,
      workspace_name: workspace.name,
      gid: fake_gid,
      id: fake_id,
    });

    // Now re-render
    renderApp();
  };

  // ----------------------------------------------------
  // MAIN RENDER APPS
  // ----------------------------------------------------

  // Initial render (just to get the background up and running)
  // renderApp();

  // Request storage locally
  let [localTasks, localWorkspaces, localColors] = await Promise.all([
    chrome.storage.local.get([AsanaFetcher.ALL_TASKS_KEY]),
    chrome.storage.local.get([AsanaFetcher.ALL_WORKSPACES_KEY]),
    chrome.storage.local.get([AsanaFetcher.WORKSPACE_COLORS_KEY]),
  ]);

  if (
    AsanaFetcher.ALL_TASKS_KEY in localTasks &&
    AsanaFetcher.ALL_WORKSPACES_KEY in localWorkspaces &&
    AsanaFetcher.WORKSPACE_COLORS_KEY in localColors
  ) {
    tasks = localTasks[AsanaFetcher.ALL_TASKS_KEY];
    workspaces = localWorkspaces[AsanaFetcher.ALL_WORKSPACES_KEY];
    workspaceColors = localColors[AsanaFetcher.WORKSPACE_COLORS_KEY];
  }
  renderApp();

  // Request updates from Asana and re-render
  const [updatedTasks, updatedWorkspaces] = await AsanaFetcher.update();
  if (updatedTasks && updatedWorkspaces) {
    isOnline = true;
    tasks = updatedTasks;
    workspaces = updatedWorkspaces;

    workspaceColors = updatedWorkspaces.reduce(
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
    chrome.storage.local.set({
      [AsanaFetcher.WORKSPACE_COLORS_KEY]: workspaceColors,
    });

    renderApp();
  }

  // ----------------------------------------------------
  // SECONDARY FUNCTIONS AFTER MAIN RENDERS
  // ----------------------------------------------------

  retrieveMe();
};

main();
