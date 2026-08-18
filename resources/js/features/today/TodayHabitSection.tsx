import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { NumericValueDialog } from '../habits/NumericValueDialog';
import { SkipConfirmationDialog } from '../habits/SkipConfirmationDialog';
import { formatNumber } from '../habits/habitPresentation';
import type { HabitDayData, HabitViewData } from '../habits/types';

interface SelectedHabitDay {
    habit: HabitViewData;
    day: HabitDayData;
}

function HabitRow({ habit, onNumeric, onSkip }: {
    habit: HabitViewData;
    onNumeric: (selection: SelectedHabitDay) => void;
    onSkip: (selection: SelectedHabitDay) => void;
}) {
    const day = habit.days[0]!;
    const resolved = day.state === 'completed' || day.state === 'skipped';

    function primaryAction() {
        if (habit.type === 'numeric') onNumeric({ habit, day });
        else router.post(`/habits/${habit.id}/occurrences/${day.date}/toggle`, {}, { preserveScroll: true });
    }

    return (
        <div className={classNames('flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0', resolved && 'opacity-70')}>
            <button
                aria-label={habit.type === 'numeric' ? `Edit ${habit.name} value` : `${resolved ? 'Undo' : 'Complete'} ${habit.name}`}
                className={classNames(
                    'focus-ring grid size-9 shrink-0 place-items-center rounded-full border-2 font-bold transition-colors',
                    day.state === 'completed' && 'border-success bg-success text-accent-foreground',
                    day.state === 'skipped' && 'border-warning text-warning',
                    !resolved && 'border-border-strong hover:border-[var(--habit-accent)]',
                )}
                onClick={primaryAction}
                type="button"
            >
                {day.state === 'completed' ? '✓' : day.state === 'skipped' ? '—' : '○'}
            </button>
            <button className="focus-ring min-w-0 flex-1 rounded-lg text-left" onClick={primaryAction} type="button">
                <span className={classNames('block truncate text-base font-bold', day.state === 'completed' && 'line-through')}>{habit.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                    {habit.type === 'numeric'
                        ? `${formatNumber(day.numericValue ?? '0')} / ${formatNumber(day.target)} ${habit.unit ?? ''}`
                        : `Streak ${habit.currentStreak}`}
                </span>
            </button>
            {day.required && day.state !== 'skipped' && (
                <Button aria-label={`Skip ${habit.name}`} onClick={() => onSkip({ habit, day })} size="small" variant="ghost">Skip</Button>
            )}
            <span className="w-12 shrink-0 text-right text-xs font-bold text-[var(--habit-accent)]">+{day.state === 'completed' ? day.earnedSp : habit.baseReward} SP</span>
        </div>
    );
}

export function TodayHabitSection({ required, flexible }: { required: HabitViewData[]; flexible: HabitViewData[] }) {
    const [numericSelection, setNumericSelection] = useState<SelectedHabitDay | null>(null);
    const [skipSelection, setSkipSelection] = useState<SelectedHabitDay | null>(null);

    return (
        <>
            <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                    <div><p className="text-xs font-bold tracking-[0.18em] text-[var(--habit-accent)] uppercase">Habits</p><h2 className="mt-1 text-2xl font-bold">Required today</h2></div>
                    <span className="text-xs font-semibold text-muted">{required.length} required</span>
                </div>
                <div className="rounded-3xl border border-border-subtle bg-surface px-4 sm:px-5">
                    {required.length > 0
                        ? required.map((habit) => <HabitRow habit={habit} key={habit.id} onNumeric={setNumericSelection} onSkip={setSkipSelection} />)
                        : <p className="py-7 text-sm text-secondary">No required Habits today.</p>}
                </div>
            </section>

            {flexible.length > 0 && (
                <details className="group rounded-3xl border border-border-subtle bg-surface px-4 sm:px-5">
                    <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl py-4">
                        <span><span className="block text-xs font-bold tracking-[0.16em] text-muted uppercase">Optional Habits</span><span className="mt-1 block text-sm text-secondary">{flexible.length} available</span></span>
                        <span aria-hidden="true" className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="border-t border-border-subtle pb-1">
                        {flexible.map((habit) => <HabitRow habit={habit} key={habit.id} onNumeric={setNumericSelection} onSkip={setSkipSelection} />)}
                    </div>
                </details>
            )}

            {numericSelection && <NumericValueDialog day={numericSelection.day} habit={numericSelection.habit} onClose={() => setNumericSelection(null)} />}
            {skipSelection && <SkipConfirmationDialog day={skipSelection.day} habit={skipSelection.habit} onClose={() => setSkipSelection(null)} />}
        </>
    );
}
