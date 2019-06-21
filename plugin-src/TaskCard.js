import React, { useMemo, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core';

const Title = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const CheckBoxOuter = styled.div`
  background-color: #f2f1f7;
  border-radius: 50%;
  height: 28px;
  width: 28px;
  display: flex;
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

const WorkspaceName = styled.span`
  color: ${props => props.color};
  font-weight: 600;
  width: 0px;
  white-space: nowrap;
  overflow: hidden;
  margin-right: 18px;
  ${RowTextPadding}
`;

const TaskTitle = styled.span`
  flex-grow: 1;
  white-space: pre-line;
  ${RowTextPadding}
`;

const DueDate = styled.span`
  font-weight: 600;
  min-width: 90px;
  text-align: right;
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

const TaskRow = ({ task, onTaskChanged, workspaceRef }) => {
  return (
    <TaskRowOuter>
      <CheckBox clickityClick={() => onTaskChanged({ ...task, done: true })} />
      <WorkspaceName ref={workspaceRef} color={task.color}>
        {task.workspace}
      </WorkspaceName>
      <TaskTitle>{task.title}</TaskTitle>
      <DueDate>{task.duedate}</DueDate>
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
    console.log('foo');
    setWorkspaceWidth(widths.reduce((acc, val) => Math.max(acc, val), 0));
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
        />
      ))}
    </CardBox>
  );
};

export default TaskCard;
