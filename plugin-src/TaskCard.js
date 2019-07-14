import React, { useMemo, useCallback, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';
import { format } from 'url';
import { parse, format as formatDate } from 'date-fns';

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const CheckBoxOuter = styled.div`
  background-color: #f2f1f7;
  border-radius: 50%;
  height: 26px;
  width: 26px;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-right: 18px;
  cursor: pointer;
`;

const CheckBox = ({ clickityClick }) => {
  return (
    <CheckBoxOuter onClick={clickityClick}>
      <i className="fa fa-check" aria-hidden="true" />
    </CheckBoxOuter>
  );
};

const RowTextPadding = css`
  padding: 5px 0;
`;

const MAX_WORKSPACE_WIDTH_PX = 180;

const WorkspaceName = styled.span`
  color: ${props => props.color};
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  margin-right: 36px;
  ${({ workspaceWidth }) =>
    workspaceWidth != 0 &&
    css`
      width: ${Math.min(MAX_WORKSPACE_WIDTH_PX, workspaceWidth)}px;
      ${workspaceWidth >= MAX_WORKSPACE_WIDTH_PX &&
        css`
          white-space: nowrap;
          text-overflow: ellipsis;
        `}
    `};
  ${RowTextPadding}
`;

const TaskTitle = styled.span`
  flex-grow: 1;
  white-space: pre-line;
  ${RowTextPadding}
`;

const DueDate = styled.span`
  flex-shrink: 0;
  font-weight: 600;
  min-width: 90px;
  text-align: right;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  ${RowTextPadding}
`;

const TaskRowOuter = styled.div`
  border-bottom: 1px solid #f2f1f7;
  padding: 14px 0;
  font-size: 14px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;

  :last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;

const processDueDates = duedate => {
  if (!duedate) return null;
  console.log('### TaskCard: duedates ', duedate);
  console.log(
    '### TaskCard: formatted ',
    formatDate(parse(duedate, 'YYYY-MM-DD', new Date()), 'MMM DD')
  );
  return formatDate(
    parse(duedate, 'YYYY-MM-DD', new Date()),
    'MMM DD'
  ).toUpperCase();
};

const TaskRow = ({ task, onTaskChanged, workspaceRef, workspaceWidth }) => {
  return (
    <TaskRowOuter>
      <CheckBox clickityClick={() => onTaskChanged({ ...task, done: true })} />
      <WorkspaceName
        workspaceWidth={workspaceWidth}
        ref={workspaceRef}
        color={task.color}
      >
        {task.workspace}
      </WorkspaceName>
      <TaskTitle>{task.title}</TaskTitle>
      <DueDate>{processDueDates(task.duedate)}</DueDate>
    </TaskRowOuter>
  );
};

const CardBox = styled.div`
  background-color: white;
  max-width: 960px;
  width: 100%;
  padding: 24px;
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  color: #2b2647;
  margin-bottom: 36px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const TaskCard = ({ title, tasks, onTasksChanged }) => {
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const updateWorkspaceWidth = useCallback(widths => {
    setWorkspaceWidth(Math.max(...widths));
  });
  const taskWorkspaceRefs = useMemo(() => {
    const widths = Array(tasks.length).fill(null);
    return widths.map((_, i) => el => {
      if (el != null) {
        widths[i] = el.scrollWidth;
        if (widths.every(el => el != null)) {
          updateWorkspaceWidth(widths);
        }
      }
    });
  }, [tasks.length, updateWorkspaceWidth]);

  // console.log('### TaskCard: the tasks are here:', tasks);

  return (
    <CardBox>
      <Title>{title}</Title>
      {tasks.map((task, i) => (
        <TaskRow
          key={task.id}
          task={task}
          onTaskChanged={newTask =>
            onTasksChanged(tasks.map(t => (t.id === newTask.id ? newTask : t)))
          }
          workspaceRef={taskWorkspaceRefs[i]}
          workspaceWidth={workspaceWidth}
        />
      ))}
    </CardBox>
  );
};

export default TaskCard;
