import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import Overlay from './Overlay';

const FormLabel = styled.label`
  color: #939393;
  font-size: 12px;
`;

const FormFieldDiv = styled.div`
  padding-bottom: 28px;
`;

const DescFormInput = styled.textarea`
  color: #2b2647;
  font-size: 18px;
  width: 100%;
  border: none;
  outline: none;
`;

const DescFormField = ({ labelText, inputText }) => {
  return (
    <FormFieldDiv>
      <FormLabel>{labelText}</FormLabel>
      <div>
        <DescFormInput placeholder={inputText} />
      </div>
    </FormFieldDiv>
  );
};

const DateFormInput = styled.input`
  color: #2b2647;
  font-size: 14px;
  border: none;
  outline: none;
`;

const DateFormField = ({ labelText, inputText }) => {
  return (
    <FormFieldDiv>
      <FormLabel>{labelText}</FormLabel>
      <div>
        <DateFormInput placeholder={inputText} />
      </div>
    </FormFieldDiv>
  );
};

const Popover = styled.div`
  display: grid;
  background: white;
  width: 420px;
  border-radius: 8px;
  padding: 32px 28px;
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
  const fabRef = useRef(null);

  const descInputText = 'Try to complete this Create New Task by myself!';

  return (
    <>
      <FabOuter ref={fabRef} onClick={() => setIsOpen(!isOpen)}>
        <FabPlus isOpen={isOpen}>+</FabPlus>
      </FabOuter>
      <Overlay
        openerRef={fabRef}
        isOpen={isOpen}
        onClickOutside={() => setIsOpen(false)}
      >
        <Popover isOpen>
          <DescFormField labelText="Description" inputText={descInputText} />
          <DateFormField labelText="testTitle" inputText="testInput" />
        </Popover>
      </Overlay>
    </>
  );
};

export default CreateTask;
