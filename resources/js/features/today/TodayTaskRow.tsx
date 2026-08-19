import { router } from '@inertiajs/react';
import { AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { ExpandableTaskChecklist } from '../tasks/ExpandableTaskChecklist';
import type { TaskViewData } from '../tasks/types';

export function TodayTaskRow({ task }: { task: TaskViewData }) {
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
        <div className={classNames('border-b border-border-subtle last:border-b-0', completed && 'opacity-55')}>
            <div className="flex min-h-16 items-center gap-3 px-1 py-2">
                <button
                aria-label={completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                className={classNames(
                    'focus-ring grid size-9 shrink-0 place-items-center rounded-full border-2 transition-[background-color,border-color,box-shadow,transform] hover:scale-105',
                    completed
                        ? 'border-[var(--task-accent)] bg-[var(--task-accent)] text-accent-foreground shadow-[0_0_20px_color-mix(in_srgb,var(--task-accent)_20%,transparent)]'
                        : 'border-border-strong bg-elevated hover:border-[var(--task-accent)]',
                    !canToggle && 'cursor-not-allowed opacity-45',
                )}
                disabled={!canToggle || processing}
                onClick={toggleCompletion}
                type="button"
            >
                {completed && <Check aria-hidden="true" size={18} strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className={classNames('truncate text-base font-bold', completed && 'line-through')}>{task.title}</p>
                        {task.important && <span aria-label="Important" className="size-1.5 shrink-0 rounded-full bg-warning" title="Important" />}
                    </div>
                </div>
                {task.state === 'overdue' && <span className="icon-text flex shrink-0 items-center gap-1.5 text-xs font-bold text-warning"><AlertTriangle aria-hidden="true" size={14} /><span>Overdue</span></span>}
                {completed && task.earnedSp !== null && <span className="shrink-0 text-xs font-bold text-[var(--task-accent)]">+{task.earnedSp} SP</span>}
            </div>
            <ExpandableTaskChecklist compact task={task} />
        </div>
    );
}
