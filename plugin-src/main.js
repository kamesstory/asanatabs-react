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
  const [tasks, workspaces] = await Promise.all([
    chrome.storage.local.get([AsanaFetcher.TASKS_KEY]),
    chrome.storage.local.get([AsanaFetcher.WORKSPACES_KEY])
  ]);
  const renderApp = () =>
    ReactDOM.render(
      <App
        inputWorkspaces={workspaces[AsanaFetcher.WORKSPACES_KEY]}
        inputTasks={tasks[AsanaFetcher.TASKS_KEY]}
      />,
      document.getElementById('root')
    );

  console.log(
    '### Main: workspaces and tasks retrieved from local storage! ',
    tasks,
    workspaces
  );
  renderApp();

  // then immediate request from asana
  const updatedTasks = await AsanaFetcher.update();

  // then render update
};

main();
