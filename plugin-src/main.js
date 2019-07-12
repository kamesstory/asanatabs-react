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
  chrome.storage.local.clear();

  // TODO: let the user know if they are not logged into Asana / have cookies enabled!
  // immediately pull storage
  const [localTasks, localWorkspaces, workspaceColors] = await Promise.all([
    chrome.storage.local.get([AsanaFetcher.ALL_TASKS_KEY]),
    chrome.storage.local.get([AsanaFetcher.ALL_WORKSPACES_KEY]),
    chrome.storage.local.get([AsanaFetcher.WORKSPACE_COLORS_KEY])
  ]);

  const renderApp = (tasks, workspaces, workspaceColors) =>
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
    workspaceColors
  );
  const aatk = AsanaFetcher.ALL_TASKS_KEY;
  const awk = AsanaFetcher.ALL_WORKSPACES_KEY;
  const wck = AsanaFetcher.WORKSPACE_COLORS_KEY;
  if (aatk in localTasks && awk in localWorkspaces && wck in workspaceColors) {
    renderApp(
      localTasks[AsanaFetcher.ALL_TASKS_KEY],
      localWorkspaces[AsanaFetcher.ALL_WORKSPACES_KEY],
      workspaceColors[AsanaFetcher.WORKSPACE_COLORS_KEY]
    );
  }

  // then immediate request from asana
  const [updatedTasks, updatedWorkspaces] = await AsanaFetcher.update();
  console.log(
    '### Main: workspaces and tasks retrieved from update!',
    updatedTasks.flat(),
    updatedWorkspaces
  );

  console.log('### TEST: randomcolor has generated color ', randomColor());

  const updatedColors = updatedWorkspaces
    .map(workspace => workspace.name)
    .reduce(
      (colorsMap, wsn) => ({
        ...colorsMap,
        [wsn]: workspaceColors[wsn]
          ? workspaceColors[wsn]
          : randomColor({ seed: wsn })
      }),
      {}
    );
  chrome.storage.local.set({
    [AsanaFetcher.WORKSPACE_COLORS_KEY]: updatedColors
  });

  console.log('### MAIN: workspace colors are ', updatedColors);

  // then render update
  renderApp(updatedTasks.flat(), updatedWorkspaces, updatedColors);
};

main();
