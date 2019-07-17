import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css, cx } from '@emotion/core';
import Overlay from './Overlay';
import { parseDate } from 'chrono-node';

const FormLabel = styled.label`
  color: #939393;
  font-size: 12px;
`;

const FormFieldDiv = styled.div`
  padding-bottom: 28px;
  flex-grow: 1;
`;

const DescFormInput = styled.textarea`
  color: #2b2647;
  font-size: 18px;
  width: 100%;
  border: none;
  outline: none;
`;

const DescFormField = ({
  labelText,
  inputText,
  description,
  setDescription
}) => {
  return (
    <FormFieldDiv>
      <FormLabel>{labelText}</FormLabel>
      <div>
        <DescFormInput
          placeholder={inputText}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
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

const DateFormField = ({ labelText, inputText, parsedDate, setStartDate }) => {
  return (
    <FormFieldDiv>
      <FormLabel>{labelText}</FormLabel>
      <div>
        <DateFormInput
          placeholder={inputText}
          value={parsedDate}
          onChange={e => setStartDate(e.target.value)}
        />
      </div>
    </FormFieldDiv>
  );
};

const HorizontalFlex = styled.div`
  display: flex;
  flex-direction: horizontal;
`;

const WorkspaceFormInput = styled.input`
  color: #2b2647;
  font-size: 14px;
  border: none;
  outline: none;
`;

const WorkspaceFormField = ({ workspaces, workspaceState, setWorkspace }) => {
  // TODO: insert workspace selection for inputs here!
  // TODO: need colors here too!
  return (
    <FormFieldDiv>
      <FormLabel>Workspace</FormLabel>
      <HorizontalFlex>
        <WorkspaceFormInput
          placeholder={workspaces[workspaces.length - 1].name}
          value={workspaceState}
          onChange={e => setWorkspace(e.target.value)}
        />
      </HorizontalFlex>
    </FormFieldDiv>
  );
};

const SubmitTaskButton = styled.button`
  border-radius: 5px;
  width: 150px;
  height: 50px;
  color: #2b2647;
  background-color: #f2f1f7;
  border: none;
  outline: none;
  cursor: pointer;
`;

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
  transform: translateY(8px);
  transition: opacity 0.15s, transform 0.15s;
  ${({ isOpen }) =>
    isOpen &&
    css`
      opacity: 1;
      transform: translateY(0);
    `}
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

const CreateTask = ({ workspaces, onCreateTask }) => {
  const descInputText = 'description + title of your task';

  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [workspaceState, setWorkspace] = useState('');
  const fabRef = useRef(null);

  // console.log(
  //   '### CreateTask: workspaces are ',
  //   workspaces.filter(ws => ws.name === workspaceState)
  // );

  // TODO: need to sanitize inputs more
  const readyForSubmit =
    isOpen &&
    description != null &&
    description.length > 0 &&
    parseDate(startDate) instanceof Date &&
    parseDate(dueDate) instanceof Date &&
    workspaces.filter(ws => ws.name === workspaceState).length > 0;

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
        <Popover isOpen={isOpen}>
          <DescFormField
            labelText="Description"
            inputText={descInputText}
            description={description}
            setDescription={setDescription}
          />
          <HorizontalFlex>
            <DateFormField
              labelText="Start Date"
              inputText="e.g. in 5 days"
              parsedDate={startDate}
              setStartDate={setStartDate}
            />
            <DateFormField
              labelText="Due Date"
              inputText="e.g. next Friday"
              parsedDate={dueDate}
              setStartDate={setDueDate}
            />
          </HorizontalFlex>
          <WorkspaceFormField
            workspaces={workspaces}
            workspaceState={workspaceState}
            setWorkspace={setWorkspace}
          />
          <SubmitTaskButton
            disabled={!readyForSubmit}
            onClick={() => {
              // TODO: get onCreateTask to work properly!
              console.log('HELLO FROM THE UNDERWORLD!');
              onCreateTask(
                description,
                parseDate(startDate),
                parseDate(dueDate),
                workspaces.filter(ws => ws.name === workspaceState)[0].id
              );
            }}
          >
            Submit Task
          </SubmitTaskButton>
        </Popover>
      </Overlay>
    </>
  );
};

export default CreateTask;
