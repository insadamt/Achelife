import { router } from '@inertiajs/react';
import { useState } from 'react';

import { StatusChip } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { formatCompletionDate, formatTaskDate } from './taskPresentation';
import type { TaskViewData } from './types';

export function TaskRow({ task, onOpen }: { task: TaskViewData; onOpen: () => void }) {
    const [processing, setProcessing] = useState(false);
    const completed = task.state === 'completed';

    function toggleCompletion() {
        if (processing || task.completionLocked || (!completed && !task.canComplete)) return;
        setProcessing(true);

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        if (completed) router.delete(`/tasks/${task.id}/completion`, options);
        else router.post(`/tasks/${task.id}/completion`, {}, options);
    }

    function toggleSubtask(subtaskId: number, nextCompleted: boolean) {
        router.put(`/tasks/${task.id}/subtasks/${subtaskId}`, { completed: nextCompleted }, { preserveScroll: true });
    }

    const completionLabel = completed
        ? task.completionLocked
            ? 'Completion locked'
            : `Mark ${task.title} incomplete`
        : task.canComplete
          ? `Complete ${task.title}`
          : `Complete all subtasks before completing ${task.title}`;

    return (
        <article className={classNames('group rounded-2xl border bg-surface transition-[border-color,background-color,transform] duration-200 hover:border-border-strong', completed ? 'border-border-subtle' : 'border-border-strong/70 hover:bg-surface-hover/40')}>
            <div className="flex items-start gap-3 p-3 sm:items-center sm:p-4">
                <button
                    aria-label={completionLabel}
                    className={classNames(
                        'focus-ring mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-[background-color,border-color,color,transform] sm:mt-0',
                        completed && 'border-[var(--module-accent)] bg-[var(--module-accent)] text-accent-foreground',
                        !completed && task.canComplete && 'border-border-strong text-transparent hover:scale-105 hover:border-[var(--module-accent)]',
                        !completed && !task.canComplete && 'cursor-not-allowed border-border-subtle text-transparent opacity-45',
                        task.completionLocked && 'cursor-not-allowed opacity-65',
                    )}
                    disabled={processing || task.completionLocked || (!completed && !task.canComplete)}
                    onClick={toggleCompletion}
                    title={completionLabel}
                    type="button"
                >
                    {completed ? '✓' : '○'}
                </button>

                <button className="focus-ring min-w-0 flex-1 rounded-xl text-left" onClick={onOpen} type="button">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={classNames('text-base font-bold text-foreground sm:text-lg', completed && 'text-secondary line-through decoration-border-strong')}>{task.title}</span>
                        {task.important && <span className="text-xs text-warning" aria-label="Important">★</span>}
                        {task.recurrence && <span className="text-xs text-muted" title={task.recurrence.label}>↻</span>}
                        {task.state === 'overdue' && <StatusChip status="warning">Overdue</StatusChip>}
                        {task.completionLocked && <StatusChip status="locked">Locked</StatusChip>}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
                        <span>{formatTaskDate(task.scheduledDate)}</span>
                        {task.totalSubtasks > 0 && <span>{task.completedSubtasks} / {task.totalSubtasks} subtasks</span>}
                        {task.originalScheduledDate && task.originalScheduledDate !== task.scheduledDate && <span>Rescheduled from {formatTaskDate(task.originalScheduledDate)}</span>}
                        {task.completedAt && <span>Completed {formatCompletionDate(task.completedAt)}</span>}
                    </span>
                </button>

                <div className="shrink-0 text-right">
                    <p className={classNames('text-lg font-bold', completed ? 'text-success' : 'text-[var(--module-accent)]')}>
                        +{completed ? task.earnedSp : task.projectedSp} SP
                    </p>
                    <p className="max-w-32 text-[0.5625rem] font-bold tracking-[0.07em] text-muted uppercase">
                        {completed ? 'Earned' : task.rewardContext}
                    </p>
                </div>
            </div>

            {task.totalSubtasks > 0 && !completed && (
                <details className="border-t border-border-subtle px-4 py-2">
                    <summary className="focus-ring cursor-pointer rounded py-1 text-xs font-bold tracking-[0.1em] text-muted uppercase hover:text-foreground">Checklist</summary>
                    <div className="space-y-1.5 py-2">
                        {task.subtasks.map((subtask) => (
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary" key={subtask.id}>
                                <input className="accent-[var(--module-accent)]" checked={subtask.completed} onChange={() => toggleSubtask(subtask.id, !subtask.completed)} type="checkbox" />
                                <span className={subtask.completed ? 'line-through text-muted' : ''}>{subtask.title}</span>
                            </label>
                        ))}
                    </div>
                </details>
            )}
        </article>
    );
}
