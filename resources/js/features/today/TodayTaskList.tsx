import { Link } from '@inertiajs/react';
import { ChevronDown, ListTodo } from 'lucide-react';

import type { TaskViewData } from '../tasks/types';
import { TodayTaskRow } from './TodayTaskRow';

interface TodayTaskListProps {
    tasks: TaskViewData[];
    overdue: TaskViewData[];
    overdueCount: number;
    headingId: string;
    onOpen: (taskId: number) => void;
}

export function TodayTaskList({ tasks, overdue, overdueCount, headingId, onOpen }: TodayTaskListProps) {
    const pendingTasks = tasks.filter((task) => task.state !== 'completed');
    const completedTasks = tasks.filter((task) => task.state === 'completed');
    const remainingCount = pendingTasks.length + overdueCount;

    return (
        <section aria-labelledby={headingId} className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent-ink"><ListTodo size={20} /></span>
                    <div>
                        <h2 className="text-2xl font-bold leading-none" id={headingId}>Tasks</h2>
                        <p className="mt-1 text-xs text-muted">Today and overdue</p>
                    </div>
                </div>
                <span className="shrink-0 rounded-full border border-border-subtle bg-elevated px-3 py-1.5 text-xs font-bold text-secondary"><span className="today-count-change inline-block" key={remainingCount}>{remainingCount}</span> left</span>
            </div>

            {overdue.length > 0 && (
                <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-bold tracking-[0.14em] text-warning uppercase">Overdue</h3>
                        <span className="text-xs font-semibold text-muted">{overdueCount}</span>
                    </div>
                    <div className="today-glass-inner today-glass-warning overflow-hidden rounded-2xl px-4">
                        {overdue.map((task) => <TodayTaskRow key={task.id} onOpen={() => onOpen(task.id)} task={task} />)}
                        {overdueCount > overdue.length && (
                            <Link className="focus-ring block border-t border-border-subtle py-3 text-center text-xs font-bold text-warning" href="/tasks">
                                +{overdueCount - overdue.length} more
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <h3 className="mb-2 text-xs font-bold tracking-[0.14em] text-muted uppercase">Today</h3>
            <div className="today-glass-inner overflow-hidden rounded-2xl px-4">
                {pendingTasks.length > 0
                    ? pendingTasks.map((task) => <TodayTaskRow key={task.id} onOpen={() => onOpen(task.id)} task={task} />)
                    : <div className="py-6 text-sm text-muted">
                        <p>{completedTasks.length > 0 ? 'All of today’s tasks are complete.' : 'No tasks scheduled for today.'}</p>
                        <Link className="focus-ring mt-2 inline-block font-bold text-accent-ink hover:underline" href="/tasks">Open Tasks</Link>
                    </div>}
            </div>

            {completedTasks.length > 0 && (
                <details className="today-glass-inner group mt-3 overflow-hidden rounded-2xl">
                    <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4">
                        <span className="text-sm font-bold text-secondary">Completed</span>
                        <span className="icon-text flex items-center gap-2 text-xs text-muted">
                            <span className="today-count-change" key={completedTasks.length}>{completedTasks.length}</span>
                            <ChevronDown aria-hidden="true" className="transition-transform group-open:rotate-180" size={16} />
                        </span>
                    </summary>
                    <div className="border-t border-border-subtle px-4">
                        {completedTasks.map((task) => <TodayTaskRow key={task.id} onOpen={() => onOpen(task.id)} task={task} />)}
                    </div>
                </details>
            )}
        </section>
    );
}
