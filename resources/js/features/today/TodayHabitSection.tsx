import { Link, router } from '@inertiajs/react';
import { Check, ChevronDown, MoreVertical, Repeat2 } from 'lucide-react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { HabitIcon } from '../habits/HabitIcon';
import { NumericValueDialog } from '../habits/NumericValueDialog';
import { SkipConfirmationDialog } from '../habits/SkipConfirmationDialog';
import { formatNumber } from '../habits/habitPresentation';
import type { HabitDayData, HabitViewData } from '../habits/types';

interface SelectedHabitDay {
    habit: HabitViewData;
    day: HabitDayData;
}

function numericProgress(day: HabitDayData) {
    const value = Number(day.numericValue ?? 0);
    const target = Number(day.target ?? 0);

    return target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0;
}

function HabitCard({ habit, onNumeric, onSkip }: {
    habit: HabitViewData;
    onNumeric: (selection: SelectedHabitDay) => void;
    onSkip: (selection: SelectedHabitDay) => void;
}) {
    const day = habit.days[0]!;
    const completed = day.state === 'completed';
    const skipped = day.state === 'skipped';
    const progress = habit.type === 'numeric' ? numericProgress(day) : completed ? 100 : 0;

    function performPrimaryAction() {
        if (habit.type === 'numeric') {
            onNumeric({ habit, day });
            return;
        }

        router.post(`/habits/${habit.id}/occurrences/${day.date}/toggle`, {}, { preserveScroll: true });
    }

    const valueLabel = habit.type === 'numeric'
        ? `${formatNumber(day.numericValue ?? '0')} / ${formatNumber(day.target)}${habit.unit ? ` ${habit.unit}` : ''}`
        : skipped
          ? 'Skipped'
          : null;

    return (
        <div className={classNames('today-glass-inner relative isolate min-h-16 overflow-hidden rounded-2xl', completed && 'today-glass-completed')}>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 -z-10 bg-[color-mix(in_srgb,var(--habit-accent)_12%,transparent)] transition-[width] duration-200" style={{ width: `${progress}%` }} />
            <div className="flex min-h-16 items-center gap-2 px-3">
                <button
                    aria-label={`${habit.type === 'numeric' ? 'Update' : completed || skipped ? 'Reset' : 'Complete'} ${habit.name}`}
                    className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left"
                    onClick={performPrimaryAction}
                    type="button"
                >
                    <span className={classNames('grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors', completed ? 'today-check-pop border-[var(--habit-accent)] bg-[var(--habit-accent)] text-accent-foreground' : skipped ? 'border-warning text-warning' : 'border-border-strong hover:border-[var(--habit-accent)]')}>
                        {completed ? <Check aria-hidden="true" size={18} strokeWidth={3} /> : <HabitIcon name={habit.icon} size={16} />}
                    </span>
                    <span className={classNames('min-w-0 flex-1 truncate text-base font-bold', completed && 'line-through opacity-60')}>{habit.name}</span>
                    {valueLabel && <span className={classNames('shrink-0 text-xs font-bold', skipped ? 'text-warning' : 'text-secondary')}>{valueLabel}</span>}
                </button>
                {day.required && !skipped && (
                    <button aria-label={`Skip ${habit.name}`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => onSkip({ habit, day })} title={`Skip ${habit.name}`} type="button">
                        <MoreVertical aria-hidden="true" size={17} />
                    </button>
                )}
            </div>
        </div>
    );
}

function HabitCards({ habits, onNumeric, onSkip }: {
    habits: HabitViewData[];
    onNumeric: (selection: SelectedHabitDay) => void;
    onSkip: (selection: SelectedHabitDay) => void;
}) {
    return <div className="grid gap-2">{habits.map((habit) => <HabitCard habit={habit} key={habit.id} onNumeric={onNumeric} onSkip={onSkip} />)}</div>;
}

export function TodayHabitSection({ required, flexible, headingId }: { required: HabitViewData[]; flexible: HabitViewData[]; headingId: string }) {
    const [numericSelection, setNumericSelection] = useState<SelectedHabitDay | null>(null);
    const [skipSelection, setSkipSelection] = useState<SelectedHabitDay | null>(null);
    const resolvedCount = required.filter((habit) => ['completed', 'skipped'].includes(habit.days[0]!.state ?? '')).length;
    const unresolvedCount = required.length - resolvedCount;

    return (
        <section aria-labelledby={headingId} className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-accent/10 text-accent-ink"><Repeat2 size={20} /></span>
                    <div>
                        <h2 className="text-2xl font-bold leading-none" id={headingId}>Habits</h2>
                        <p className="mt-1 text-xs text-muted">{resolvedCount} of {required.length} resolved</p>
                    </div>
                </div>
                <span className="shrink-0 rounded-full border border-border-subtle bg-elevated px-3 py-1.5 text-xs font-bold text-secondary"><span className="today-count-change inline-block" key={unresolvedCount}>{unresolvedCount}</span> left</span>
            </div>

            {required.length > 0
                ? <HabitCards habits={required} onNumeric={setNumericSelection} onSkip={setSkipSelection} />
                : <div className="today-glass-inner rounded-2xl px-4 py-6 text-sm text-muted">
                    <p>No required habits today.</p>
                    <Link className="focus-ring mt-2 inline-block font-bold text-accent-ink hover:underline" href="/habits">Open Habits</Link>
                </div>}

            {flexible.length > 0 && (
                <details className="group mt-3">
                    <summary className="today-glass-inner focus-ring flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4">
                        <span className="text-sm font-bold text-secondary">Flexible</span>
                        <span className="icon-text flex items-center gap-2 text-xs text-muted">
                            {flexible.length}
                            <ChevronDown aria-hidden="true" className="transition-transform group-open:rotate-180" size={16} />
                        </span>
                    </summary>
                    <div className="mt-2"><HabitCards habits={flexible} onNumeric={setNumericSelection} onSkip={setSkipSelection} /></div>
                </details>
            )}

            {numericSelection && <NumericValueDialog day={numericSelection.day} habit={numericSelection.habit} onClose={() => setNumericSelection(null)} />}
            {skipSelection && <SkipConfirmationDialog day={skipSelection.day} habit={skipSelection.habit} onClose={() => setSkipSelection(null)} />}
        </section>
    );
}
