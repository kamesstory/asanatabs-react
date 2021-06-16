/** @jsx jsx */
import 'chrome-extension-async';
import { App } from './App';
import { jsx } from '@emotion/core';
import ReactDOM from 'react-dom';
import './style.css';
import * as Asana from './background-scripts/asana';

/*
 * TODO: need to set assignee_status
 * TODO: rerenders on background update
 * TODO: let the user know if they are not logged into Asana / have cookies enabled!
 * TODO: actually build out a "no login, no saved storage" use case
 *  set default values for tasks, workspaces, workspaceColors
 * TODO: allow for offline!
 */
export type ChangeType = 'markdone';
let me: any;

const main = async () => {
  chrome.storage.local.clear();

  ReactDOM.render(<App />, document.getElementById('root'));

  me = await Asana.me();
  chrome.storage.local.set({ [Asana.ME_INFO]: me });
};

main();
