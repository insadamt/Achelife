import { useForm } from '@inertiajs/react';
import { ArrowUp, CalendarDays, FolderKanban, ListChecks, Plus, Repeat2, Star, StickyNote } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { Button, Dialog, Field } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { formatTaskDate, projectedReward } from './taskPresentation';
import { RecurrenceControls } from './RecurrenceControls';
import { SubtaskEditor } from './SubtaskEditor';
import type { TaskExplorerViewData, TaskFormData } from './types';

type ComposerDialog = 'date' | 'notes' | 'recurrence' | 'subtasks' | null;

export function TaskComposer({ explorer, initialProjectId, showProjectControl = true, today }: {
    explorer: TaskExplorerViewData;
    initialProjectId: number | null;
    showProjectControl?: boolean;
    today: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const [dialog, setDialog] = useState<ComposerDialog>(null);
    const closeDialog = useCallback(() => setDialog(null), []);
    const form = useForm<TaskFormData>({
        title: '',
        task_project_id: initialProjectId,
        notes: '',
        scheduled_date: today,
        important: false,
        recurrence_type: null,
        weekdays: [],
        subtasks: [],
    });
    const hasTitle = Boolean(form.data.title.trim());
    const reward = projectedReward(form.data.important, form.data.scheduled_date, today);
    const dateLabel = form.data.scheduled_date === today ? 'Today' : formatTaskDate(form.data.scheduled_date);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!hasTitle) return;

        form.transform((data) => ({
            ...data,
            title: data.title.trim(),
            weekdays: data.recurrence_type === 'weekdays' ? data.weekdays : [],
            subtasks: data.subtasks.filter((subtask) => subtask.title.trim()).map((subtask) => ({ ...subtask, title: subtask.title.trim() })),
        }));
        form.post('/tasks', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setExpanded(false);
            },
        });
    }

    return (
        <section className="sticky top-18 z-10 mx-auto max-w-4xl md:top-4" aria-label="Create a Task">
            <form
                className="rounded-[1.5rem] border border-border-strong bg-elevated/96 p-2 shadow-[var(--shadow-raised)] backdrop-blur-xl"
                onSubmit={submit}
            >
                <div className="flex items-center gap-2">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full text-accent-ink" aria-hidden="true">
                        <Plus size={21} strokeWidth={2.2} />
                    </span>
                    <label className="sr-only" htmlFor="quick-task-title">Add a task</label>
                    <input
                        autoComplete="off"
                        className="focus-ring min-h-12 min-w-0 flex-1 bg-transparent px-1 text-lg font-semibold text-foreground placeholder:text-muted"
                        id="quick-task-title"
                        onChange={(event) => form.setData('title', event.target.value)}
                        onFocus={() => setExpanded(true)}
                        placeholder="Add a task…"
                        value={form.data.title}
                    />
                    <button
                        aria-label="Create task"
                        className="focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-[var(--module-accent)] text-accent-foreground transition-[transform,filter] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35"
                        disabled={form.processing || !hasTitle}
                        title="Create task"
                        type="submit"
                    >
                        <ArrowUp size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {expanded && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border-subtle px-1 pt-2">
                        <ComposerControl label={`Scheduled ${dateLabel}`} onClick={() => setDialog('date')}>
                            <CalendarDays size={17} />
                            <span>{dateLabel}</span>
                        </ComposerControl>
                        <ComposerControl active={form.data.important} label={form.data.important ? 'Remove importance' : 'Mark important'} onClick={() => form.setData('important', !form.data.important)}>
                            <Star fill={form.data.important ? 'currentColor' : 'none'} size={17} />
                        </ComposerControl>
                        <ComposerControl active={form.data.recurrence_type !== null} label="Repeat" onClick={() => setDialog('recurrence')}>
                            <Repeat2 size={17} />
                        </ComposerControl>
                        <ComposerControl active={form.data.subtasks.length > 0} label="Subtasks" onClick={() => setDialog('subtasks')}>
                            <ListChecks size={18} />
                            {form.data.subtasks.length > 0 && <span>{form.data.subtasks.length}</span>}
                        </ComposerControl>
                        <ComposerControl active={Boolean(form.data.notes.trim())} label="Notes" onClick={() => setDialog('notes')}>
                            <StickyNote size={17} />
                        </ComposerControl>
                        {showProjectControl && (
                            <label className="focus-within:focus-ring icon-text flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-muted hover:bg-surface-hover hover:text-foreground">
                                <FolderKanban aria-hidden="true" size={17} />
                                <span className="sr-only">Project</span>
                                <select
                                    aria-label="Project"
                                    className="max-w-36 bg-transparent font-bold outline-none"
                                    onChange={(event) => form.setData('task_project_id', event.target.value ? Number(event.target.value) : null)}
                                    value={form.data.task_project_id ?? ''}
                                >
                                    <option value="">Inbox</option>
                                    {explorer.rootProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                                    {explorer.folders.map((folder) => (
                                        <optgroup key={folder.id} label={folder.name}>
                                            {folder.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </label>
                        )}
                        {hasTitle && <span className="ml-auto px-2 text-sm font-bold text-accent-ink">+{reward.points} SP</span>}
                    </div>
                )}

                {form.errors.title && <p className="px-3 pt-2 text-sm font-semibold text-danger">{form.errors.title}</p>}
                {form.errors.scheduled_date && <p className="px-3 pt-2 text-sm font-semibold text-danger">{form.errors.scheduled_date}</p>}
                {form.errors.weekdays && <p className="px-3 pt-2 text-sm font-semibold text-danger">Choose at least one weekday.</p>}
                {form.errors.notes && <p className="px-3 pt-2 text-sm font-semibold text-danger">{form.errors.notes}</p>}
            </form>

            <Dialog onClose={closeDialog} open={dialog === 'date'} title="Schedule">
                <Field label="Date" onChange={(event) => form.setData('scheduled_date', event.target.value)} required type="date" value={form.data.scheduled_date} />
                <Button className="mt-6" fullWidth onClick={closeDialog}>Done</Button>
            </Dialog>

            <Dialog onClose={closeDialog} open={dialog === 'recurrence'} title="Repeat">
                <RecurrenceControls
                    onTypeChange={(type) => form.setData('recurrence_type', type)}
                    onWeekdaysChange={(weekdays) => form.setData('weekdays', weekdays)}
                    type={form.data.recurrence_type}
                    weekdays={form.data.weekdays}
                />
                <Button className="mt-6" fullWidth onClick={closeDialog}>Done</Button>
            </Dialog>

            <Dialog description="Add as many steps as you need, then arrange them in the order you want to work." onClose={closeDialog} open={dialog === 'subtasks'} size="large" title="Plan the checklist">
                <SubtaskEditor
                    error={form.errors.subtasks}
                    onChange={(subtasks) => {
                        form.setData('subtasks', subtasks);
                        form.clearErrors('subtasks');
                    }}
                    subtasks={form.data.subtasks}
                />
                <Button className="mt-6" fullWidth onClick={closeDialog}>Done</Button>
            </Dialog>

            <Dialog onClose={closeDialog} open={dialog === 'notes'} title="Notes">
                <label className="text-sm font-semibold text-secondary">
                    Notes
                    <textarea
                        autoFocus
                        className="focus-ring mt-2 min-h-40 w-full resize-y rounded-2xl border border-border-strong bg-app px-4 py-3 text-base text-foreground placeholder:text-muted"
                        maxLength={10000}
                        onChange={(event) => form.setData('notes', event.target.value)}
                        placeholder="Add context, links, or next steps…"
                        value={form.data.notes}
                    />
                </label>
                <Button className="mt-6" fullWidth onClick={closeDialog}>Done</Button>
            </Dialog>
        </section>
    );
}

function ComposerControl({ active = false, label, onClick, children }: {
    active?: boolean;
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            aria-label={label}
            aria-pressed={active || undefined}
            className={classNames(
                'focus-ring icon-text flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors',
                active
                    ? 'bg-[color-mix(in_srgb,var(--module-accent)_14%,transparent)] text-accent-ink'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground',
            )}
            onClick={onClick}
            title={label}
            type="button"
        >
            {children}
        </button>
    );
}
