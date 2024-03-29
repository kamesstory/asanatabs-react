/** @jsx jsx */
import { Fragment, FunctionComponent, useCallback, useState } from 'react';
import { Global, css, jsx } from '@emotion/core';
import backgroundImageUrl from './images/ales-krivec-623996-unsplash.jpg';
import DateTime from './DateTime';
import TaskCard, { DisplayableTask } from './TaskCard';
import CreateTask from './CreateTask';
import ErrorFab from './ErrorFab';
import { endOfDay, endOfTomorrow, format } from 'date-fns';
import { Flipper } from 'react-flip-toolkit';
import { Workspace } from './background-scripts/serverManager';
import { ChangeType } from './TaskCard';
import useAsana from './useAsana';
import { useEffect } from 'react';
import Cohere from 'cohere-js';

const formattedBackgroundImageUrl = (backgroundImageUrl as string).startsWith(
  '.'
)
  ? (backgroundImageUrl as string).slice(1)
  : backgroundImageUrl;

const getCustomBackground = () => css`
  html {
    height: 100%;
  }

  body {
    background: fixed center/cover no-repeat url(${formattedBackgroundImageUrl}),
      fixed center/cover no-repeat url('https://i.imgur.com/mpY2LpM.jpeg');
    /* background-size: cover;
    background-position: center;
    background-attachment: fixed; */
    height: 100%;
    font-family: 'Libre Franklin', sans-serif;

    ::-webkit-scrollbar {
      width: 0 !important;
    }
  }

  #root {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 48px;
  }
`;

const pad = (num: number) => {
  return String(num).padStart(2, '0');
};

// Needs to be done since Asana sends due_on dates without
//  a timestamp, even though it's meant to be interpreted in
//  local time.
const appendLocalTimezone = (date: string) => {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.abs(Math.trunc(offset / 60));
  const minutes = Math.abs(offset % 60);
  const sign = offset > 0 ? '-' : '+';

  return `${date} GMT${sign}${pad(hours)}${pad(minutes)}`;
};

export const App: FunctionComponent = () => {
  const [
    onlineStatus,
    tasks,
    workspaces,
    workspaceColors,
    setTasks,
    pullAllFromAsana,
    updateTask,
    createTask,
  ] = useAsana();

  const onTaskChanged = useCallback(
    async (
      changeType: ChangeType,
      taskChangedId: string,
      changeMade: object
    ) => {
      setTasks(
        tasks.map((t) =>
          t.id === taskChangedId || t.gid === taskChangedId
            ? { ...t, ...changeMade }
            : t
        )
      );
      switch (changeType) {
        case 'markdone': {
          // TODO: tasks should locally be updated
          updateTask(taskChangedId, changeMade);
          break;
        }
        default: {
          throw new Error(`Change of type ${changeType} is not implemented.`);
        }
      }
    },
    [pullAllFromAsana, setTasks, tasks]
  );

  const onTaskCreated = useCallback(
    async (
      description: string,
      startDate: Date,
      dueDate: Date,
      workspace: Workspace
    ) => {
      // TODO: need to incorporate startDate
      const task = {
        name: description,
        start_at: startDate.toISOString(),
        due_at: dueDate.toISOString(),
        assignee: 'me',
      };

      createTask(workspace.gid, task);

      // TODO: demarcate task as "placeholder"
      const fake_id = +new Date();
      const fake_gid = fake_id.toString(36);
      setTasks([
        ...tasks,
        {
          ...task,
          resource_type: 'task',
          workspace: workspace.gid,
          workspace_name: workspace.name,
          gid: fake_gid,
          id: fake_id,
        },
      ]);
    },
    [pullAllFromAsana, setTasks, tasks]
  );

  const [todayTasks, setTodayTasks] = useState<DisplayableTask[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<DisplayableTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<DisplayableTask[]>([]);

  useEffect(() => {
    const mappedTasks = tasks.flatMap(
      ({ gid, name, workspace, workspace_name, due_at, due_on, completed }) => {
        if (!workspace || !workspace_name) {
          return [];
        }
        return [
          {
            gid,
            title: name,
            workspace,
            workspace_name,
            duedate:
              due_at && Date.parse(due_at)
                ? new Date(Date.parse(due_at))
                : due_on && Date.parse(due_on)
                ? new Date(Date.parse(appendLocalTimezone(due_on)))
                : undefined,
            completed,
          },
        ];
      }
    );

    const filteredTasks: DisplayableTask[] = mappedTasks
      .filter((task) => !task.completed)
      .map((task) => ({
        ...task,
        color: workspaceColors[task.workspace],
      }));
    filteredTasks.sort((first, second) => {
      if (!first.duedate && !second.duedate)
        return first.gid.localeCompare(second.gid);
      else if (!first.duedate) return 1;
      else if (!second.duedate) return -1;
      return first.duedate.getTime() - second.duedate.getTime();
    });

    const tomorrow = endOfDay(new Date());
    const dayAfterTomorrow = endOfTomorrow();
    setTodayTasks(
      filteredTasks.filter((task) => task.duedate && task.duedate < tomorrow)
    );
    setTomorrowTasks(
      filteredTasks.filter(
        (task) =>
          task.duedate &&
          task.duedate >= tomorrow &&
          task.duedate < dayAfterTomorrow
      )
    );
    setUpcomingTasks(
      filteredTasks.filter(
        (task) => !task.duedate || task.duedate >= dayAfterTomorrow
      )
    );
  }, [tasks, workspaceColors]);

  useEffect(() => {
    Cohere.init('D8taUOQaRZBUZROQ9be4wBhx');
  }, []);

  return (
    <Fragment>
      <Global styles={getCustomBackground()} />
      {/* <div>hot reload testing time 2</div> */}
      <DateTime />
      {tasks && tasks.length > 0 && (
        <Flipper flipKey={tasks}>
          <TaskCard
            title="Today"
            tasks={todayTasks}
            onTaskChanged={onTaskChanged}
          />
          <TaskCard
            title="Tomorrow"
            tasks={tomorrowTasks}
            onTaskChanged={onTaskChanged}
          />
          <TaskCard
            title="Upcoming"
            tasks={upcomingTasks}
            onTaskChanged={onTaskChanged}
          />
        </Flipper>
      )}
      {workspaces && workspaces.length > 0 ? (
        <CreateTask
          onlineStatus={onlineStatus}
          workspaces={workspaces}
          onTaskCreated={onTaskCreated}
        />
      ) : (
        <ErrorFab />
      )}
    </Fragment>
  );
};
