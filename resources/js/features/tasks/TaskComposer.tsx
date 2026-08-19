import { useForm } from '@inertiajs/react';
import { ArrowUp, CalendarDays, ListChecks, Plus, Repeat2, Star } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { Button, Dialog, Field } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { formatTaskDate, projectedReward } from './taskPresentation';
import { RecurrenceControls } from './RecurrenceControls';
import { SubtaskEditor } from './SubtaskEditor';
import type { TaskFormData } from './types';

type ComposerDialog = 'date' | 'recurrence' | 'subtasks' | null;

export function TaskComposer({ today }: { today: string }) {
    const [expanded, setExpanded] = useState(false);
    const [dialog, setDialog] = useState<ComposerDialog>(null);
    const closeDialog = useCallback(() => setDialog(null), []);
    const form = useForm<TaskFormData>({
        title: '',
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
                className="rounded-[1.5rem] border border-border-strong bg-elevated/96 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl"
                onSubmit={submit}
            >
                <div className="flex items-center gap-2">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--module-accent)]" aria-hidden="true">
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
                        {hasTitle && <span className="ml-auto px-2 text-sm font-bold text-[var(--module-accent)]">+{reward.points} SP</span>}
                    </div>
                )}

                {form.errors.title && <p className="px-3 pt-2 text-sm font-semibold text-danger">{form.errors.title}</p>}
                {form.errors.scheduled_date && <p className="px-3 pt-2 text-sm font-semibold text-danger">{form.errors.scheduled_date}</p>}
                {form.errors.weekdays && <p className="px-3 pt-2 text-sm font-semibold text-danger">Choose at least one weekday.</p>}
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

            <Dialog onClose={closeDialog} open={dialog === 'subtasks'} title="Subtasks">
                <SubtaskEditor onChange={(subtasks) => form.setData('subtasks', subtasks)} subtasks={form.data.subtasks} />
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
                    ? 'bg-[color-mix(in_srgb,var(--module-accent)_14%,transparent)] text-[var(--module-accent)]'
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
