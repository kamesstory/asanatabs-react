import 'chrome-extension-async';
import { App } from './app.js';
import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import * as AsanaFetcher from './background-scripts/fetchFromAsana.js';

// re-renders on background update
// refetches on task update

// yo im gonna start a connection to the background
const main = async () => {
  // TODO: let the user know if they are not logged into Asana / have cookies enabled!
  // immediately pull storage
  const [localTasks, localWorkspaces] = await Promise.all([
    chrome.storage.local.get([AsanaFetcher.TASKS_KEY]),
    chrome.storage.local.get([AsanaFetcher.WORKSPACES_KEY])
  ]);
  const renderApp = (tasks, workspaces) =>
    ReactDOM.render(
      <App inputWorkspaces={workspaces} inputTasks={tasks} />,
      document.getElementById('root')
    );

  console.log(
    '### Main: workspaces and tasks retrieved from local storage! ',
    localTasks,
    localWorkspaces
  );
  renderApp(
    localTasks[AsanaFetcher.TASKS_KEY],
    localWorkspaces[AsanaFetcher.WORKSPACES_KEY]
  );

  // then immediate request from asana
  const [updatedTasks, updatedWorkspaces] = await AsanaFetcher.update();
  console.log(
    '### Main: workspaces and tasks retrieved from update! ',
    updatedTasks.flat(),
    updatedWorkspaces
  );

  // then render update
  renderApp(updatedTasks.flat(), updatedWorkspaces);
};

main();
