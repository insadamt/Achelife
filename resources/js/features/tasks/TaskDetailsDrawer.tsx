import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Checkbox, Drawer, Field, StatusChip } from '../../components/ui';
import { formatCompletionDate, formatTaskDateLong } from './taskPresentation';
import { RecurrenceControls } from './RecurrenceControls';
import { SubtaskEditor } from './SubtaskEditor';
import type { TaskFormData, TaskViewData } from './types';

interface TaskDetailsDrawerProps {
    task: TaskViewData;
    onClose: () => void;
}

export function TaskDetailsDrawer({ task, onClose }: TaskDetailsDrawerProps) {
    const completed = task.state === 'completed';
    const form = useForm<TaskFormData>({
        title: task.title,
        scheduled_date: task.scheduledDate,
        important: task.important,
        recurrence_type: task.recurrence?.type ?? null,
        weekdays: task.recurrence?.weekdays ?? [],
        subtasks: task.subtasks.map((subtask) => ({ id: subtask.id, title: subtask.title })),
    });

    function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            title: data.title.trim(),
            weekdays: data.recurrence_type === 'weekdays' ? data.weekdays : [],
            subtasks: data.subtasks.filter((subtask) => subtask.title.trim()).map((subtask) => ({ ...subtask, title: subtask.title.trim() })),
        }));
        form.put(`/tasks/${task.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    function markIncomplete() {
        router.delete(`/tasks/${task.id}/completion`, { preserveScroll: true, onSuccess: onClose });
    }

    function deleteOccurrence() {
        router.delete(`/tasks/${task.id}`, { preserveScroll: true, onSuccess: onClose });
    }

    function deleteThisAndFuture() {
        router.delete(`/tasks/${task.id}/future`, { preserveScroll: true, onSuccess: onClose });
    }

    function toggleSubtask(subtaskId: number, nextCompleted: boolean) {
        router.put(`/tasks/${task.id}/subtasks/${subtaskId}`, { completed: nextCompleted }, { preserveScroll: true });
    }

    return (
        <Drawer description="Task details, scheduling, recurrence, checklist, and allowed actions." onClose={onClose} open title="Task details">
            {completed ? (
                <div>
                    <div className="flex items-center gap-2">
                        <StatusChip status={task.completionLocked ? 'locked' : 'completed'}>{task.completionLocked ? 'Locked' : 'Completed'}</StatusChip>
                        {task.recurrence && <span className="text-xs font-bold text-muted">↻ {task.recurrence.label}</span>}
                    </div>
                    <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-foreground">{task.title}</h3>
                    <p className="mt-2 text-sm text-secondary">Scheduled {formatTaskDateLong(task.scheduledDate)}</p>

                    <div className="mt-6 rounded-2xl border border-success/25 bg-success/7 p-5">
                        <p className="text-xs font-bold tracking-[0.15em] text-success uppercase">Reward earned</p>
                        <p className="mt-1 text-4xl font-bold text-foreground">+{task.earnedSp} SP</p>
                        <p className="mt-2 text-sm text-secondary">{task.rewardContext}</p>
                        {task.lateRewardReduced && <p className="mt-1 text-xs font-bold text-warning">50% late reward</p>}
                        {task.completedAt && <p className="mt-4 text-xs text-muted">Completed {formatCompletionDate(task.completedAt)} · Season {task.rewardSeasonNumber}</p>}
                    </div>

                    {task.subtasks.length > 0 && (
                        <div className="mt-7">
                            <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Subtask snapshot</p>
                            <ul className="mt-3 space-y-2">
                                {task.subtasks.map((subtask) => <li className="flex gap-2 text-sm text-secondary" key={subtask.id}><span className="text-success">✓</span>{subtask.title}</li>)}
                            </ul>
                        </div>
                    )}

                    <div className="mt-8 border-t border-border-subtle pt-6">
                        {task.canUncomplete ? (
                            <Button fullWidth onClick={markIncomplete} variant="secondary">Mark incomplete</Button>
                        ) : (
                            <p className="rounded-2xl border border-border-subtle bg-app p-4 text-sm leading-6 text-muted">This completion belongs to a finished Season. Its Task and awarded SP are permanently locked.</p>
                        )}
                    </div>
                </div>
            ) : (
                <form onSubmit={save}>
                    <div className="rounded-2xl border border-border-subtle bg-app p-4">
                        <p className="text-xs font-bold tracking-[0.14em] text-[var(--module-accent)] uppercase">Current reward</p>
                        <p className="mt-1 text-3xl font-bold text-foreground">+{task.projectedSp} SP</p>
                        <p className="mt-1 text-sm text-secondary">{task.rewardContext}</p>
                        {task.lateRewardReduced && <p className="mt-1 text-xs font-bold text-warning">50% late reward</p>}
                    </div>

                    <div className="mt-6 space-y-5">
                        <Field error={form.errors.title} label="Title" onChange={(event) => form.setData('title', event.target.value)} required value={form.data.title} />
                        <Field error={form.errors.scheduled_date} label="Scheduled date" onChange={(event) => form.setData('scheduled_date', event.target.value)} required type="date" value={form.data.scheduled_date} />
                        <Checkbox checked={form.data.important} label="Important" onChange={(event) => form.setData('important', event.target.checked)} />
                    </div>

                    <div className="mt-7 border-t border-border-subtle pt-6">
                        <p className="mb-3 text-xs font-bold tracking-[0.14em] text-muted uppercase">Recurrence</p>
                        {task.recurrence ? (
                            <RecurrenceControls
                                allowNone={false}
                                onTypeChange={(type) => type && form.setData('recurrence_type', type)}
                                onWeekdaysChange={(weekdays) => form.setData('weekdays', weekdays)}
                                type={form.data.recurrence_type}
                                weekdays={form.data.weekdays}
                            />
                        ) : <p className="text-sm text-secondary">Does not repeat</p>}
                        {task.recurrence && <p className="mt-3 text-xs leading-5 text-muted">Changes apply to this occurrence and future occurrences. Earlier history stays unchanged.</p>}
                    </div>

                    <div className="mt-7 border-t border-border-subtle pt-6">
                        <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Checklist</p>
                        {task.subtasks.length > 0 && (
                            <div className="mt-3 mb-5 space-y-2 rounded-2xl bg-app p-3">
                                {task.subtasks.map((subtask) => (
                                    <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary" key={subtask.id}>
                                        <input checked={subtask.completed} className="accent-[var(--module-accent)]" onChange={() => toggleSubtask(subtask.id, !subtask.completed)} type="checkbox" />
                                        <span className={subtask.completed ? 'line-through text-muted' : ''}>{subtask.title}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <SubtaskEditor onChange={(subtasks) => form.setData('subtasks', subtasks)} subtasks={form.data.subtasks} />
                    </div>

                    {task.rescheduleHistory.length > 0 && (
                        <div className="mt-7 border-t border-border-subtle pt-6">
                            <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Scheduling history</p>
                            <ul className="mt-3 space-y-2 text-sm text-secondary">
                                {task.rescheduleHistory.map((reschedule, index) => <li key={`${reschedule.rescheduledAt}-${index}`}>{formatTaskDateLong(reschedule.fromDate)} → {formatTaskDateLong(reschedule.toDate)}</li>)}
                            </ul>
                        </div>
                    )}

                    <Button className="mt-8" disabled={form.processing || !form.data.title.trim()} fullWidth type="submit">Save changes</Button>

                    <div className="mt-8 border-t border-border-subtle pt-6">
                        <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Remove</p>
                        <div className="mt-3 space-y-2">
                            <Button fullWidth onClick={deleteOccurrence} variant="destructive">{task.recurrence ? 'Delete this occurrence' : 'Delete Task'}</Button>
                            {task.recurrence && <Button fullWidth onClick={deleteThisAndFuture} variant="destructive">Delete this and future occurrences</Button>}
                        </div>
                    </div>
                </form>
            )}
        </Drawer>
    );
}
