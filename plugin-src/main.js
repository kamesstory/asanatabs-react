import 'chrome-extension-async';
import { App } from './app.js';
import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import * as AsanaFetcher from './background-scripts/fetchFromAsana.js';
import { randomColor } from 'randomcolor';
import { format as dateFormat } from 'date-fns';

// re-renders on background update
// refetches on task update
// TODO: need to set assignee_status
const main = async () => {
  // console.log('Editing on: 1/24/2020');
  // chrome.storage.local.clear();

  // TODO: let the user know if they are not logged into Asana / have cookies enabled!
  // TODO: actually build out a "no login, no saved storage" use case
  //  set default values for tasks, workspaces, workspaceColors
  let tasks = [],
    workspaces = [],
    workspaceColors = [];
  let onChange;
  let onCreateTask;
  let isOnline = true;
  let [me, localTasks, localWorkspaces, localColors] = await Promise.all([
    chrome.storage.local.get([AsanaFetcher.ME_INFO]),
    chrome.storage.local.get([AsanaFetcher.ALL_TASKS_KEY]),
    chrome.storage.local.get([AsanaFetcher.ALL_WORKSPACES_KEY]),
    chrome.storage.local.get([AsanaFetcher.WORKSPACE_COLORS_KEY])
  ]);

  // TODO: figure out how to best architect this
  const retrieveMe = async () => {
    me = await AsanaFetcher.retrieveMe();
    chrome.storage.local.set({ [AsanaFetcher.ME_INFO]: me });
    console.log('### Main: me is ', me);
  };

  const renderApp = () => {
    console.log('Rendering app with', workspaces, tasks, workspaceColors);
    ReactDOM.render(
      <App
        workspaces={workspaces}
        tasks={tasks}
        workspaceColors={workspaceColors}
        refetch={onChange}
        createTask={onCreateTask}
        isOnline={isOnline}
      />,
      document.getElementById('root')
    );
  };

  // ----------------------------------------------------
  // CALLBACKS
  // ----------------------------------------------------

  onChange = async (changeType, taskChangedID, changeMade) => {
    tasks = tasks.map(t =>
      t.id === taskChangedID || t.gid === taskChangedID
        ? { ...t, ...changeMade }
        : t
    );
    console.log(
      '### onChange: called with task ID ' + taskChangedID,
      changeMade
    );
    switch (changeType) {
      case 'markdone': {
        AsanaFetcher.updateTask(taskChangedID, changeMade);
        // TODO: need to propogate that change to localStorage
        chrome.storage.local.set({ [AsanaFetcher.ALL_TASKS_KEY]: tasks });
      }
    }
    renderApp();
  };

  onCreateTask = async (description, startDate, dueDate, workspace) => {
    // TODO: need to incorporate startDate! might need custom server implementation!
    console.log('### Main: description is ', description);
    console.log('### Main: startDate is ', startDate);
    console.log('### Main: dueDate is ', dueDate);
    console.log('### Main: workspace is ', workspace);

    const task = {
      name: description,
      due_on: dateFormat(dueDate, 'YYYY-MM-DD'),
      assignee: 'me'
    };
    AsanaFetcher.createTask(workspace.gid, task);

    // TODO: add tasks to the list! bigger problem because of waiting for createTask
    //  to update
    // TODO: check for how to manage "fake_id" state
    const fake_id = +new Date();
    const fake_gid = fake_id.toString(36);

    // TODO: can migrate to offline fake_id-based model that has queue of changes
    //  then we also need full diff strategy
    tasks.push({
      ...task,
      workspace: workspace.gid,
      workspace_name: workspace.name,
      gid: fake_gid,
      id: fake_id
    });

    // Now re-render
    renderApp();
  };

  // ----------------------------------------------------
  // MAIN RENDER APPS
  // ----------------------------------------------------

  if (
    AsanaFetcher.ALL_TASKS_KEY in localTasks &&
    AsanaFetcher.ALL_WORKSPACES_KEY in localWorkspaces &&
    AsanaFetcher.WORKSPACE_COLORS_KEY in localColors
  ) {
    tasks = localTasks[AsanaFetcher.ALL_TASKS_KEY];
    workspaces = localWorkspaces[AsanaFetcher.ALL_WORKSPACES_KEY];
    workspaceColors = localColors[AsanaFetcher.WORKSPACE_COLORS_KEY];

    console.log(
      '### Main: workspaces and tasks retrieved from local storage!',
      tasks,
      workspaces,
      workspaceColors
    );
  }

  renderApp();

  // then immediate request from asana
  const [updatedTasks, updatedWorkspaces] = await AsanaFetcher.update();
  console.log(
    '### Main: workspaces and tasks retrieved from update!',
    updatedTasks.flat(),
    updatedWorkspaces
  );
  if (updatedTasks && updatedWorkspaces) {
    tasks = updatedTasks.flat();
    workspaces = updatedWorkspaces;
  }

  workspaceColors = updatedWorkspaces.reduce(
    (colorsMap, workspace) => ({
      ...colorsMap,
      [workspace.name]:
        workspaceColors && workspaceColors[workspace.name]
          ? workspaceColors[workspace.name]
          : randomColor({
              seed: workspace.gid
            })
    }),
    {}
  );
  chrome.storage.local.set({
    [AsanaFetcher.WORKSPACE_COLORS_KEY]: workspaceColors
  });

  console.log('### Main: workspace colors are ', workspaceColors);

  // then render update
  renderApp();

  // ----------------------------------------------------
  // SECONDARY FUNCTIONS AFTER MAIN RENDERS
  // ----------------------------------------------------

  retrieveMe();
};

main();
