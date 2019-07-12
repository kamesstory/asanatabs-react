import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import background from './images/ales-krivec-623996-unsplash.jpg';
import DateTime from './DateTime.js';
import TaskCard from './TaskCard.js';
import CreateTask from './CreateTask.js';

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
  tasks.sort(() => Math.random() - 0.5);
  const mapped_tasks = tasks.map(({ id, name, workspace_name, due_on }) => ({
    id,
    title: name,
    workspace: workspace_name,
    duedate: due_on // TODO: to be replaced
  }));

  const filteredTasks = mapped_tasks
    .filter(task => !task.done)
    .map(task => {
      task['color'] = workspaceColors[task['workspace']];
      return task;
    });

  console.log('### App: colors are ', workspaceColors);
  console.log('### App: filtered tasks are ', filteredTasks);
  return (
    <>
      <Global
        styles={customBackground({
          backgroundImage: background
        })}
      />
      <DateTime />
      <TaskCard title="Today" tasks={filteredTasks} onTasksChanged={refetch} />
      <TaskCard
        title="Tomorrow"
        tasks={filteredTasks}
        onTasksChanged={refetch}
      />
      <CreateTask />
    </>
  );
};
