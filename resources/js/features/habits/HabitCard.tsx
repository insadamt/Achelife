import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button, Dialog, Surface } from '../../components/ui';
import { HabitCalendar } from './HabitCalendar';
import { difficultyLabels, formatNumber, scheduleSummary } from './habitPresentation';
import type { HabitCalendarLabels, HabitDayData, HabitViewData } from './types';

interface HabitCardProps {
    habit: HabitViewData;
    calendarLabels: HabitCalendarLabels;
    weekStart: string;
    onEdit: () => void;
    onSelectNumeric: (day: HabitDayData) => void;
    onRequestSkip: (day: HabitDayData) => void;
}

type LifecycleConfirmation = 'archive' | 'delete' | null;

export function HabitCard({ habit, calendarLabels, weekStart, onEdit, onSelectNumeric, onRequestSkip }: HabitCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<LifecycleConfirmation>(null);
    const numericSummary = habit.type === 'numeric' ? `${formatNumber(habit.numericTarget)} ${habit.unit}` : 'Done / Not done';

    function finishLifecycle() {
        if (confirmation === 'archive') {
            router.post(`/habits/${habit.id}/archive`, {}, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        } else if (confirmation === 'delete') {
            router.delete(`/habits/${habit.id}`, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        }
    }

    return (
        <Surface className="relative overflow-visible p-4 sm:p-5" elevated>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-bold tracking-[-0.02em] sm:text-2xl">{habit.name}</h2>
                        {habit.flexible && (
                            <span className="rounded-full border border-[color-mix(in_srgb,var(--module-accent)_42%,var(--border-subtle))] px-2 py-0.5 text-[0.6rem] font-bold tracking-wider text-[var(--module-accent)] uppercase">
                                Flexible
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-secondary">{numericSummary}</p>
                </div>
                <div className="relative shrink-0">
                    <button
                        aria-expanded={menuOpen}
                        aria-label={`Actions for ${habit.name}`}
                        className="focus-ring grid size-10 place-items-center rounded-xl border border-border-subtle text-lg font-bold text-secondary hover:bg-surface-hover hover:text-foreground"
                        onClick={() => setMenuOpen((value) => !value)}
                        type="button"
                    >
                        ···
                    </button>
                    {menuOpen && (
                        <div className="absolute top-11 right-0 z-20 w-36 rounded-2xl border border-border-strong bg-elevated p-1.5 shadow-2xl">
                            <button className="focus-ring w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={() => { setMenuOpen(false); onEdit(); }} type="button">Edit</button>
                            <button className="focus-ring w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={() => { setMenuOpen(false); setConfirmation('archive'); }} type="button">Archive</button>
                            <button className="focus-ring w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/10" onClick={() => { setMenuOpen(false); setConfirmation('delete'); }} type="button">Delete</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-border-subtle py-3">
                <div>
                    <p className="text-[0.58rem] font-bold tracking-[0.12em] text-muted uppercase">Difficulty</p>
                    <p className="mt-1 text-sm font-bold">{difficultyLabels[habit.difficulty]} · {habit.baseReward} SP</p>
                </div>
                <div>
                    <p className="text-[0.58rem] font-bold tracking-[0.12em] text-muted uppercase">Streak</p>
                    <p className="mt-1 text-sm font-bold text-[var(--module-accent)]">{habit.currentStreak} {habit.currentStreak === 1 ? 'day' : 'days'}</p>
                </div>
                <div>
                    <p className="text-[0.58rem] font-bold tracking-[0.12em] text-muted uppercase">Schedule</p>
                    <p className="mt-1 truncate text-sm font-bold" title={scheduleSummary(habit)}>{scheduleSummary(habit)}</p>
                </div>
            </div>

            {habit.changesStartTomorrow && <p className="mt-3 text-xs font-semibold text-warning">A definition update starts tomorrow.</p>}

            <div className="mt-5">
                <HabitCalendar
                    calendarLabels={calendarLabels}
                    habit={habit}
                    onRequestSkip={onRequestSkip}
                    onSelectNumeric={onSelectNumeric}
                    weekStart={weekStart}
                />
            </div>

            <Dialog
                description={confirmation === 'delete'
                    ? "Today's occurrence is removed, future occurrences stop, and this Habit will no longer be accessible. Previous historical data and SP remain preserved."
                    : "Today's occurrence is removed and future occurrences stop. The Habit remains accessible in Archived Habits, but it cannot be reactivated."}
                onClose={() => setConfirmation(null)}
                open={confirmation !== null}
                title={confirmation === 'delete' ? `Delete ${habit.name}?` : `Archive ${habit.name}?`}
            >
                <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setConfirmation(null)} variant="secondary">Cancel</Button>
                    <Button className="flex-1" onClick={finishLifecycle} variant={confirmation === 'delete' ? 'destructive' : 'primary'}>
                        {confirmation === 'delete' ? 'Delete forever' : 'Archive permanently'}
                    </Button>
                </div>
            </Dialog>
        </Surface>
    );
}
