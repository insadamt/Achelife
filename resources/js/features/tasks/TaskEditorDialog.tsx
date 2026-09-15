import { router, useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Dialog, Field, SelectField } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { projectedReward } from './taskPresentation';
import { RecurrenceControls } from './RecurrenceControls';
import { SubtaskEditor } from './SubtaskEditor';
import type { EditableSubtask, TaskExplorerViewData, TaskFormData, TaskViewData } from './types';

export type TaskEditor = 'title' | 'schedule' | 'checklist' | 'organization' | 'notes';

export function TaskEditorDialog({ editor, explorer, onClose, task, today }: {
    editor: TaskEditor;
    explorer: TaskExplorerViewData;
    onClose: () => void;
    task: TaskViewData;
    today: string;
}) {
    const form = useForm<TaskFormData>({
        title: task.title,
        task_project_id: task.taskProjectId,
        notes: task.notes ?? '',
        scheduled_date: task.scheduledDate,
        important: task.important,
        recurrence_type: task.recurrence?.type ?? null,
        weekdays: task.recurrence?.weekdays ?? [],
        subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
    });
    const reward = projectedReward(form.data.important, form.data.scheduled_date, today);

    function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            title: data.title.trim(),
            weekdays: data.recurrence_type === 'weekdays' ? data.weekdays : [],
            subtasks: data.subtasks
                .filter((subtask) => subtask.title.trim())
                .map((subtask) => ({ id: subtask.id, title: subtask.title.trim() })),
        }));
        form.put(`/tasks/${task.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    function toggleSubtask(subtask: EditableSubtask, index: number) {
        if (!subtask.id) return;
        const nextCompleted = !subtask.completed;
        form.setData('subtasks', form.data.subtasks.map((candidate, candidateIndex) => (
            candidateIndex === index ? { ...candidate, completed: nextCompleted } : candidate
        )));
        router.put(`/tasks/${task.id}/subtasks/${subtask.id}`, { completed: nextCompleted }, {
            preserveScroll: true,
            onError: () => form.setData('subtasks', form.data.subtasks.map((candidate, candidateIndex) => (
                candidateIndex === index ? { ...candidate, completed: subtask.completed } : candidate
            ))),
        });
    }

    return (
        <Dialog
            description={editor === 'checklist' ? 'Add, complete, remove, or reorder every step in this Task.' : undefined}
            onClose={onClose}
            open
            size={editor === 'checklist' ? 'large' : 'default'}
            title={editorTitles[editor]}
        >
            <form onSubmit={save}>
                {editor === 'title' && (
                    <Field autoFocus error={form.errors.title} label="Title" onChange={(event) => form.setData('title', event.target.value)} required value={form.data.title} />
                )}

                {editor === 'schedule' && (
                    <div className="space-y-5">
                        <Field error={form.errors.scheduled_date} label="Date" onChange={(event) => form.setData('scheduled_date', event.target.value)} required type="date" value={form.data.scheduled_date} />
                        <button
                            aria-pressed={form.data.important}
                            className={classNames(
                                'focus-ring icon-text flex min-h-11 w-full items-center gap-3 rounded-2xl border px-4 text-sm font-bold transition-colors',
                                form.data.important
                                    ? 'border-warning/50 bg-warning/10 text-warning'
                                    : 'border-border-strong bg-app text-secondary hover:text-foreground',
                            )}
                            onClick={() => form.setData('important', !form.data.important)}
                            type="button"
                        >
                            <Star fill={form.data.important ? 'currentColor' : 'none'} size={18} />
                            Important
                        </button>
                        {task.recurrence && (
                            <RecurrenceControls
                                allowNone={false}
                                onTypeChange={(type) => type && form.setData('recurrence_type', type)}
                                onWeekdaysChange={(weekdays) => form.setData('weekdays', weekdays)}
                                type={form.data.recurrence_type}
                                weekdays={form.data.weekdays}
                            />
                        )}
                        {form.errors.weekdays && <p className="text-sm font-semibold text-danger">Choose at least one weekday.</p>}
                        <p className="text-right text-lg font-bold text-accent-ink">+{reward.points} SP</p>
                    </div>
                )}

                {editor === 'checklist' && (
                    <SubtaskEditor
                        error={form.errors.subtasks}
                        onChange={(subtasks) => {
                            form.setData('subtasks', subtasks);
                            form.clearErrors('subtasks');
                        }}
                        onToggleCompletion={toggleSubtask}
                        subtasks={form.data.subtasks}
                    />
                )}

                {editor === 'organization' && (
                    <SelectField error={form.errors.task_project_id} label="Project" onChange={(event) => form.setData('task_project_id', event.target.value ? Number(event.target.value) : null)} value={form.data.task_project_id ?? ''}>
                        <option value="">Inbox</option>
                        {explorer.rootProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        {explorer.folders.map((folder) => (
                            <optgroup key={folder.id} label={folder.name}>
                                {folder.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                            </optgroup>
                        ))}
                    </SelectField>
                )}

                {editor === 'notes' && (
                    <label className="text-sm font-semibold text-secondary">
                        Notes
                        <textarea
                            autoFocus
                            className="focus-ring mt-2 min-h-48 w-full resize-y rounded-2xl border border-border-strong bg-app px-4 py-3 text-base text-foreground placeholder:text-muted"
                            maxLength={10000}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            placeholder="Add context, links, or next steps…"
                            value={form.data.notes}
                        />
                        {form.errors.notes && <span className="mt-2 block text-sm font-semibold text-danger">{form.errors.notes}</span>}
                    </label>
                )}

                <Button className="mt-6" disabled={form.processing || !form.data.title.trim()} fullWidth type="submit">
                    {form.processing ? 'Saving…' : 'Save'}
                </Button>
            </form>
        </Dialog>
    );
}

const editorTitles: Record<TaskEditor, string> = {
    title: 'Edit title',
    schedule: 'Edit schedule',
    checklist: 'Edit checklist',
    organization: 'Move Task',
    notes: 'Edit notes',
};
