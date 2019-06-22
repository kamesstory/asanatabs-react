import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import { format } from 'date-fns';

const DateTimeOuter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-shadow: 0px 8px 16px rgba(0, 0, 0, 0.25);
  height: calc(100vh - 150px);
  justify-content: center;
  user-select: none;
`;

const Time = styled.span`
  font-size: 72px;
  font-weight: 300;
`;

const DateText = styled.span`
  font-size: 18px;
  font-weight: 500;
`;

const DateTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerID = window.setInterval(() => setTime(new Date()), 500);
    return () => window.clearInterval(timerID);
  });

  return (
    <DateTimeOuter>
      <Time>{`${format(time, 'hh:mm')}`}</Time>
      <DateText>{`${format(time, 'ddd, MMM DD')}`}</DateText>
    </DateTimeOuter>
  );
};

export default DateTime;
