import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css, cx } from '@emotion/core';
import Overlay from './Overlay';
import { parseDate } from 'chrono-node';

const FormLabel = styled.label`
  position: relative;
  z-index: ${({ zIndex }) => zIndex || 997};
  color: #939393;
  font-size: 12px;
`;

const FormFieldDiv = styled.div`
  padding-bottom: 28px;
  flex-grow: 1;
  position: relative;
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
  setDescription,
  setActiveInput
}) => {
  return (
    <FormFieldDiv>
      <FormLabel>{labelText}</FormLabel>
      <div>
        <DescFormInput
          placeholder={inputText}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onFocus={e => setActiveInput()}
        />
      </div>
    </FormFieldDiv>
  );
};

const roundedBox = css`
  display: grid;
  background: white;
  border-radius: 8px;
  color: #2b2647;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
  z-index: 998;
`;

const SuggestionsPopup = styled.div`
  position: absolute;
  width: 210px;
  height: 150px;
  left: -12px;
  top: -12px;
  ${roundedBox};
`;

const DateFormInput = styled.input`
  position: relative;
  color: #2b2647;
  font-size: 14px;
  border: none;
  outline: none;
  z-index: ${({ zIndex }) => zIndex || 997};
`;

const DateFormField = ({
  labelText,
  inputText,
  parsedDate,
  setStartDate,
  isOpen,
  setActiveInput
}) => {
  const zIndex = isOpen ? 999 : 997;
  return (
    <FormFieldDiv>
      {/* {isOpen && <SuggestionsPopup />} */}
      <FormLabel zIndex={zIndex}>{labelText}</FormLabel>
      <DateFormInput
        placeholder={inputText}
        value={parsedDate}
        onChange={e => setStartDate(e.target.value)}
        onFocus={e => setActiveInput()}
        zIndex={zIndex}
      />
    </FormFieldDiv>
  );
};

const HorizontalFlex = styled.div`
  display: flex;
  flex-direction: horizontal;
`;

const WorkspaceFormInput = styled.input`
  position: relative;
  z-index: ${({ zIndex }) => zIndex || 997};
  color: #2b2647;
  font-size: 14px;
  border: none;
  outline: none;
`;

const WorkspaceFormField = ({
  workspaces,
  workspaceState,
  setWorkspace,
  isOpen,
  setActiveInput
}) => {
  const zIndex = isOpen ? 999 : 997;
  // TODO: insert workspace selection for inputs here!
  // TODO: need colors here too!
  return (
    <FormFieldDiv>
      {/* {isOpen && <SuggestionsPopup />} */}
      <FormLabel zIndex={zIndex}>Workspace</FormLabel>
      <HorizontalFlex>
        <WorkspaceFormInput
          placeholder={workspaces[workspaces.length - 1].name}
          value={workspaceState}
          onChange={e => setWorkspace(e.target.value)}
          onFocus={e => setActiveInput()}
          zIndex={zIndex}
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
  border: ${({ disabled }) =>
    disabled ? 'solid indianred' : 'solid darkseagreen'};
  outline: none;
  cursor: pointer;
`;

const Popover = styled.div`
  opacity: 0;
  width: 420px;
  padding: 32px 28px;
  position: fixed;
  bottom: 108px;
  right: 28px;
  ${roundedBox}

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
  const [suggestionPopup, setOpenSuggestionPopup] = useState('');

  // TODO: include better controlled input sanitization!
  const readyForSubmit =
    isOpen &&
    description != null &&
    description.length > 0 &&
    parseDate(startDate) instanceof Date &&
    parseDate(dueDate) instanceof Date &&
    workspaces.filter(ws => ws.name === workspaceState).length > 0;

  useEffect(() => {
    const keypressHandler = event => {
      if (event.key === 'c') setIsOpen(true);
      else if (isOpen && event.key === 'Escape') {
        setIsOpen(false);
        // document.getElementById('root').focus();
      }
      // else if ( isOpen && readyForSubmit && (event.metaKey || event.ctrlKey) && event.key === 'Enter' )
    };
    window.addEventListener('keydown', keypressHandler);
    return () => window.removeEventListener('keydown', keypressHandler);
  });

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
            setActiveInput={e => setOpenSuggestionPopup('')}
          />
          <HorizontalFlex>
            <DateFormField
              labelText="Start Date"
              inputText="e.g. in 5 days"
              parsedDate={startDate}
              setStartDate={setStartDate}
              isOpen={suggestionPopup == 'start_date'}
              setActiveInput={() => setOpenSuggestionPopup('start_date')}
            />
            <DateFormField
              labelText="Due Date"
              inputText="e.g. next Friday"
              parsedDate={dueDate}
              setStartDate={setDueDate}
              isOpen={suggestionPopup == 'due_date'}
              setActiveInput={() => setOpenSuggestionPopup('due_date')}
            />
          </HorizontalFlex>
          <WorkspaceFormField
            workspaces={workspaces}
            workspaceState={workspaceState}
            setWorkspace={setWorkspace}
            isOpen={suggestionPopup == 'workspace'}
            setActiveInput={() => setOpenSuggestionPopup('workspace')}
          />
          <SubmitTaskButton
            disabled={!readyForSubmit}
            onClick={() => {
              onCreateTask(
                description,
                parseDate(startDate),
                parseDate(dueDate),
                workspaces.filter(ws => ws.name === workspaceState)[0]
              );
              setIsOpen(false);
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
