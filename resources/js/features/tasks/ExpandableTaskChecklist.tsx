import { router } from '@inertiajs/react';
import { Check, ChevronDown, ListChecks } from 'lucide-react';
import { useId, useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import type { TaskViewData } from './types';

export function ExpandableTaskChecklist({ task, compact = false }: {
    task: TaskViewData;
    compact?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [processingSubtaskId, setProcessingSubtaskId] = useState<number | null>(null);
    const checklistId = useId();

    if (task.totalSubtasks === 0) return null;

    function toggleSubtask(subtaskId: number, completed: boolean) {
        if (task.state === 'completed' || processingSubtaskId !== null) return;
        setProcessingSubtaskId(subtaskId);
        router.put(`/tasks/${task.id}/subtasks/${subtaskId}`, { completed }, {
            preserveScroll: true,
            onFinish: () => setProcessingSubtaskId(null),
        });
    }

    return (
        <div className="border-t border-border-subtle">
            <button
                aria-expanded={expanded}
                aria-controls={checklistId}
                aria-label={`${expanded ? 'Hide' : 'Show'} checklist for ${task.title}`}
                className={classNames(
                    'focus-ring icon-text flex w-full items-center gap-2 rounded-xl text-xs font-bold text-muted hover:text-foreground',
                    compact ? 'min-h-10 px-1' : 'min-h-11 px-4',
                )}
                onClick={() => setExpanded(!expanded)}
                type="button"
            >
                <ListChecks aria-hidden="true" size={14} />
                <span>Checklist</span>
                <span className="ml-auto tabular-nums">{task.completedSubtasks}/{task.totalSubtasks}</span>
                <span aria-hidden="true" className="h-1.5 w-14 overflow-hidden rounded-full bg-border-subtle">
                    <span className="block h-full rounded-full bg-[var(--task-accent)] transition-[width]" style={{ width: `${(task.completedSubtasks / task.totalSubtasks) * 100}%` }} />
                </span>
                <ChevronDown aria-hidden="true" className={classNames('transition-transform', expanded && 'rotate-180')} size={15} />
            </button>

            {expanded && (
                <div className={classNames('max-h-72 space-y-1 overflow-y-auto pb-3', compact ? 'px-1' : 'px-4')} id={checklistId}>
                    {task.subtasks.map((subtask) => (
                        <label className={classNames('flex min-h-10 items-center gap-2.5 rounded-xl px-2 text-sm text-secondary transition-colors', task.state === 'completed' ? 'cursor-default' : 'cursor-pointer hover:bg-surface-hover')} key={subtask.id}>
                            <input
                                aria-label={`Mark ${subtask.title} ${subtask.completed ? 'incomplete' : 'complete'}`}
                                checked={subtask.completed}
                                className="peer sr-only"
                                disabled={task.state === 'completed' || processingSubtaskId !== null}
                                onChange={() => toggleSubtask(subtask.id, !subtask.completed)}
                                type="checkbox"
                            />
                            <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-border-strong text-transparent transition-colors peer-checked:border-[var(--task-accent)] peer-checked:bg-[var(--task-accent)] peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--task-accent)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-elevated peer-disabled:opacity-45">
                                <Check aria-hidden="true" size={12} strokeWidth={3} />
                            </span>
                            <span className={classNames('leading-5', subtask.completed && 'text-muted line-through')}>{subtask.title}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
