import { router } from '@inertiajs/react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import type { TaskViewData } from '../tasks/types';

export function TodayTaskRow({ task, onOpen }: { task: TaskViewData; onOpen: () => void }) {
    const [processing, setProcessing] = useState(false);
    const completed = task.state === 'completed';
    const canToggle = completed ? task.canUncomplete : task.canComplete;

    function toggleCompletion() {
        if (!canToggle || processing) return;
        setProcessing(true);
        const options = { preserveScroll: true, onFinish: () => setProcessing(false) };

        if (completed) router.delete(`/tasks/${task.id}/completion`, options);
        else router.post(`/tasks/${task.id}/completion`, {}, options);
    }

    return (
        <div className={classNames('flex items-center gap-3 border-b border-border-subtle px-1 py-3 last:border-b-0', completed && 'opacity-65')}>
            <button
                aria-label={completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                className={classNames(
                    'focus-ring grid size-9 shrink-0 place-items-center rounded-full border-2 font-bold transition-colors',
                    completed ? 'border-success bg-success text-accent-foreground' : 'border-border-strong hover:border-[var(--task-accent)]',
                    !canToggle && 'cursor-not-allowed opacity-45',
                )}
                disabled={!canToggle || processing}
                onClick={toggleCompletion}
                type="button"
            >
                {completed ? '✓' : '○'}
            </button>
            <button className="focus-ring min-w-0 flex-1 rounded-lg text-left" onClick={onOpen} type="button">
                <span className={classNames('block truncate text-base font-bold', completed && 'line-through')}>{task.title}</span>
                {task.totalSubtasks > 0 && <span className="mt-0.5 block text-xs text-muted">{task.completedSubtasks} / {task.totalSubtasks} subtasks</span>}
            </button>
            <div className="shrink-0 text-right">
                <p className={classNames('text-sm font-bold', completed ? 'text-success' : 'text-[var(--task-accent)]')}>+{completed ? task.earnedSp : task.projectedSp} SP</p>
                {task.state === 'overdue' && <p className="text-[0.625rem] font-bold tracking-wider text-warning uppercase">Overdue</p>}
            </div>
        </div>
    );
}
