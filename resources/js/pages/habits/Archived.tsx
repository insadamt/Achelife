import { Head, Link } from '@inertiajs/react';
import { Archive, ArrowLeft, CalendarDays, Flame, Gauge, Target } from 'lucide-react';
import type { CSSProperties } from 'react';

import { Surface } from '../../components/ui';
import { difficultyLabels, formatHabitDate, formatNumber, scheduleSummary } from '../../features/habits/habitPresentation';
import type { ArchivedHabitData } from '../../features/habits/types';

export default function ArchivedHabits({ habits }: { habits: ArchivedHabitData[] }) {
    return (
        <div style={{ '--module-accent': 'var(--habit-accent)' } as CSSProperties}>
            <Head title="Archived Habits" />
            <div className="mx-auto max-w-5xl">
                <header className="mb-6 flex items-center gap-3">
                    <Link aria-label="Active habits" className="focus-ring grid size-11 place-items-center rounded-full text-secondary hover:bg-surface-hover hover:text-foreground" href="/habits" title="Active habits">
                        <ArrowLeft aria-hidden="true" size={20} />
                    </Link>
                    <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Archived</h1>
                </header>

                {habits.length === 0 ? (
                    <Surface className="p-8 text-center" elevated>
                        <p className="text-xl font-bold">No archived habits</p>
                    </Surface>
                ) : (
                    <div className="grid gap-4">
                        {habits.map((habit) => (
                            <Surface className="p-5" elevated key={habit.id}>
                                <div className="flex items-start justify-between gap-4">
                                    <h2 className="text-2xl font-bold">{habit.name}</h2>
                                    <span aria-label="Archived" className="grid size-9 shrink-0 place-items-center rounded-full border border-border-strong text-muted" title="Archived">
                                        <Archive aria-hidden="true" size={16} />
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-secondary">
                                    {habit.type === 'numeric' && (
                                        <span className="inline-flex items-center gap-1.5" title="Target">
                                            <Target aria-hidden="true" size={15} />
                                            {formatNumber(habit.numericTarget)} {habit.unit}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5" title="Difficulty and base reward">
                                        <Gauge aria-hidden="true" size={15} />
                                        {difficultyLabels[habit.difficulty]} · {habit.baseReward} SP
                                    </span>
                                    <span className="inline-flex items-center gap-1.5" title="Final streak">
                                        <Flame aria-hidden="true" size={15} />
                                        {habit.currentStreak}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5" title="Schedule">
                                        <CalendarDays aria-hidden="true" size={15} />
                                        {scheduleSummary(habit)}{habit.flexible ? ' · Flexible' : ''}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border-subtle pt-4 text-xs font-semibold text-muted">
                                    <span>Started {formatHabitDate(habit.startsOn)}</span>
                                    <span>Archived {formatHabitDate(habit.inactiveOn)}</span>
                                </div>
                            </Surface>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
