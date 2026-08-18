import { Head, Link } from '@inertiajs/react';
import type { CSSProperties } from 'react';

import { Surface } from '../../components/ui';
import { difficultyLabels, formatHabitDate, formatNumber, scheduleSummary } from '../../features/habits/habitPresentation';
import type { ArchivedHabitData } from '../../features/habits/types';

export default function ArchivedHabits({ habits }: { habits: ArchivedHabitData[] }) {
    return (
        <div style={{ '--module-accent': 'var(--habit-accent)' } as CSSProperties}>
            <Head title="Archived Habits" />
            <header className="mb-8">
                <Link className="focus-ring text-sm font-bold text-[var(--module-accent)] hover:underline" href="/habits">← Active Habits</Link>
                <p className="mt-6 text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">Read-only history</p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Archived Habits</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">Permanently inactive Habits remain accessible here. They cannot be reactivated or logged.</p>
            </header>

            {habits.length === 0 ? (
                <Surface className="p-8 text-center" elevated>
                    <p className="text-xl font-bold">No archived Habits</p>
                    <p className="mt-2 text-sm text-secondary">Habits you archive will remain available here.</p>
                </Surface>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {habits.map((habit) => (
                        <Surface className="p-5" elevated key={habit.id}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{habit.name}</h2>
                                    <p className="mt-1 text-sm text-secondary">
                                        {habit.type === 'numeric' ? `${formatNumber(habit.numericTarget)} ${habit.unit}` : 'Boolean'}
                                    </p>
                                </div>
                                <span className="rounded-full border border-border-strong px-3 py-1 text-[0.6rem] font-bold tracking-wider text-muted uppercase">Archived</span>
                            </div>
                            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4 text-sm">
                                <div><dt className="text-muted">Difficulty</dt><dd className="mt-1 font-bold">{difficultyLabels[habit.difficulty]} · {habit.baseReward} SP</dd></div>
                                <div><dt className="text-muted">Schedule</dt><dd className="mt-1 font-bold">{scheduleSummary(habit)}{habit.flexible ? ' · Flexible' : ''}</dd></div>
                                <div><dt className="text-muted">Started</dt><dd className="mt-1 font-bold">{formatHabitDate(habit.startsOn)}</dd></div>
                                <div><dt className="text-muted">Archived</dt><dd className="mt-1 font-bold">{formatHabitDate(habit.inactiveOn)}</dd></div>
                            </dl>
                            <p className="mt-4 text-xs text-muted">Activity is read-only. Detailed Habit statistics are reserved for a later phase.</p>
                        </Surface>
                    ))}
                </div>
            )}
        </div>
    );
}
