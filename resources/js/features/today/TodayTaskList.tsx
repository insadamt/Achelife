import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

import type { TaskViewData } from '../tasks/types';
import { TodayTaskRow } from './TodayTaskRow';

interface TodayTaskListProps {
    tasks: TaskViewData[];
    overdue: TaskViewData[];
    overdueCount: number;
}

export function TodayTaskList({ tasks, overdue, overdueCount }: TodayTaskListProps) {
    const pendingTasks = tasks.filter((task) => task.state !== 'completed');
    const completedTasks = tasks.filter((task) => task.state === 'completed');

    return (
        <section aria-labelledby="today-task-list-title" className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold" id="today-task-list-title">Tasks</h2>
                <span className="text-sm font-semibold text-muted">{pendingTasks.length}</span>
            </div>

            {overdue.length > 0 && (
                <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold tracking-[0.14em] text-warning uppercase">Overdue</h3>
                        <span className="text-xs font-semibold text-muted">{overdueCount}</span>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-warning/25 bg-warning/5 px-4">
                        {overdue.map((task) => <TodayTaskRow key={task.id} task={task} />)}
                        {overdueCount > overdue.length && (
                            <Link className="focus-ring block border-t border-border-subtle py-3 text-center text-xs font-bold text-warning" href="/tasks">
                                +{overdueCount - overdue.length} more
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <h3 className="mb-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">Today</h3>
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface px-4">
                {pendingTasks.length > 0
                    ? pendingTasks.map((task) => <TodayTaskRow key={task.id} task={task} />)
                    : <p className="py-6 text-sm text-muted">No tasks.</p>}
            </div>

            {completedTasks.length > 0 && (
                <details className="group mt-3 overflow-hidden rounded-2xl border border-border-subtle bg-surface">
                    <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4">
                        <span className="text-sm font-bold text-secondary">Completed</span>
                        <span className="icon-text flex items-center gap-2 text-xs text-muted">
                            {completedTasks.length}
                            <ChevronDown aria-hidden="true" className="transition-transform group-open:rotate-180" size={16} />
                        </span>
                    </summary>
                    <div className="border-t border-border-subtle px-4">
                        {completedTasks.map((task) => <TodayTaskRow key={task.id} task={task} />)}
                    </div>
                </details>
            )}
        </section>
    );
}
