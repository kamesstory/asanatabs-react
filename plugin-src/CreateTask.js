import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import { Overlay } from 'react-overlays';

const Popover = styled.div`
  background: white;
  width: 420px;
  border-radius: 8px;
  padding: 12px;
  color: #2b2647;
  position: fixed;
  bottom: 108px;
  right: 28px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
  opacity: 0;
  pointer-events: none;
  transform: scale(0);
  transform-origin: right bottom;
  transition: opacity 0.1s, transform 0.1s;
  ${props =>
    props.isOpen &&
    css`
      pointer-events: auto;
      opacity: 1;
      transform: scale(1);
    `};
`;

const FabOuter = styled.div`
  position: fixed;
  bottom: 28px;
  right: 28px;
  background-color: #2b2647;
  border-radius: 50%;
  font-weight: 400;
  text-align: center;
  font-size: 40px;
  color: white;
  width: 64px;
  height: 64px;
  line-height: 64px;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
`;

const FabPlus = styled.span`
  display: inline-block;
  transform: rotate(0deg);
  transition: transform 0.2s;
  ${props =>
    props.isOpen &&
    css`
      transform: rotate(135deg);
    `}
`;

const CreateTask = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FabOuter onClick={() => setIsOpen(!isOpen)}>
        <FabPlus isOpen={isOpen}>+</FabPlus>
      </FabOuter>
      <Popover isOpen={isOpen}>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
        <p>asdjaksjdkasda</p>
      </Popover>
    </>
  );
};

export default CreateTask;
