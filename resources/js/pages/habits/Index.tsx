import { Head, Link } from '@inertiajs/react';
import { Archive, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../components/ui';
import { CalendarLabelSetting } from '../../features/habits/CalendarLabelSetting';
import { HabitCard } from '../../features/habits/HabitCard';
import { HabitFormSheet } from '../../features/habits/HabitFormSheet';
import { NumericValueDialog } from '../../features/habits/NumericValueDialog';
import { SkipConfirmationDialog } from '../../features/habits/SkipConfirmationDialog';
import type { HabitCalendarLabels, HabitDayData, HabitViewData } from '../../features/habits/types';

interface HabitsPageProps {
    today: string;
    currentWeek: {
        startDate: string;
        endDate: string;
    };
    calendarLabels: HabitCalendarLabels;
    habits: HabitViewData[];
    intermission: boolean;
}

interface SelectedDay {
    habit: HabitViewData;
    day: HabitDayData;
}

function usePhoneViewport(): boolean {
    const [phoneViewport, setPhoneViewport] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 639px)');
        const updateViewport = () => setPhoneViewport(mediaQuery.matches);

        updateViewport();
        mediaQuery.addEventListener('change', updateViewport);

        return () => mediaQuery.removeEventListener('change', updateViewport);
    }, []);

    return phoneViewport;
}

export default function HabitsIndex(props: HabitsPageProps) {
    const phoneViewport = usePhoneViewport();
    const [creating, setCreating] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
    const [numericSelection, setNumericSelection] = useState<SelectedDay | null>(null);
    const [skipSelection, setSkipSelection] = useState<SelectedDay | null>(null);
    const [expandedHabitIds, setExpandedHabitIds] = useState<Set<number>>(() => new Set());
    const editingHabit = props.habits.find((habit) => habit.id === editingHabitId) ?? null;

    function setHabitCalendarExpanded(habitId: number, expanded: boolean) {
        setExpandedHabitIds((currentIds) => {
            if (phoneViewport) {
                return expanded ? new Set([habitId]) : new Set();
            }

            const nextIds = new Set(currentIds);
            if (expanded) nextIds.add(habitId);
            else nextIds.delete(habitId);

            return nextIds;
        });
    }

    return (
        <div style={{ '--module-accent': 'var(--habit-accent)' } as CSSProperties}>
            <Head title="Habits" />

            <div className="mx-auto max-w-5xl">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Habits</h1>
                    <div className="flex items-center gap-2">
                        <CalendarLabelSetting value={props.calendarLabels} />
                        <Link
                            aria-label="Archived habits"
                            className="focus-ring grid size-11 place-items-center rounded-full border border-border-strong bg-elevated text-secondary hover:bg-surface-hover hover:text-foreground"
                            href="/habits/archived"
                            title="Archived habits"
                        >
                            <Archive aria-hidden="true" size={19} />
                        </Link>
                        <Button aria-label="Create habit" className="size-11 px-0" onClick={() => setCreating(true)} title="Create habit">
                            <Plus aria-hidden="true" size={21} strokeWidth={2.5} />
                        </Button>
                    </div>
                </header>

                {props.intermission && (
                    <p className="mb-5 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">
                        Intermission: your streak is preserved and no Habit occurrences are created until the next Season starts.
                    </p>
                )}

                {props.habits.length === 0 ? (
                    <Surface className="grid min-h-64 place-items-center p-8 text-center" elevated>
                        <div>
                            <p className="text-2xl font-bold">No active habits</p>
                            <Button className="mt-5" onClick={() => setCreating(true)}>
                                <Plus aria-hidden="true" size={18} />
                                Create habit
                            </Button>
                        </div>
                    </Surface>
                ) : (
                    <div className="grid items-start gap-3">
                        {props.habits.map((habit) => (
                            <HabitCard
                                calendarLabels={props.calendarLabels}
                                calendarExpanded={expandedHabitIds.has(habit.id)}
                                habit={habit}
                                key={habit.id}
                                onEdit={() => setEditingHabitId(habit.id)}
                                onExpansionChange={(expanded) => setHabitCalendarExpanded(habit.id, expanded)}
                                onRequestSkip={(day) => setSkipSelection({ habit, day })}
                                onSelectNumeric={(day) => setNumericSelection({ habit, day })}
                                weekStart={props.currentWeek.startDate}
                            />
                        ))}
                    </div>
                )}
            </div>

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
