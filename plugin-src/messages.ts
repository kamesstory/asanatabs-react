import { TaskWithWorkspace } from './asana';
import { Workspace } from './background-scripts/serverManager';

export type PullFromAsanaMessage = {
  type: 'pullFromAsana';
};

export type UpdateTaskMessage = {
  type: 'updateTask';
  taskChangedId: string;
  changeMade: object;
};

export type CreateTaskMessage = {
  type: 'createTask';
  workspaceId: string;
  task: object;
};

export type FromNewTabMessage =
  | PullFromAsanaMessage
  | UpdateTaskMessage
  | CreateTaskMessage;

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
