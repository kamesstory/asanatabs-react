import 'chrome-extension-async';
import { App } from './app.js';
import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import * as AsanaFetcher from './background-scripts/fetchFromAsana.js';
import { randomColor } from 'randomcolor';

// re-renders on background update
// refetches on task update

// yo im gonna start a connection to the background
const main = async () => {
  // chrome.storage.local.clear();

  // TODO: let the user know if they are not logged into Asana / have cookies enabled!
  // immediately pull storage
  let tasks, workspaces, workspaceColors;
  let [localTasks, localWorkspaces, localColors] = await Promise.all([
    chrome.storage.local.get([AsanaFetcher.ALL_TASKS_KEY]),
    chrome.storage.local.get([AsanaFetcher.ALL_WORKSPACES_KEY]),
    chrome.storage.local.get([AsanaFetcher.WORKSPACE_COLORS_KEY])
  ]);

  const renderApp = () =>
    ReactDOM.render(
      <App
        workspaces={workspaces}
        tasks={tasks}
        workspaceColors={workspaceColors}
      />,
      document.getElementById('root')
    );

  console.log(
    '### Main: workspaces and tasks retrieved from local storage!',
    localTasks,
    localWorkspaces,
    localColors
  );

  // callbacks and render
  // lexical scoping up there
  const refetchTasksAndUpdate = task => {
    renderApp(
      updatedTasks.flat(),
      updatedWorkspaces,
      updatedColors,
      refetchTasksAndUpdate
    );
  };

  if (
    AsanaFetcher.ALL_TASKS_KEY in localTasks &&
    AsanaFetcher.ALL_WORKSPACES_KEY in localWorkspaces &&
    AsanaFetcher.WORKSPACE_COLORS_KEY in localColors
  ) {
    tasks = localTasks[AsanaFetcher.ALL_TASKS_KEY];
    workspaces = localWorkspaces[AsanaFetcher.ALL_WORKSPACES_KEY];
    workspaceColors = localColors[AsanaFetcher.WORKSPACE_COLORS_KEY];
    renderApp();
  }

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
      [workspace.name]: workspaceColors[workspace.name]
        ? workspaceColors[workspace.name]
        : randomColor({
            seed: workspace.id
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
};

main();
