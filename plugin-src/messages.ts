import { TaskWithWorkspace } from './asana';
import { Workspace } from './background-scripts/serverManager';

export type PullFromAsanaMessage = {
  type: 'pullFromAsana';
};

export type FromNewTabMessage = PullFromAsanaMessage;

export type UpdateAllMessage = {
  type: 'updateAll';
  isLocal?: boolean;
  tasks: TaskWithWorkspace[];
  workspaces: Workspace[];
  workspaceColors: Record<string, string>;
};

export type PullFailedMessage = {
  type: 'pullFailed';
};

export type ToNewTabMessage = UpdateAllMessage | PullFailedMessage;
