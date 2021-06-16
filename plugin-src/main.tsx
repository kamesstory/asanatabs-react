/** @jsx jsx */
import 'chrome-extension-async';
import { App } from './App';
import { jsx } from '@emotion/core';
import ReactDOM from 'react-dom';
import './style.css';
import * as Asana from './background-scripts/asana';
import randomColor from 'randomcolor';
import { format } from 'date-fns';
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

let tasks: TaskWithWorkspace[] = [],
  workspaces: Workspace[] = [],
  workspaceColors: Record<string, string> = {},
  isOnline = false,
  me: any;

const main = async () => {
  chrome.storage.local.clear();

  const onTaskChanged = async (
    changeType: ChangeType,
    taskChangedId: string,
    changeMade: object
  ) => {
    tasks = tasks.map((t) =>
      t.id === taskChangedId || t.gid === taskChangedId
        ? { ...t, ...changeMade }
        : t
    );
    switch (changeType) {
      case 'markdone': {
        Asana.updateTask(taskChangedId, changeMade);
        chrome.storage.local.set({ [Asana.ALL_TASKS_KEY]: tasks });
        break;
      }
      default: {
        throw new Error(`Change of type ${changeType} is not implemented.`);
      }
    }
    renderApp();
  };

  const onTaskCreated = async (
    description: string,
    startDate: Date,
    dueDate: Date,
    workspace: Workspace
  ) => {
    // TODO: need to incorporate startDate
    const task = {
      name: description,
      due_on: format(dueDate, 'YYYY-MM-DD'),
      assignee: 'me',
    };
    Asana.createTask(workspace.gid, task);

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
  // MAIN RENDER APPS
  // ----------------------------------------------------

  // Initial render (just to get the background up and running)
  // renderApp();

  // Request storage locally
  let [localTasks, localWorkspaces, localColors] = await Promise.all([
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
    tasks = localTasks[Asana.ALL_TASKS_KEY];
    workspaces = localWorkspaces[Asana.ALL_WORKSPACES_KEY];
    workspaceColors = localColors[Asana.WORKSPACE_COLORS_KEY];
  }
  renderApp();

  // Request updates from Asana and re-render
  const [updatedTasks, updatedWorkspaces] = await Asana.update();
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
      [Asana.WORKSPACE_COLORS_KEY]: workspaceColors,
    });

    renderApp();
  }

  me = await Asana.me();
  chrome.storage.local.set({ [Asana.ME_INFO]: me });
};

main();
