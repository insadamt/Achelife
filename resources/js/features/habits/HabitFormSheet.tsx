import { useForm } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, CheckCircle2, Gauge, Shuffle, Target, TriangleAlert } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

import { Button, Drawer, Field } from '../../components/ui';
import { difficultyLabels, formatNumber, weekdayShortLabels } from './habitPresentation';
import type { HabitDifficulty, HabitScheduleType, HabitType, HabitViewData } from './types';

interface HabitFormPayload {
    name: string;
    type: HabitType;
    unit: string;
    numeric_target: string;
    difficulty: HabitDifficulty;
    schedule_type: HabitScheduleType;
    weekdays: number[];
    flexible: boolean;
}

interface HabitFormSheetProps {
    open: boolean;
    habit?: HabitViewData | null;
    onClose: () => void;
}

const difficultyRewards: Record<HabitDifficulty, number> = { easy: 2, normal: 4, hard: 8 };

function ChoiceButton({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) {
    return (
        <button
            aria-pressed={selected}
            className={`focus-ring min-h-11 rounded-xl border px-3 text-sm font-bold transition-colors ${selected ? 'border-[var(--module-accent)] bg-[color-mix(in_srgb,var(--module-accent)_12%,transparent)] text-foreground' : 'border-border-strong bg-app text-secondary hover:text-foreground'}`}
            onClick={onClick}
            type="button"
        >
            {children}
        </button>
    );
}

export function HabitFormSheet({ open, habit = null, onClose }: HabitFormSheetProps) {
    const editing = habit !== null;
    const definition = habit?.editDefinition;
    const form = useForm<HabitFormPayload>({
        name: habit?.name ?? '',
        type: habit?.type ?? 'boolean',
        unit: habit?.unit ?? '',
        numeric_target: definition?.numericTarget ? formatNumber(definition.numericTarget) : '',
        difficulty: definition?.difficulty ?? 'normal',
        schedule_type: definition?.scheduleType ?? 'every_day',
        weekdays: definition?.weekdays ?? [],
        flexible: definition?.flexible ?? false,
    });

    function toggleWeekday(weekday: number) {
        const selected = form.data.weekdays.includes(weekday);
        form.setData('weekdays', selected ? form.data.weekdays.filter((value) => value !== weekday) : [...form.data.weekdays, weekday].sort());
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (habit) {
            form.put(`/habits/${habit.id}`, options);
        } else {
            form.post('/habits', options);
        }
    }

    return (
        <Drawer
            description={editing ? 'Rule changes start tomorrow.' : undefined}
            onClose={onClose}
            open={open}
            title={editing ? 'Edit Habit' : 'Create Habit'}
        >
            <form className="space-y-7" onSubmit={submit}>
                <Field
                    autoComplete="off"
                    error={form.errors.name}
                    label="Name"
                    maxLength={255}
                    onChange={(event) => form.setData('name', event.target.value)}
                    placeholder="Workout"
                    required
                    value={form.data.name}
                />

                <fieldset>
                    <legend className="text-sm font-semibold text-secondary">
                        <span className="inline-flex items-center gap-2"><CheckCircle2 aria-hidden="true" size={16} />Type</span>
                    </legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {(['boolean', 'numeric'] as const).map((type) => (
                            <ChoiceButton key={type} onClick={() => !editing && form.setData('type', type)} selected={form.data.type === type}>
                                {type === 'boolean'
                                    ? <><CheckCircle2 aria-hidden="true" className="mx-auto mb-1" size={17} />Check-off</>
                                    : <><Target aria-hidden="true" className="mx-auto mb-1" size={17} />Target</>}
                            </ChoiceButton>
                        ))}
                    </div>
                    {editing && <p className="mt-2 text-xs text-muted">Type is permanent after creation.</p>}
                    {form.errors.type && <p className="mt-2 text-sm text-danger">{form.errors.type}</p>}
                </fieldset>

                {form.data.type === 'numeric' && (
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            error={form.errors.numeric_target}
                            label="Target"
                            min="0.001"
                            onChange={(event) => form.setData('numeric_target', event.target.value)}
                            required
                            step="any"
                            type="number"
                            value={form.data.numeric_target}
                        />
                        <Field
                            error={form.errors.unit}
                            label="Unit"
                            maxLength={40}
                            onChange={(event) => form.setData('unit', event.target.value)}
                            placeholder="pages"
                            required
                            value={form.data.unit}
                        />
                        {editing && <p className="col-span-2 text-xs leading-5 text-muted">Unit renames update history.</p>}
                    </div>
                )}

                <fieldset>
                    <legend className="text-sm font-semibold text-secondary">
                        <span className="inline-flex items-center gap-2"><Gauge aria-hidden="true" size={16} />Difficulty</span>
                    </legend>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {(['easy', 'normal', 'hard'] as const).map((difficulty) => (
                            <ChoiceButton key={difficulty} onClick={() => form.setData('difficulty', difficulty)} selected={form.data.difficulty === difficulty}>
                                <span className="block">{difficultyLabels[difficulty]}</span>
                                <span className="mt-0.5 block text-[0.65rem] text-muted">{difficultyRewards[difficulty]} SP</span>
                            </ChoiceButton>
                        ))}
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-sm font-semibold text-secondary">
                        <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" size={16} />Schedule</span>
                    </legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <ChoiceButton onClick={() => form.setData('schedule_type', 'every_day')} selected={form.data.schedule_type === 'every_day'}>
                            <CalendarCheck aria-hidden="true" className="mx-auto mb-1" size={17} />
                            Every day
                        </ChoiceButton>
                        <ChoiceButton onClick={() => form.setData('schedule_type', 'selected_weekdays')} selected={form.data.schedule_type === 'selected_weekdays'}>
                            <CalendarDays aria-hidden="true" className="mx-auto mb-1" size={17} />
                            Selected days
                        </ChoiceButton>
                    </div>
                    {form.data.schedule_type === 'selected_weekdays' && (
                        <>
                            <div className="mt-3 grid grid-cols-7 gap-1.5">
                                {weekdayShortLabels.map((label, index) => {
                                    const weekday = index + 1;
                                    return (
                                        <button
                                            aria-label={`${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}`}
                                            aria-pressed={form.data.weekdays.includes(weekday)}
                                            className={`focus-ring aspect-square rounded-xl border text-sm font-bold ${form.data.weekdays.includes(weekday) ? 'border-[var(--module-accent)] bg-[var(--module-accent)] text-accent-foreground' : 'border-border-strong bg-app text-secondary'}`}
                                            key={`${label}-${weekday}`}
                                            onClick={() => toggleWeekday(weekday)}
                                            type="button"
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.errors.weekdays && <p className="mt-2 text-sm text-danger">{form.errors.weekdays}</p>}
                            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-border-subtle bg-app p-3">
                                <input
                                    checked={form.data.flexible}
                                    className="focus-ring mt-0.5 size-5 accent-[var(--module-accent)]"
                                    onChange={(event) => form.setData('flexible', event.target.checked)}
                                    type="checkbox"
                                />
                                <span>
                                    <span className="flex items-center gap-2 text-sm font-bold"><Shuffle aria-hidden="true" size={15} />Flexible</span>
                                    <span className="mt-0.5 block text-xs leading-5 text-muted">Optional on other days.</span>
                                </span>
                            </label>
                        </>
                    )}
                </fieldset>

                {editing && (
                    <p className="flex items-center gap-2 rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
                        <TriangleAlert aria-hidden="true" className="shrink-0" size={15} />
                        Today's occurrence stays unchanged.
                    </p>
                )}

                <Button disabled={form.processing} fullWidth type="submit">
                    {editing ? 'Save Habit' : 'Create Habit'}
                </Button>
            </form>
        </Drawer>
    );
}
