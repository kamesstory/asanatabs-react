import React from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import background from './joe-mania-227005-unsplash.jpg';
import DateTime from './DateTime.js';
import TaskCard from './TaskCard.js';

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
  }

  #root {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 48px;
  }
`;

const App = () => {
  const tasks = [
    { id: 4326, title: 'something chickenified' },
    { id: 9548, title: 'two' },
    { id: 9517, title: 'kingdom in south korea' }
  ];
  return (
    <>
      <Global
        styles={customBackground({
          backgroundImage: background
        })}
      />
      <DateTime />
      <TaskCard title="Today" tasks={tasks} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
