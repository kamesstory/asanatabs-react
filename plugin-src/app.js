import React from 'react';
import { Global, css } from '@emotion/core';
import background from './images/ales-krivec-623996-unsplash.jpg';
import DateTime from './DateTime.js';
import TaskCard from './TaskCard.js';
import CreateTask from './CreateTask.js';
import ErrorFab from './ErrorFab.js';
import { endOfDay, endOfTomorrow } from 'date-fns';
import { Flipper } from 'react-flip-toolkit';

const customBackground = ({ backgroundImage }) => css`
  html {
    height: 100%;
  }

  body {
    background: url(${backgroundImage}) no-repeat;
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

export const App = ({
  workspaces,
  tasks,
  workspaceColors,
  refetch,
  createTask,
  isOnline
}) => {
  // TODO: also think about how to get upcoming to have a user-controlled reminder
  //  date to see when to update the task to be worked on!
  // TODO: parse out as Date objects and sort on main file (not app file)!
  const mapped_tasks = tasks.map(
    ({ gid, name, workspace_name, due_on, completed }) => ({
      gid,
      title: name,
      workspace: workspace_name,
      duedate: Date.parse(due_on) ? new Date(Date.parse(due_on)) : undefined,
      completed
    })
  );

  const filteredTasks = mapped_tasks
    .filter(task => !task.completed)
    .map(task => ({
      ...task,
      color: workspaceColors[task.workspace]
    }));
  filteredTasks.sort((first, second) => {
    if (!first.duedate && !second.duedate) return 0;
    else if (!first.duedate) return 1;
    else if (!second.duedate) return -1;
    return first.duedate - second.duedate;
  });

  const mingTian = endOfDay(new Date());
  const houTian = endOfTomorrow();
  const todayTasks = filteredTasks.filter(
    task => task.duedate && task.duedate <= mingTian
  );
  const tomorrowTasks = filteredTasks.filter(
    task => task.duedate && task.duedate > mingTian && task.duedate <= houTian
  );
  const upcomingTasks = filteredTasks.filter(
    task => !task.duedate || task.duedate >= houTian
  );

  // need aggregator at this top level
  const singleTaskChanged = (changeType, taskChangedID, changesMade) => {
    console.log(
      '### SingleTaskChanged: ID of task modified is ',
      taskChangedID
    );
    refetch(changeType, taskChangedID, changesMade);
  };

  const errorMessage =
    'AsanaTabs currently cannot connect to Asana. Please make sure you are logged in \
    and have cookies enabled for Asana, and try again by opening a new tab page!';

  return (
    <>
      <Global
        styles={customBackground({
          backgroundImage: background
        })}
      />
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
    </>
  );
};
