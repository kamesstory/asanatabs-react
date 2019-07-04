import 'chrome-extension-async';
import { ServerManager } from './server_mngr.js';

const GET_WORKSPACE_KEY = workspace_id => 'workspace_' + workspace_id;

const checkLogin = async () => {
  const loggedIn = await ServerManager.isLoggedIn();
  if (!loggedIn) console.log('### Background: not logged in!');
  return loggedIn;
};

const update = async () => {
  console.log('### Background: this is version 1');

  const loggedIn = await checkLogin();
  if (!loggedIn) return;

  const workspaces = await ServerManager.workspaces();
  if (!workspaces) {
    console.log('### Background: no workspaces!');
    return;
  }
  chrome.storage.local.set({ workspaces: workspaces });

  chrome.storage.local.get(['key'], function(result) {
    console.log('Value currently is ' + result.key);
  });

  const getAndSaveTasks = async workspace => {
    const wid = workspace['id'];
    const wname = workspace['name'];
    const tasksForWorkspace = await ServerManager.tasks(wid);
    if (!tasksForWorkspace) {
      console.log('### Background: no tasks for workspace ' + wname);
      return;
    }
    chrome.storage.local.set({ [GET_WORKSPACE_KEY(wid)]: tasksForWorkspace });
    return tasksForWorkspace.map(task => {
      task['workspace'] = wid;
      task['workspace_name'] = wname;
      return task;
    });
  };

  const tasks = await Promise.all(
    workspaces.map(workspace => getAndSaveTasks(workspace))
  );

  chrome.storage.local.set({ tasks: tasks.flat() });

  console.log(
    '### Background: all the tasks retrieved, flattened!',
    tasks.flat()
  );
};

update();
setInterval(update, 60 * 1000);
