/** @jsx jsx */
import {
  useMemo,
  useCallback,
  useState,
  FunctionComponent,
  MouseEventHandler,
} from 'react';
import styled from '@emotion/styled';
import { css, jsx } from '@emotion/core';
import { Flipped } from 'react-flip-toolkit';

export type DisplayableTask = {
  gid: string;
  title: string;
  workspace: string;
  workspace_name: string;
  color: string;
  duedate?: Date;
  completed?: boolean;
};

export type ChangeType = 'markdone';

const Title = styled.h1<{ isEmpty: boolean }>`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: ${({ isEmpty }) => (isEmpty ? 0 : '18px')};
  padding: 0 24px;
`;

const CheckBoxCircle = styled.div<{ hovered: boolean }>`
  background-color: ${({ hovered }) => (hovered ? '#f2f1f7' : 'white')};
  border: 1px solid;
  border-color: ${({ hovered }) => (hovered ? '#2b2647' : '#f2f1f7')};
  color: #2b2647;
  border-radius: 50%;
  height: 26px;
  width: 26px;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  transition: all 0.1s linear;
`;

const CheckBoxOuter = styled.div`
  display: flex;
  flex-shrink: 0;
  height: 26px;
  width: 26px;
  align-items: center;
  justify-content: center;
  margin-right: 18px;
  cursor: pointer;
`;

const CheckBox: FunctionComponent<{
  onClick: MouseEventHandler<HTMLDivElement>;
}> = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <CheckBoxOuter
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CheckBoxCircle onClick={onClick} hovered={hovered}>
        <i className="fa fa-check" aria-hidden="true" />
      </CheckBoxCircle>
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
  font-size: 12px;
  ${RowTextPadding}
`;

const TaskRowOuter = styled.div`
  border-top: 1px solid #f2f1f7;
  padding: 14px 24px;
  font-size: 14px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  cursor: default;

  :last-child {
    border-bottom: 1px solid #f2f1f7;
  }

  :hover {
    background-color: #fafafa;
  }
`;

const processDueDates = (duedate: Date) => {
  if (!duedate) return null;
  return duedate
    .toLocaleString('default', { month: 'short', day: '2-digit' })
    .toUpperCase();
};

// TODO: need to retype workspaceRef
const TaskRow: FunctionComponent<{
  task: DisplayableTask;
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
      window.open(
        `https://app.asana.com/0/${task.workspace}/${task.gid}`,
        '_blank'
      );
    }
  };

  return (
    <TaskRowOuter onClick={openTaskInNewWindow} {...rest}>
      <CheckBox
        onClick={(e: any) => {
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
      {task.duedate && <DueDate>{processDueDates(task.duedate)}</DueDate>}
    </TaskRowOuter>
  );
};

// TODO: fix Shamikh's card width issues!
const CardBox = styled.div`
  background-color: white;
  max-width: 960px;
  width: 100%;
  padding: 24px 0;
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  color: #2b2647;
  margin-bottom: 36px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  -webkit-animation: fadein 0.5s;
  animation: fadein 0.5s;

  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @-webkit-keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const TaskCard: FunctionComponent<{
  title: string;
  tasks: DisplayableTask[];
  onTaskChanged: (
    changeType: ChangeType,
    taskChangedId: string,
    changesMade: object
  ) => void;
}> = ({ title, tasks, onTaskChanged, ...rest }) => {
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
        <Title isEmpty={tasks.length === 0}>{title}</Title>
        {tasks.map((task, i) => (
          <Flipped flipId={task.gid} key={task.gid} translate opacity>
            <TaskRow
              task={task}
              onTaskChanged={onTaskChanged}
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
