import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Star } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field, SelectField } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { projectedReward } from './taskPresentation';
import { RecurrenceControls } from './RecurrenceControls';
import { SubtaskEditor } from './SubtaskEditor';
import { TaskFocusSessionEditor } from './TaskFocusSessionEditor';
import type { TaskFocusSessionEditorTarget } from './TaskFocusSessionEditor';
import type { EditableSubtask, TaskExplorerViewData, TaskFormData, TaskViewData } from './types';

type TaskFieldEditor = 'title' | 'schedule' | 'checklist' | 'organization' | 'notes';

export type TaskEditorTarget =
    | { kind: TaskFieldEditor }
    | { kind: 'focus-session'; target: TaskFocusSessionEditorTarget };

export function TaskEditorPanel({ editor, explorer, onClose, task, today }: {
    editor: TaskEditorTarget;
    explorer: TaskExplorerViewData;
    onClose: () => void;
    task: TaskViewData;
    today: string;
}) {
    const presentation = editorPresentation(editor);

    return (
        <section aria-labelledby="task-editor-heading" className="min-w-0 lg:border-l lg:border-border-strong lg:pl-6">
            <div className="flex min-h-10 items-center justify-between gap-3">
                <button className="focus-ring icon-text inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-secondary hover:bg-surface-hover hover:text-foreground" onClick={onClose} type="button">
                    <ArrowLeft aria-hidden="true" size={17} />
                    Details
                </button>
                <span className="text-xs font-bold tracking-[0.12em] text-muted uppercase">Task editor</span>
            </div>

            <div className="mt-5 border-b border-border-subtle pb-5">
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground" id="task-editor-heading">{presentation.title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{presentation.description}</p>
            </div>

            <div className="mt-6">
                {editor.kind === 'focus-session' ? (
                    <TaskFocusSessionEditor onClose={onClose} target={editor.target} task={task} />
                ) : (
                    <TaskFieldEditorForm editor={editor.kind} explorer={explorer} onClose={onClose} task={task} today={today} />
                )}
            </div>
        </section>
    );
}

function TaskFieldEditorForm({ editor, explorer, onClose, task, today }: {
    editor: TaskFieldEditor;
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
        <form onSubmit={save}>
            {editor === 'title' && (
                <Field autoFocus error={form.errors.title} label="Title" onChange={(event) => form.setData('title', event.target.value)} required value={form.data.title} />
            )}

            {editor === 'schedule' && (
                <div className="space-y-5">
                    <Field autoFocus error={form.errors.scheduled_date} label="Date" onChange={(event) => form.setData('scheduled_date', event.target.value)} required type="date" value={form.data.scheduled_date} />
                    <button
                        aria-pressed={form.data.important}
                        className={classNames(
                            'focus-ring icon-text flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 text-sm font-bold transition-colors',
                            form.data.important
                                ? 'border-warning/50 bg-warning/10 text-warning'
                                : 'border-border-strong bg-app text-secondary hover:text-foreground',
                        )}
                        onClick={() => form.setData('important', !form.data.important)}
                        type="button"
                    >
                        <Star aria-hidden="true" fill={form.data.important ? 'currentColor' : 'none'} size={18} />
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
                    <div className="rounded-2xl border border-border-subtle bg-app px-4 py-3 text-right">
                        <span className="text-xs font-bold tracking-[0.1em] text-muted uppercase">Projected reward</span>
                        <p className="mt-1 text-xl font-bold text-accent-ink">+{reward.points} SP</p>
                    </div>
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
                <SelectField autoFocus error={form.errors.task_project_id} label="Project" onChange={(event) => form.setData('task_project_id', event.target.value ? Number(event.target.value) : null)} value={form.data.task_project_id ?? ''}>
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
                        className="focus-ring mt-2 min-h-64 w-full resize-y rounded-2xl border border-border-strong bg-app px-4 py-3 text-base text-foreground placeholder:text-muted"
                        maxLength={10000}
                        onChange={(event) => form.setData('notes', event.target.value)}
                        placeholder="Add context, links, or next steps…"
                        value={form.data.notes}
                    />
                    {form.errors.notes && <span className="mt-2 block text-sm font-semibold text-danger">{form.errors.notes}</span>}
                </label>
            )}

            <EditorActions disabled={!form.data.title.trim()} onCancel={onClose} processing={form.processing} />
        </form>
    );
}

function EditorActions({ disabled, onCancel, processing }: { disabled: boolean; onCancel: () => void; processing: boolean }) {
    return (
        <div className="mt-7 flex gap-2 border-t border-border-subtle pt-5">
            <Button className="flex-1" onClick={onCancel} variant="secondary">Cancel</Button>
            <Button className="flex-1" disabled={disabled || processing} type="submit">
                <Save aria-hidden="true" size={16} />
                {processing ? 'Saving…' : 'Save changes'}
            </Button>
        </div>
    );
}

function editorPresentation(editor: TaskEditorTarget): { title: string; description: string } {
    if (editor.kind === 'focus-session') {
        if (editor.target.action === 'create') return { title: 'Add Focus Time', description: 'Record a completed Focus Session in your saved timezone.' };
        if (editor.target.action === 'delete') return { title: 'Delete Focus Session', description: 'Review the session before permanently removing it.' };

        return { title: 'Edit Focus Session', description: 'Correct the start and end of this completed timer or manual session.' };
    }

    return fieldEditorPresentation[editor.kind];
}

const fieldEditorPresentation: Record<TaskFieldEditor, { title: string; description: string }> = {
    title: { title: 'Edit title', description: 'Give this Task a clear, action-focused name.' },
    schedule: { title: 'Schedule and importance', description: 'Adjust when it is due, its importance, and its recurring pattern.' },
    checklist: { title: 'Edit checklist', description: 'Add, complete, remove, or reorder every step without leaving the Task.' },
    organization: { title: 'Move Task', description: 'Choose the Project where this Task belongs, or move it back to Inbox.' },
    notes: { title: 'Edit notes', description: 'Keep the context, links, and supporting details you need while working.' },
};
