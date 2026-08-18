import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { TaskComposer } from '../../features/tasks/TaskComposer';
import { TaskDetailsDrawer } from '../../features/tasks/TaskDetailsDrawer';
import { TaskListSection } from '../../features/tasks/TaskListSection';
import { TaskPagination } from '../../features/tasks/TaskPagination';
import { TaskRow } from '../../features/tasks/TaskRow';
import type { PaginatedTasks, TaskViewData } from '../../features/tasks/types';

interface TasksPageProps {
    today: string;
    todayTasks: TaskViewData[];
    upcomingTasks: TaskViewData[];
    overdueTasks: PaginatedTasks;
    completedTasks: PaginatedTasks;
    currentSeason: {
        number: number;
        seasonPoints: number;
    };
}

export default function TasksIndex(props: TasksPageProps) {
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const allVisibleTasks = [...props.todayTasks, ...props.upcomingTasks, ...props.overdueTasks.data, ...props.completedTasks.data];
    const selectedTask = allVisibleTasks.find((task) => task.id === selectedTaskId) ?? null;

    function renderTask(task: TaskViewData) {
        return <TaskRow key={task.id} onOpen={() => setSelectedTaskId(task.id)} task={task} />;
    }

    return (
        <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
            <Head title="Tasks" />

            <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">Act with intention</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Tasks</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-secondary sm:text-base">Capture it quickly. Importance and timing determine the reward when you complete it.</p>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-right">
                    <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Season {String(props.currentSeason.number).padStart(2, '0')}</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{props.currentSeason.seasonPoints.toLocaleString()} SP</p>
                </div>
            </header>

            <TaskComposer today={props.today} />

            <div className="mx-auto mt-10 max-w-5xl space-y-9">
                <TaskListSection count={props.todayTasks.length} description="Scheduled for your current calendar day." emptyMessage="Today is clear. Add a Task when something needs your attention." title="Today">
                    {props.todayTasks.map(renderTask)}
                </TaskListSection>

                <TaskListSection count={props.upcomingTasks.length} description="Future one-time Tasks and the next pending occurrence from each recurring series." emptyMessage="No upcoming Tasks." title="Upcoming">
                    {props.upcomingTasks.map(renderTask)}
                </TaskListSection>

                <TaskListSection count={props.overdueTasks.total} description="Incomplete Tasks whose scheduled date has passed." emptyMessage="Nothing overdue." title="Overdue">
                    {props.overdueTasks.data.map(renderTask)}
                    {props.overdueTasks.last_page > 1 && <TaskPagination label="Overdue Task pages" links={props.overdueTasks.links} />}
                </TaskListSection>

                <TaskListSection count={props.completedTasks.total} description="Recent earned rewards and completion history." emptyMessage="Completed Tasks will appear here." title="Completed">
                    {props.completedTasks.data.map(renderTask)}
                    {props.completedTasks.last_page > 1 && (
                        <TaskPagination label="Completed Task pages" links={props.completedTasks.links} />
                    )}
                </TaskListSection>
            </div>

            {selectedTask && <TaskDetailsDrawer key={selectedTask.id} onClose={() => setSelectedTaskId(null)} task={selectedTask} />}
        </div>
    );
}
