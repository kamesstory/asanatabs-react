/** @jsx jsx */
import 'chrome-extension-async';
import { App } from './App';
import { jsx } from '@emotion/core';
import ReactDOM from 'react-dom';
import './style.css';

/*
 * TODO: need to set assignee_status
 * TODO: rerenders on background update
 * TODO: let the user know if they are not logged into Asana / have cookies enabled!
 * TODO: actually build out a "no login, no saved storage" use case
 *  set default values for tasks, workspaces, workspaceColors
 * TODO: allow for offline!
 * TODO: also think about how to get upcoming to have a user-controlled reminder date to see when to update the task to be worked on!
 * TODO: retrieve workspaces from local storage and only update if parallelized finds workspaces that weren't saved.
 * TODO: add small loader to the bottom of the new tab when loading
 * TODO: display that AsanaTabs is still requesting updates
 * TODO: load in background but don't prevent people from creating new tasks even if offline
 */
// let me: any;

// me = await Asana.me();
// chrome.storage.local.set({ [Asana.ME_INFO]: me });
// chrome.storage.local.clear();

ReactDOM.render(<App />, document.getElementById('root'));
