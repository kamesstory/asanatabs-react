import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import background from './ales-krivec-623996-unsplash.jpg';
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
      title: 'set up BERT implementation for NLP claim matching',
      workspace: 'tech & check',
      duedate: 'TMRW'
    },
    {
      id: 9548,
      title: 'allow diverse queries for smart home lights Alexa skill',
      workspace: 'smart home IoT',
      duedate: 'TODAY'
    },
    {
      id: 9517,
      title:
        'reach out to WWF and Microsoft Earth for AI contacts for project ideas',
      workspace: 'conservation technology',
      duedate: 'JUN 27'
    },
    {
      id: 9517,
      title:
        'start thinking about blueprint conference organizers for next year',
      workspace: 'conservation technology',
      duedate: 'JUL 02'
    },
    {
      id: 9517,
      title:
        'conduct elastic search QA on results returned from Share the Facts',
      workspace: 'tech & check',
      duedate: '5 DAYS'
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
