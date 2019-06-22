import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import background from './joe-mania-227005-unsplash.jpg';
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

const App = () => {
  const [tasks, setTasks] = useState([
    {
      id: 4326,
      title: 'something chickenified',
      workspace: 'tech',
      duedate: 'TMRW'
    },
    {
      id: 9548,
      title: 'sometimes i eat salad',
      workspace: 'smart home IoT',
      duedate: 'TODAY'
    },
    {
      id: 9517,
      title: "kingdom in south korea\nbut wait isn't lee chinese?",
      workspace: 'conservation technology',
      duedate: 'JUN 22'
    }
  ]);

  const filteredTasks = tasks.filter(task => !task.done);
  return (
    <>
      <Global
        styles={customBackground({
          backgroundImage: background
        })}
      />
      <DateTime />
      <TaskCard title="Today" tasks={filteredTasks} onTasksChanged={setTasks} />
      <CreateTask />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
