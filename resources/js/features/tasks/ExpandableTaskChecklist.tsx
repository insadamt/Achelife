import { router } from '@inertiajs/react';
import { ChevronDown, ListChecks } from 'lucide-react';
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
                <span>{task.completedSubtasks}/{task.totalSubtasks}</span>
                <ChevronDown aria-hidden="true" className={classNames('ml-auto transition-transform', expanded && 'rotate-180')} size={15} />
            </button>

            {expanded && (
                <div className={classNames('space-y-1.5 pb-3', compact ? 'px-1' : 'px-4')} id={checklistId}>
                    {task.subtasks.map((subtask) => (
                        <label className={classNames('flex min-h-9 items-center gap-2.5 text-sm text-secondary', task.state === 'completed' ? 'cursor-default' : 'cursor-pointer')} key={subtask.id}>
                            <input
                                aria-label={`Mark ${subtask.title} ${subtask.completed ? 'incomplete' : 'complete'}`}
                                checked={subtask.completed}
                                className="size-4.5 shrink-0 accent-[var(--task-accent)]"
                                disabled={task.state === 'completed' || processingSubtaskId !== null}
                                onChange={() => toggleSubtask(subtask.id, !subtask.completed)}
                                type="checkbox"
                            />
                            <span className={classNames('leading-5', subtask.completed && 'text-muted line-through')}>{subtask.title}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
