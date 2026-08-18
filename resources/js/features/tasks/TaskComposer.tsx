import { useForm } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Dialog } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { projectedReward } from './taskPresentation';
import { RecurrenceControls } from './RecurrenceControls';
import { SubtaskEditor } from './SubtaskEditor';
import type { TaskFormData } from './types';

export function TaskComposer({ today }: { today: string }) {
    const [recurrenceOpen, setRecurrenceOpen] = useState(false);
    const [subtasksOpen, setSubtasksOpen] = useState(false);
    const closeRecurrence = useCallback(() => setRecurrenceOpen(false), []);
    const closeSubtasks = useCallback(() => setSubtasksOpen(false), []);
    const form = useForm<TaskFormData>({
        title: '',
        scheduled_date: today,
        important: false,
        recurrence_type: null,
        weekdays: [],
        subtasks: [],
    });
    const reward = projectedReward(form.data.important, form.data.scheduled_date, today);
    const recurrenceLabel = form.data.recurrence_type === 'daily'
        ? 'Every day'
        : form.data.recurrence_type === 'weekdays'
          ? `${form.data.weekdays.length || 'Choose'} days`
          : 'Repeat';

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form.data.title.trim()) return;

        form.transform((data) => ({
            ...data,
            title: data.title.trim(),
            weekdays: data.recurrence_type === 'weekdays' ? data.weekdays : [],
            subtasks: data.subtasks.filter((subtask) => subtask.title.trim()).map((subtask) => ({ ...subtask, title: subtask.title.trim() })),
        }));
        form.post('/tasks', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <section className="task-composer sticky top-18 z-10 rounded-[1.75rem] border border-border-strong bg-elevated/96 p-3 shadow-[0_20px_55px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-4 md:top-4" aria-label="Create a Task">
            <form onSubmit={submit}>
                <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--module-accent)_45%,var(--border-strong))] bg-[color-mix(in_srgb,var(--module-accent)_9%,transparent)] text-xl text-[var(--module-accent)]" aria-hidden="true">+</span>
                    <label className="sr-only" htmlFor="quick-task-title">What needs to be done?</label>
                    <input
                        autoComplete="off"
                        autoFocus
                        className="focus-ring min-h-12 min-w-0 flex-1 bg-transparent px-1 text-lg font-semibold text-foreground placeholder:text-muted sm:text-xl"
                        id="quick-task-title"
                        onChange={(event) => form.setData('title', event.target.value)}
                        placeholder="What needs to be done?"
                        value={form.data.title}
                    />
                    <div className="hidden min-w-28 text-right sm:block">
                        <p className="text-xl font-bold text-[var(--module-accent)]">+{reward.points} SP</p>
                        <p className="text-[0.625rem] font-bold tracking-[0.08em] text-muted uppercase">{reward.context}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
                    <label className="focus-within:accent-border flex min-h-10 items-center gap-2 rounded-full border border-border-strong bg-app px-3 text-xs font-bold text-secondary">
                        <span>Date</span>
                        <input
                            aria-label="Scheduled date"
                            className="focus-ring w-[7.4rem] bg-transparent text-foreground scheme-dark"
                            onChange={(event) => form.setData('scheduled_date', event.target.value)}
                            required
                            type="date"
                            value={form.data.scheduled_date}
                        />
                    </label>
                    <button
                        aria-pressed={form.data.important}
                        className={classNames(
                            'focus-ring min-h-10 rounded-full border px-3 text-xs font-bold transition-colors',
                            form.data.important
                                ? 'border-warning/55 bg-warning/10 text-warning'
                                : 'border-border-strong bg-app text-secondary hover:text-foreground',
                        )}
                        onClick={() => form.setData('important', !form.data.important)}
                        type="button"
                    >
                        {form.data.important ? '★ Important' : '☆ Important'}
                    </button>
                    <button
                        className={classNames('focus-ring min-h-10 rounded-full border px-3 text-xs font-bold transition-colors', form.data.recurrence_type ? 'accent-border bg-[color-mix(in_srgb,var(--module-accent)_9%,transparent)] text-foreground' : 'border-border-strong bg-app text-secondary hover:text-foreground')}
                        onClick={() => setRecurrenceOpen(true)}
                        type="button"
                    >
                        ↻ {recurrenceLabel}
                    </button>
                    <button
                        className={classNames('focus-ring min-h-10 rounded-full border px-3 text-xs font-bold transition-colors', form.data.subtasks.length ? 'accent-border bg-[color-mix(in_srgb,var(--module-accent)_9%,transparent)] text-foreground' : 'border-border-strong bg-app text-secondary hover:text-foreground')}
                        onClick={() => setSubtasksOpen(true)}
                        type="button"
                    >
                        ⎯ {form.data.subtasks.length ? `${form.data.subtasks.length} subtasks` : 'Subtasks'}
                    </button>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="text-right sm:hidden">
                            <p className="text-lg font-bold text-[var(--module-accent)]">+{reward.points} SP</p>
                            {reward.late && <p className="text-[0.5625rem] font-bold text-warning uppercase">50% late</p>}
                        </div>
                        <Button disabled={form.processing || !form.data.title.trim()} type="submit">
                            {form.processing ? 'Creating…' : 'Create'}
                        </Button>
                    </div>
                </div>
                {form.errors.title && <p className="mt-2 text-sm font-semibold text-danger">{form.errors.title}</p>}
                {form.errors.weekdays && <p className="mt-2 text-sm font-semibold text-danger">Choose at least one weekday.</p>}
            </form>

            <Dialog description="Choose a simple repeating schedule. The selected date is the first eligible boundary." onClose={closeRecurrence} open={recurrenceOpen} title="Repeat Task">
                <RecurrenceControls
                    onTypeChange={(type) => form.setData('recurrence_type', type)}
                    onWeekdaysChange={(weekdays) => form.setData('weekdays', weekdays)}
                    type={form.data.recurrence_type}
                    weekdays={form.data.weekdays}
                />
                <Button className="mt-6" fullWidth onClick={closeRecurrence}>Done</Button>
            </Dialog>

            <Dialog description="Subtasks are a completion checklist. They do not award separate SP." onClose={closeSubtasks} open={subtasksOpen} title="Subtasks">
                <SubtaskEditor onChange={(subtasks) => form.setData('subtasks', subtasks)} subtasks={form.data.subtasks} />
                <Button className="mt-6" fullWidth onClick={closeSubtasks}>Done</Button>
            </Dialog>
        </section>
    );
}
