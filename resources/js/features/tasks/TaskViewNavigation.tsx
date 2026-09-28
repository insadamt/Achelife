import { Link } from '@inertiajs/react';

import { classNames } from '../../components/ui/classNames';
import type { ProjectTaskView, TaskWorkspaceViewData } from './types';

interface TaskViewCount {
    completed: number;
    overdue: number;
    today: number;
    upcoming: number;
}

const taskViews: Array<{ label: string; view: ProjectTaskView }> = [
    { view: 'today', label: 'Today' },
    { view: 'overdue', label: 'Overdue' },
    { view: 'upcoming', label: 'Upcoming' },
    { view: 'completed', label: 'Completed' },
];

export function TaskViewNavigation({ counts, workspace }: {
    counts: TaskViewCount;
    workspace: TaskWorkspaceViewData;
}) {
    return (
        <nav aria-label="Task views" className="mt-7 overflow-x-auto rounded-2xl border border-border-subtle bg-surface p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-horizontal-nav="task-view">
            <div className="grid min-w-[34rem] grid-cols-4 gap-1 sm:min-w-0">
                {taskViews.map((item) => {
                    const active = workspace.taskView === item.view;

                    return (
                        <Link
                            aria-current={active ? 'page' : undefined}
                            className={classNames(
                                'focus-ring flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-[background-color,color,box-shadow] duration-200',
                                active
                                    ? 'bg-elevated text-foreground shadow-sm'
                                    : 'text-secondary hover:bg-surface-hover hover:text-foreground',
                            )}
                            href={taskViewHref(workspace, item.view)}
                            key={item.view}
                        >
                            <span>{item.label}</span>
                            <span className="rounded-full bg-surface px-1.5 py-0.5 text-[0.68rem] leading-none text-secondary">{counts[item.view]}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

function taskViewHref(workspace: TaskWorkspaceViewData, taskView: ProjectTaskView): string {
    if (workspace.view !== 'project' && workspace.view !== 'inbox') {
        return `/tasks?${new URLSearchParams({ view: taskView }).toString()}`;
    }

    const parameters = new URLSearchParams({ view: workspace.view, task_view: taskView });
    if (workspace.projectId !== null) parameters.set('project', String(workspace.projectId));
    return `/tasks?${parameters.toString()}`;
}
