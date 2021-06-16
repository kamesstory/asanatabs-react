/** @jsx jsx */
import { useMemo, useCallback, useState, FunctionComponent } from 'react';
import styled from '@emotion/styled';
import { css, jsx } from '@emotion/core';
import { Flipped } from 'react-flip-toolkit';
import { Task } from './background-scripts/serverManager';
import { ChangeType } from './main';

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

const CheckBox: FunctionComponent<{ onClick: (e: any) => void }> = ({
  onClick,
}) => {
  return (
    <CheckBoxOuter onClick={onClick}>
      <i className="fa fa-check" aria-hidden="true" />
    </CheckBoxOuter>
  );
};

const RowTextPadding = css`
  padding: 5px 0;
`;

const MAX_WORKSPACE_WIDTH_PX = 180;

const WorkspaceName = styled.span<{ workspaceWidth: number; color: string }>`
  color: ${({ color }) => color};
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
  cursor: pointer;

  :last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;

const processDueDates = (duedate: Date) => {
  if (!duedate) return null;
  return duedate
    .toLocaleString('default', { month: 'short', day: '2-digit' })
    .toUpperCase();
};

// TODO: need to retype task and workspaceRef
const TaskRow: FunctionComponent<{
  task: any;
  onTaskChanged: (
    changeType: ChangeType,
    taskChangedId: string,
    changesMade: object
  ) => void;
  workspaceRef: any;
  workspaceWidth: number;
}> = ({ task, onTaskChanged, workspaceRef, workspaceWidth, ...rest }) => {
  const openTaskInNewWindow = () => {
    if (window.getSelection()?.toString() === '') {
      // console.log(task, workspaceRef, workspaceWidth);
      window.open(
        `https://app.asana.com/0/${task.workspace}/${task.gid}`,
        '_blank'
      );
    }
  };

  return (
    <TaskRowOuter onClick={openTaskInNewWindow} {...rest}>
      <CheckBox
        onClick={(e) => {
          e.stopPropagation();
          onTaskChanged('markdone', task.gid, { completed: true });
        }}
      />
      <WorkspaceName
        workspaceWidth={workspaceWidth}
        ref={workspaceRef}
        color={task.color}
      >
        {task.workspace_name}
      </WorkspaceName>
      <TaskTitle>{task.title}</TaskTitle>
      <DueDate>{processDueDates(task.duedate)}</DueDate>
    </TaskRowOuter>
  );
};

// TODO: fix Shamikh's card width issues!
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

const TaskCard: FunctionComponent<{
  title: string;
  tasks: any[];
  onTasksChanged: (
    changeType: ChangeType,
    taskChangedId: string,
    changesMade: object
  ) => void;
}> = ({ title, tasks, onTasksChanged, ...rest }) => {
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const updateWorkspaceWidth = useCallback((widths) => {
    setWorkspaceWidth(Math.max(...widths));
  }, []);
  const taskWorkspaceRefs = useMemo(() => {
    const widths = Array(tasks.length).fill(null);
    return widths.map((_, i) => (el: HTMLElement) => {
      if (el !== null) {
        widths[i] = el.scrollWidth;
        if (widths.every((el) => el !== null)) {
          updateWorkspaceWidth(widths);
        }
      }
    });
  }, [tasks.length, updateWorkspaceWidth]);

  return (
    <Flipped flipId={title}>
      <CardBox {...rest}>
        <Title>{title}</Title>
        {tasks.map((task, i) => (
          <Flipped flipId={task.gid} key={task.gid} translate opacity>
            <TaskRow
              task={task}
              onTaskChanged={onTasksChanged}
              workspaceRef={taskWorkspaceRefs[i]}
              workspaceWidth={workspaceWidth}
            />
          </Flipped>
        ))}
      </CardBox>
    </Flipped>
  );
};

export default TaskCard;
