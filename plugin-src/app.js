import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import background from './images/ales-krivec-623996-unsplash.jpg';
import DateTime from './DateTime.js';
import TaskCard from './TaskCard.js';
import CreateTask from './CreateTask.js';
import { endOfDay, endOfTomorrow } from 'date-fns';

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

export const App = ({ workspaces, tasks, workspaceColors, refetch }) => {
  // TODO: sort tasks into different TaskCards depending on their duedate
  //  assignee_status! use that in conjunction with other labels to provide
  //  powerful Today/Tomorrow/Upcoming labels!
  // also think about how to get upcoming to have a user-controlled reminder
  //  date to see when to update the task to be worked on!
  // tasks.sort(() => Math.random() - 0.5);
  const mapped_tasks = tasks.map(
    ({ id, name, workspace_name, due_on, completed }) => ({
      id,
      title: name,
      workspace: workspace_name,
      duedate: due_on, // TODO: to be replaced
      completed
    })
  );

  const filteredTasks = mapped_tasks
    .filter(task => !task.completed)
    .map(task => ({
      ...task,
      color: workspaceColors[task.workspace]
    }));

  // TODO: decide if I want to include this on the App rendering method or
  //  somewhere else, parsed out
  const mingTian = endOfDay(new Date());
  const houTian = endOfTomorrow();
  mingTian.setDate(mingTian.getDate() + 1);
  houTian.setDate(houTian.getDate() + 2);
  // TODO: fix this bs regarding date comparisons
  const todayTasks = filteredTasks.filter(
    task => task.duedate && Date.parse(task.duedate) <= Date.parse(mingTian)
  );
  const tomorrowTasks = filteredTasks.filter(
    task =>
      task.duedate &&
      Date.parse(task.duedate) >= Date.parse(mingTian) &&
      Date.parse(task.duedate) <= Date.parse(houTian)
  );
  const upcomingTasks = filteredTasks.filter(
    task => !task.duedate || Date.parse(task.duedate) >= Date.parse(houTian)
  );

  // need aggregator at this top level
  const singleTaskChanged = (changeType, taskChangedID, changesMade) => {
    console.log('### SingleTaskChanged: ID of task changed is ', taskChangedID);
    refetch(changeType, taskChangedID, changesMade);
  };

  return (
    <>
      <Global
        styles={customBackground({
          backgroundImage: background
        })}
      />
      <DateTime />
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
      <CreateTask workspaces={workspaces} />
    </>
  );
};
