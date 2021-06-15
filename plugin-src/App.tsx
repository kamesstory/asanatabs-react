/** @jsx jsx */
import { Fragment, FunctionComponent } from 'react';
import { Global, css, jsx } from '@emotion/core';
import backgroundImageUrl from './images/ales-krivec-623996-unsplash.jpg';
import DateTime from './DateTime.js';
import TaskCard from './TaskCard.js';
import CreateTask from './CreateTask';
import ErrorFab from './ErrorFab.js';
import { endOfDay, endOfTomorrow } from 'date-fns';
import { Flipper } from 'react-flip-toolkit';
import { Task, Workspace } from './background-scripts/serverManager';

const formattedBackgroundImageUrl = (backgroundImageUrl as string).startsWith(
  '.'
)
  ? (backgroundImageUrl as string).slice(1)
  : backgroundImageUrl;
// console.log(backgroundImageUrl, formattedBackgroundImageUrl);

const getCustomBackground = () => css`
  html {
    height: 100%;
  }

  body {
    background: url(${formattedBackgroundImageUrl}) no-repeat;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    height: 100%;
    font-family: 'Libre Franklin', sans-serif;

    ::-webkit-scrollbar {
      width: 0 !important;
    }
  }

  #root {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 48px;
  }
`;

export const App: FunctionComponent<{
  workspaces: Workspace[];
  tasks: Task[];
  workspaceColors: any; // TODO: actually type workspaceColors
  refetch: (
    changeType: string,
    taskChangedId: string,
    changesMade: object
  ) => void;
  createTask: (
    description: string,
    startDate: Date,
    dueDate: Date,
    workspace: Workspace
  ) => void;
  isOnline: boolean;
}> = ({
  workspaces,
  tasks,
  workspaceColors,
  refetch,
  createTask,
  isOnline,
}) => {
  // console.log(
  //   `raw tasks are`,
  //   tasks,
  //   `raw workspaces are`,
  //   workspaces,
  //   `workspace colors are`,
  //   workspaceColors
  // );

  // TODO: also think about how to get upcoming to have a user-controlled reminder
  //  date to see when to update the task to be worked on!
  // TODO: parse out as Date objects and sort on main file (not app file)!
  tasks.map((task) => {
    // const { gid, name, workspace, workspace_name, due_on, completed } = task;
    const workspace = task.workspace;
  });
  const mapped_tasks = tasks.flatMap(
    ({ gid, name, workspace, workspace_name, due_on, completed }) => {
      if (!workspace || !workspace_name || !due_on) {
        return [];
      }
      return [
        {
          gid,
          title: name,
          workspace,
          workspace_name,
          duedate:
            due_on && Date.parse(due_on)
              ? new Date(Date.parse(due_on))
              : undefined,
          completed,
        },
      ];
    }
  );

  const filteredTasks = mapped_tasks
    .filter((task) => !task.completed)
    .map((task) => ({
      ...task,
      color: workspaceColors[task.workspace_name],
    }));
  filteredTasks.sort((first, second) => {
    if (!first.duedate && !second.duedate) return 0;
    else if (!first.duedate) return 1;
    else if (!second.duedate) return -1;
    return first.duedate.getTime() - second.duedate.getTime();
  });

  const tomorrow = endOfDay(new Date());
  const dayAfterTomorrow = endOfTomorrow();
  const todayTasks = filteredTasks.filter(
    (task) => task.duedate && task.duedate <= tomorrow
  );
  const tomorrowTasks = filteredTasks.filter(
    (task) =>
      task.duedate &&
      task.duedate > tomorrow &&
      task.duedate <= dayAfterTomorrow
  );
  const upcomingTasks = filteredTasks.filter(
    (task) => !task.duedate || task.duedate >= dayAfterTomorrow
  );

  // need aggregator at this top level
  const singleTaskChanged = (
    changeType: string,
    taskChangedId: string,
    changesMade: object
  ) => {
    // console.log(
    //   '### SingleTaskChanged: ID of task modified is ',
    //   taskChangedId
    // );
    refetch(changeType, taskChangedId, changesMade);
  };

  const errorMessage =
    'AsanaTabs currently cannot connect to Asana. Please make sure you are logged in \
    and have cookies enabled for Asana, and try again by opening a new tab page!';

  return (
    <Fragment>
      <Global styles={getCustomBackground()} />
      {/* <div>hot reload testing time 2</div> */}
      <DateTime />
      {tasks && tasks.length > 0 && (
        <Flipper flipKey={tasks}>
          <TaskCard
            title="Today"
            tasks={todayTasks}
            onTasksChanged={singleTaskChanged}
          />
          <TaskCard
            title="Tomorrow"
            tasks={tomorrowTasks}
            onTasksChanged={singleTaskChanged}
          />
          <TaskCard
            title="Upcoming"
            tasks={upcomingTasks}
            onTasksChanged={singleTaskChanged}
          />
        </Flipper>
      )}
      {isOnline && workspaces && workspaces.length > 0 ? (
        <CreateTask workspaces={workspaces} onCreateTask={createTask} />
      ) : (
        <ErrorFab errorMessage={errorMessage} />
      )}
    </Fragment>
  );
};
