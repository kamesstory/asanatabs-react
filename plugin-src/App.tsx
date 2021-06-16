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
import * as Asana from './background-scripts/asana';
import { ChangeType } from './TaskCard';
import useAsana from './useAsana';
import { useEffect } from 'react';

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
    background: url(${formattedBackgroundImageUrl}) no-repeat;
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
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

export const App: FunctionComponent = () => {
  const [
    isOnline,
    tasks,
    workspaces,
    workspaceColors,
    setTasks,
    pullAllFromAsana,
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
          await Asana.updateTask(taskChangedId, changeMade);
          await pullAllFromAsana();
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
        due_on: format(dueDate, 'YYYY-MM-DD'),
        assignee: 'me',
      };

      const createAndUpdate = async () => {
        await Asana.createTask(workspace.gid, task);
        await pullAllFromAsana();
      };
      createAndUpdate();

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
    // TODO: also think about how to get upcoming to have a user-controlled reminder
    //  date to see when to update the task to be worked on!
    // TODO: parse out as Date objects and sort on main file (not app file)!
    const mappedTasks = tasks.flatMap(
      ({ gid, name, workspace, workspace_name, due_on, completed }) => {
        if (!workspace || !workspace_name || !due_on) {
          return [];
        }
        return [
          {
            gid,
            title: name,
            workspace,
            workspace_name,
            duedate:
              due_on && Date.parse(due_on)
                ? new Date(Date.parse(due_on))
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
        color: workspaceColors[task.workspace_name],
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
      filteredTasks.filter((task) => task.duedate && task.duedate <= tomorrow)
    );
    setTomorrowTasks(
      filteredTasks.filter(
        (task) =>
          task.duedate &&
          task.duedate > tomorrow &&
          task.duedate <= dayAfterTomorrow
      )
    );
    setUpcomingTasks(
      filteredTasks.filter(
        (task) => !task.duedate || task.duedate >= dayAfterTomorrow
      )
    );
  }, [tasks, workspaceColors]);

  const errorMessage =
    'AsanaTabs currently cannot connect to Asana. Please make sure you are logged in \
    and have cookies enabled for Asana, and try again by opening a new tab page!';

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
      {isOnline && workspaces && workspaces.length > 0 ? (
        <CreateTask workspaces={workspaces} onTaskCreated={onTaskCreated} />
      ) : (
        <ErrorFab errorMessage={errorMessage} />
      )}
    </Fragment>
  );
};
