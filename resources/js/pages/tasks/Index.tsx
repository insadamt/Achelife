import { Head, router } from '@inertiajs/react';
import { Undo2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '../../components/ui';
import { TaskComposer } from '../../features/tasks/TaskComposer';
import { TaskDetailsDrawer } from '../../features/tasks/TaskDetailsDrawer';
import { TaskPagination } from '../../features/tasks/TaskPagination';
import { TaskRow } from '../../features/tasks/TaskRow';
import { TaskTabs } from '../../features/tasks/TaskTabs';
import type { TaskTab } from '../../features/tasks/TaskTabs';
import type { PaginatedTasks, TaskViewData } from '../../features/tasks/types';

interface TasksPageProps {
    today: string;
    todayTasks: TaskViewData[];
    upcomingTasks: TaskViewData[];
    overdueTasks: PaginatedTasks;
    completedTasks: PaginatedTasks;
    intermission: boolean;
}

const emptyMessages: Record<TaskTab, string> = {
    today: 'No tasks today.',
    overdue: 'Nothing overdue.',
    upcoming: 'No upcoming tasks.',
    completed: 'No completed tasks.',
};

export default function TasksIndex(props: TasksPageProps) {
    const [activeTab, setActiveTab] = useState<TaskTab>('today');
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [completedRows, setCompletedRows] = useState(props.completedTasks.data);
    const [loadingMoreCompleted, setLoadingMoreCompleted] = useState(false);
    const [recentlyCompletedTask, setRecentlyCompletedTask] = useState<TaskViewData | null>(null);

    useEffect(() => {
        if (!recentlyCompletedTask) return;
        const timeout = window.setTimeout(() => setRecentlyCompletedTask(null), 6000);
        return () => window.clearTimeout(timeout);
    }, [recentlyCompletedTask]);

    const visibleCompletedRows = props.completedTasks.current_page === 1 ? props.completedTasks.data : completedRows;
    const tasksByTab: Record<TaskTab, TaskViewData[]> = {
        today: props.todayTasks,
        overdue: props.overdueTasks.data,
        upcoming: props.upcomingTasks,
        completed: visibleCompletedRows,
    };
    const counts: Record<TaskTab, number> = {
        today: props.todayTasks.length,
        overdue: props.overdueTasks.total,
        upcoming: props.upcomingTasks.length,
        completed: props.completedTasks.total,
    };
    const allVisibleTasks = [...props.todayTasks, ...props.upcomingTasks, ...props.overdueTasks.data, ...visibleCompletedRows];
    const selectedTask = allVisibleTasks.find((task) => task.id === selectedTaskId) ?? null;
    const nextCompletedPage = props.completedTasks.links.at(-1)?.url ?? null;

    function loadMoreCompleted() {
        if (!nextCompletedPage || loadingMoreCompleted) return;
        router.get(nextCompletedPage, {}, {
            only: ['completedTasks'],
            preserveScroll: true,
            preserveState: true,
            preserveUrl: true,
            onStart: () => setLoadingMoreCompleted(true),
            onSuccess: (page) => {
                const nextTasks = page.props.completedTasks as PaginatedTasks;
                setCompletedRows((currentRows) => {
                    const baseRows = props.completedTasks.current_page === 1 ? props.completedTasks.data : currentRows;
                    const loadedIds = new Set(baseRows.map((task) => task.id));
                    return [...baseRows, ...nextTasks.data.filter((task) => !loadedIds.has(task.id))];
                });
            },
            onFinish: () => setLoadingMoreCompleted(false),
        });
    }

    function undoCompletion() {
        if (!recentlyCompletedTask) return;
        router.delete(`/tasks/${recentlyCompletedTask.id}/completion`, {
            preserveScroll: true,
            onSuccess: () => setRecentlyCompletedTask(null),
        });
    }

    return (
        <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
            <Head title="Tasks" />

            <div className="mx-auto max-w-5xl">
                <h1 className="mb-6 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Tasks</h1>
                {props.intermission && (
                    <p className="mb-5 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">
                        Intermission: keep planning and rescheduling Tasks. Completion and SP resume when your next Season starts.
                    </p>
                )}
                <TaskComposer today={props.today} />

                <div className="mt-7">
                    <TaskTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />

                    <section
                        aria-labelledby={`task-tab-${activeTab}`}
                        className="mt-5"
                        id={`task-panel-${activeTab}`}
                        role="tabpanel"
                    >
                        {tasksByTab[activeTab].length > 0 ? (
                            <div className="space-y-2">
                                {tasksByTab[activeTab].map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        onCompleted={setRecentlyCompletedTask}
                                        onOpen={() => setSelectedTaskId(task.id)}
                                        task={task}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="py-12 text-center text-sm text-muted">{emptyMessages[activeTab]}</p>
                        )}

                        {activeTab === 'overdue' && props.overdueTasks.last_page > 1 && (
                            <TaskPagination label="Overdue task pages" links={props.overdueTasks.links} />
                        )}
                        {activeTab === 'completed' && props.completedTasks.current_page < props.completedTasks.last_page && (
                            <Button className="mx-auto mt-5 flex" disabled={loadingMoreCompleted} onClick={loadMoreCompleted} variant="secondary">
                                {loadingMoreCompleted ? 'Loading…' : 'Load more'}
                            </Button>
                        )}
                    </section>
                </div>
            </div>

            {selectedTask && <TaskDetailsDrawer key={selectedTask.id} onClose={() => setSelectedTaskId(null)} task={selectedTask} today={props.today} />}

            {recentlyCompletedTask && (
                <div aria-live="polite" className="fixed right-4 bottom-24 left-4 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border-strong bg-elevated p-3 shadow-2xl md:bottom-6">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">Task completed</span>
                    <button className="focus-ring icon-text flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-[var(--module-accent)] hover:bg-surface-hover" onClick={undoCompletion} type="button">
                        <Undo2 aria-hidden="true" size={15} />
                        Undo
                    </button>
                    <button aria-label="Dismiss" className="focus-ring grid size-10 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => setRecentlyCompletedTask(null)} type="button">
                        <X aria-hidden="true" size={17} />
                    </button>
                </div>
            )}
        </div>
    );
}
