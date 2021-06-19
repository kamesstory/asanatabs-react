/** @jsx jsx */
import {
  FunctionComponent,
  useState,
  useRef,
  useEffect,
  SetStateAction,
  Fragment,
  useCallback,
} from 'react';
import styled from '@emotion/styled';
import { css, jsx } from '@emotion/core';
import Overlay from './Overlay';
import { parseDate } from 'chrono-node';
import { Workspace } from './background-scripts/serverManager';

export type GenericProps = {
  zIndex?: number;
  isOpen?: boolean;
};

const FormLabel = styled.label<GenericProps>`
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
  font-family: 'Libre Franklin', sans-serif;
  font-size: 18px;
  width: 100%;
  border: none;
  outline: none;
`;

const DescFormField: FunctionComponent<{
  labelText: string;
  inputText: string;
  description: string;
  setDescription: (v: string) => void;
  setActiveInput: VoidFunction;
}> = ({
  labelText,
  inputText,
  description,
  setDescription,
  setActiveInput,
}) => {
  return (
    <FormFieldDiv>
      <FormLabel>{labelText}</FormLabel>
      <div>
        <DescFormInput
          placeholder={inputText}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setActiveInput()}
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

const DateFormInput = styled.input<GenericProps>`
  position: relative;
  color: #2b2647;
  font-size: 14px;
  border: none;
  outline: none;
  z-index: ${({ zIndex }) => zIndex || 997};
`;

const DateFormField: FunctionComponent<{
  labelText: string;
  inputText: string;
  parsedDate: string;
  setStartDate: (v: string) => void;
  isOpen: boolean;
  setActiveInput: VoidFunction;
}> = ({
  labelText,
  inputText,
  parsedDate,
  setStartDate,
  isOpen,
  setActiveInput,
}) => {
  const zIndex = isOpen ? 999 : 997;
  return (
    <FormFieldDiv>
      {/* {isOpen && <SuggestionsPopup />} */}
      <FormLabel zIndex={zIndex}>{labelText}</FormLabel>
      <DateFormInput
        placeholder={inputText}
        value={parsedDate}
        onChange={(e) => setStartDate(e.target.value)}
        onFocus={() => setActiveInput()}
        zIndex={zIndex}
      />
    </FormFieldDiv>
  );
};

const HorizontalFlex = styled.div`
  display: flex;
  flex-direction: horizontal;
`;

const WorkspaceFormInput = styled.input<GenericProps>`
  position: relative;
  z-index: ${({ zIndex }) => zIndex || 997};
  color: #2b2647;
  font-size: 14px;
  border: none;
  outline: none;
`;

const WorkspaceFormField: FunctionComponent<{
  workspaces: Workspace[];
  workspaceState: string;
  setWorkspace: React.Dispatch<SetStateAction<string>>;
  isOpen: boolean;
  setActiveInput: VoidFunction;
}> = ({ workspaces, workspaceState, setWorkspace, isOpen, setActiveInput }) => {
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
          onChange={(e) => setWorkspace(e.target.value)}
          onFocus={(e) => setActiveInput()}
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
  border: none;
  /* border: ${({ disabled }) =>
    disabled ? 'solid indianred' : 'solid darkseagreen'}; */
  outline: none;
  cursor: pointer;
`;

const SubmitErrorMessage = styled.div<{ opacity: number }>`
  color: #ff0033;
  margin-top: 8px;
  opacity: ${({ opacity }) => opacity};
`;

const Popover = styled.div<GenericProps>`
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
  font-size: 40px;
  color: #f2f1f7;
  width: 64px;
  height: 64px;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);

  display: flex;
  align-items: center;
  justify-content: center;
`;

const FabPlus = styled.span<GenericProps>`
  display: inline-block;
  transform: rotate(0deg);
  transition: transform 0.2s;
  ${({ isOpen }) =>
    isOpen &&
    css`
      transform: rotate(135deg);
    `}
`;

type Error =
  | 'no_connection'
  | 'desc_invalid'
  | 'start_date_invalid'
  | 'end_date_invalid'
  | 'workspace_invalid'
  | 'generic';

const CreateTask: FunctionComponent<{
  workspaces: Workspace[];
  onTaskCreated: (
    description: string,
    startDate: Date,
    dueDate: Date,
    workspace: Workspace
  ) => void;
  isOnline: boolean;
}> = ({ workspaces, onTaskCreated, isOnline }) => {
  console.log(`isOnline`, isOnline);
  const descInputText = 'description & title of your task';
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [workspace, setWorkspace] = useState('');
  const fabRef = useRef<HTMLDivElement | null>(null);
  const [suggestionPopup, setOpenSuggestionPopup] = useState('');
  const [errorMessage, setErrorMessage] = useState<Error | null>(null);

  const getError = useCallback<() => Error | null>(() => {
    // console.log(`getError`, isOnline);
    return !isOnline
      ? 'no_connection'
      : !isOpen
      ? 'generic'
      : description === null || description.length <= 0
      ? 'desc_invalid'
      : startDate !== '' && !(parseDate(startDate) instanceof Date)
      ? 'start_date_invalid'
      : dueDate !== '' && !(parseDate(dueDate) instanceof Date)
      ? 'end_date_invalid'
      : workspace !== '' &&
        workspaces.filter((w) => w.name === workspace).length > 0
      ? 'workspace_invalid'
      : null;
  }, []);
  // TODO: this won't work since useCallback not being refreshed when variables change
  //  why is eslint not catching this

  useEffect(() => {
    const keypressHandler = (event: KeyboardEvent) => {
      if (event.key === 'c') setIsOpen(true);
      else if (isOpen && event.key === 'Escape') {
        setIsOpen(false);
        // document.getElementById('root').focus();
      }
      // else if ( isOpen && readyForSubmit && (event.metaKey || event.ctrlKey) && event.key === 'Enter' )
    };
    window.addEventListener('keydown', keypressHandler);
    return () => window.removeEventListener('keydown', keypressHandler);
  }, []);

  return (
    <Fragment>
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
            setActiveInput={() => setOpenSuggestionPopup('')}
          />
          <HorizontalFlex>
            <DateFormField
              labelText="Start Date"
              inputText="today"
              parsedDate={startDate}
              setStartDate={setStartDate}
              isOpen={suggestionPopup == 'start_date'}
              setActiveInput={() => setOpenSuggestionPopup('start_date')}
            />
            <DateFormField
              labelText="Due Date"
              inputText="tomorrow"
              parsedDate={dueDate}
              setStartDate={setDueDate}
              isOpen={suggestionPopup == 'due_date'}
              setActiveInput={() => setOpenSuggestionPopup('due_date')}
            />
          </HorizontalFlex>
          <WorkspaceFormField
            workspaces={workspaces}
            workspaceState={workspace}
            setWorkspace={setWorkspace}
            isOpen={suggestionPopup == 'workspace'}
            setActiveInput={() => setOpenSuggestionPopup('workspace')}
          />
          <SubmitTaskButton
            onClick={() => {
              const error = getError();
              console.log(`error`, error);
              if (error) {
                setErrorMessage(error);
                return;
              }
              const submitted_workspace =
                workspace === ''
                  ? workspaces[workspaces.length - 1]
                  : workspaces.filter((ws) => ws.name === workspace)[0];
              onTaskCreated(
                description,
                parseDate(startDate === '' ? 'today' : startDate),
                parseDate(dueDate === '' ? 'tomorrow' : dueDate),
                submitted_workspace
              );
              setIsOpen(false);
            }}
          >
            Submit Task
          </SubmitTaskButton>
          {errorMessage && (
            <SubmitErrorMessage opacity={errorMessage ? 1 : 0}>
              {errorMessage === 'no_connection' ? (
                <p>
                  You are currently not logged in to{' '}
                  <a style={{ color: '#ff0033' }} href="https://app.asana.com">
                    Asana
                  </a>
                  . Please log in to continue using AsanaTabs.
                </p>
              ) : errorMessage === 'desc_invalid' ? (
                'Invalid description.'
              ) : errorMessage === 'start_date_invalid' ? (
                `Invalid start date. Try typing in everyday language, like "5pm tomorrow"`
              ) : errorMessage === 'end_date_invalid' ? (
                `Invalid end date. Try typing in everyday language, like "5pm tomorrow"`
              ) : errorMessage === 'workspace_invalid' ? (
                `Invalid workspace.`
              ) : errorMessage === 'generic' ? (
                'Sorry, we ran into an issue.'
              ) : (
                ''
              )}
            </SubmitErrorMessage>
          )}
        </Popover>
      </Overlay>
    </Fragment>
  );
};

export default CreateTask;
