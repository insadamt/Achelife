import { router } from '@inertiajs/react';
import { CalendarDays, Check, ListChecks, Repeat2, Star } from 'lucide-react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { ExpandableTaskChecklist } from './ExpandableTaskChecklist';
import { formatTaskDate } from './taskPresentation';
import type { TaskViewData } from './types';

export function TaskRow({ task, onOpen, onCompleted }: {
    task: TaskViewData;
    onOpen: () => void;
    onCompleted?: (task: TaskViewData) => void;
}) {
    const [processing, setProcessing] = useState(false);
    const completed = task.state === 'completed';

    function toggleCompletion() {
        if (processing || task.completionLocked || (!completed && !task.canComplete)) return;
        setProcessing(true);

        if (completed) {
            router.delete(`/tasks/${task.id}/completion`, {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            });
            return;
        }

        router.post(`/tasks/${task.id}/completion`, {}, {
            preserveScroll: true,
            onSuccess: () => onCompleted?.(task),
            onFinish: () => setProcessing(false),
        });
    }

    const completionLabel = completed
        ? task.completionLocked
            ? 'Completion locked'
            : `Mark ${task.title} incomplete`
        : task.canComplete
          ? `Complete ${task.title}`
          : `Open ${task.title} to finish its checklist`;

    return (
        <article className={classNames(
            'overflow-hidden rounded-2xl border bg-surface transition-[border-color,background-color] hover:border-border-strong hover:bg-surface-hover/30',
            completed ? 'border-border-subtle' : 'border-border-strong/70',
        )}>
            <div className="flex items-center gap-3 p-3 sm:p-4">
                <button
                aria-label={completionLabel}
                className={classNames(
                    'focus-ring grid size-11 shrink-0 place-items-center rounded-full border-2 transition-[background-color,border-color,color,transform]',
                    completed && 'border-[var(--module-accent)] bg-[var(--module-accent)] text-accent-foreground',
                    !completed && task.canComplete && 'border-border-strong text-transparent hover:scale-105 hover:border-[var(--module-accent)]',
                    !completed && !task.canComplete && 'border-border-subtle text-muted',
                    task.completionLocked && 'cursor-not-allowed opacity-55',
                )}
                disabled={processing || task.completionLocked}
                onClick={task.canComplete || completed ? toggleCompletion : onOpen}
                title={completionLabel}
                type="button"
            >
                {completed ? <Check size={18} strokeWidth={2.8} /> : task.canComplete ? <span aria-hidden="true">•</span> : <ListChecks size={17} />}
                </button>

                <button className="focus-ring min-w-0 flex-1 rounded-xl text-left" onClick={onOpen} type="button">
                <span className="flex items-center gap-2">
                    <span className={classNames(
                        'truncate text-base font-bold text-foreground sm:text-lg',
                        completed && 'text-secondary line-through decoration-border-strong',
                    )}>
                        {task.title}
                    </span>
                    {task.important && <Star aria-label="Important" className="shrink-0 text-warning" fill="currentColor" size={15} />}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
                    <span className={classNames('icon-text inline-flex items-center gap-1', task.state === 'overdue' && 'text-warning')}>
                        <CalendarDays aria-hidden="true" size={13} />
                        {formatTaskDate(task.scheduledDate)}
                    </span>
                    {task.recurrence && <span aria-label={task.recurrence.label} className="inline-flex items-center" title={task.recurrence.label}><Repeat2 size={13} /></span>}
                </span>
                </button>

                <span className={classNames(
                    'shrink-0 rounded-full bg-elevated px-2.5 py-1 text-sm font-bold',
                    completed ? 'text-success' : 'text-[var(--module-accent)]',
                )}>
                    +{completed ? task.earnedSp : task.projectedSp} SP
                </span>
            </div>
            <ExpandableTaskChecklist task={task} />
        </article>
    );
}
