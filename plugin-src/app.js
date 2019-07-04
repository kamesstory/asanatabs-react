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

export const App = ({ workspaces, inputTasks, refetch }) => {
  inputTasks.sort(() => Math.random() - 0.5);
  const tasks = inputTasks.map(({ id, name, workspace_name, due_on }) => ({
    id,
    title: name,
    workspace: workspace_name,
    duedate: due_on // TODO: to be replaced
  }));

  // TODO: fix the workspace color generation so that it looks better!
  //  can even do fancy color prioritization based on number of tasks (so it doesn't
  //  look overwhelming)
  const workspaceColors = {
    'Tech & Check': '#FF5252',
    'Smart Home IoT': '#FFB300',
    DCT: '#4CAF50',
    'Personal Projects': '#7C4DFF'
  };

  const filteredTasks = tasks
    .filter(task => !task.done)
    .map(task => {
      task['color'] = workspaceColors[task['workspace']];
      return task;
    });
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
