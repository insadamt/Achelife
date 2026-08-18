import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../components/ui';
import { CalendarLabelSetting } from '../../features/habits/CalendarLabelSetting';
import { HabitCard } from '../../features/habits/HabitCard';
import { HabitFormSheet } from '../../features/habits/HabitFormSheet';
import { NumericValueDialog } from '../../features/habits/NumericValueDialog';
import { SkipConfirmationDialog } from '../../features/habits/SkipConfirmationDialog';
import type { CurrentSeasonData, HabitCalendarLabels, HabitDayData, HabitViewData } from '../../features/habits/types';

interface HabitsPageProps {
    today: string;
    currentWeek: {
        startDate: string;
        endDate: string;
    };
    calendarLabels: HabitCalendarLabels;
    currentSeason: CurrentSeasonData;
    habits: HabitViewData[];
}

interface SelectedDay {
    habit: HabitViewData;
    day: HabitDayData;
}

export default function HabitsIndex(props: HabitsPageProps) {
    const [creating, setCreating] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
    const [numericSelection, setNumericSelection] = useState<SelectedDay | null>(null);
    const [skipSelection, setSkipSelection] = useState<SelectedDay | null>(null);
    const editingHabit = props.habits.find((habit) => habit.id === editingHabitId) ?? null;

    return (
        <div style={{ '--module-accent': 'var(--habit-accent)' } as CSSProperties}>
            <Head title="Habits" />

            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">Practice, recorded</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Habits</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-secondary sm:text-base">Every active Habit stays visible. Its calendar carries the daily story across Seasons.</p>
                </div>
                <div className="flex flex-wrap items-stretch gap-2">
                    <CalendarLabelSetting value={props.calendarLabels} />
                    <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-right">
                        <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Season {String(props.currentSeason.number).padStart(2, '0')}</p>
                        <p className="mt-1 text-xl font-bold">{props.currentSeason.seasonPoints.toLocaleString()} SP</p>
                    </div>
                </div>
            </header>

            <div className="mb-7 flex flex-wrap gap-2">
                <Button onClick={() => setCreating(true)}>+ New Habit</Button>
                <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-border-strong bg-elevated px-5 py-2.5 text-sm font-bold tracking-[0.08em] text-foreground uppercase hover:bg-surface-hover" href="/habits/archived">
                    Archived
                </Link>
            </div>

            {props.habits.length === 0 ? (
                <Surface className="grid min-h-64 place-items-center p-8 text-center" elevated>
                    <div>
                        <p className="text-2xl font-bold">No active Habits</p>
                        <p className="mt-2 max-w-md text-sm leading-6 text-secondary">Create one global practice. Required occurrences begin today and continue across Season boundaries.</p>
                        <Button className="mt-5" onClick={() => setCreating(true)}>Create your first Habit</Button>
                    </div>
                </Surface>
            ) : (
                <div className="grid items-start gap-5 xl:grid-cols-2">
                    {props.habits.map((habit) => (
                        <HabitCard
                            calendarLabels={props.calendarLabels}
                            habit={habit}
                            key={habit.id}
                            onEdit={() => setEditingHabitId(habit.id)}
                            onRequestSkip={(day) => setSkipSelection({ habit, day })}
                            onSelectNumeric={(day) => setNumericSelection({ habit, day })}
                            weekStart={props.currentWeek.startDate}
                        />
                    ))}
                </div>
            )}

            {creating && <HabitFormSheet key="create-habit" onClose={() => setCreating(false)} open />}
            {editingHabit && (
                <HabitFormSheet habit={editingHabit} key={`edit-${editingHabit.id}`} onClose={() => setEditingHabitId(null)} open />
            )}
            {numericSelection && (
                <NumericValueDialog
                    day={numericSelection.day}
                    habit={numericSelection.habit}
                    onClose={() => setNumericSelection(null)}
                />
            )}
            {skipSelection && (
                <SkipConfirmationDialog
                    day={skipSelection.day}
                    habit={skipSelection.habit}
                    onClose={() => setSkipSelection(null)}
                />
            )}
        </div>
    );
}
