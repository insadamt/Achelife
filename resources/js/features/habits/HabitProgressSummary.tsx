import { CalendarDays, Sparkles, TrendingUp } from 'lucide-react';

import type { HabitViewData } from './types';

function streakMultiplier(streak: number): number {
    if (streak >= 20) return 2;
    if (streak >= 10) return 1.5;

    return 1;
}

function nextMilestoneLabel(streak: number): string {
    if (streak < 10) return `${10 - streak}`;
    if (streak < 20) return `${20 - streak}`;

    return 'Max';
}

function nextMilestoneTier(streak: number): string {
    if (streak < 10) return 'To ×1.5';
    if (streak < 20) return 'To ×2';

    return 'Multiplier';
}

function formatCompactDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function HabitProgressSummary({ habit }: { habit: HabitViewData }) {
    const nextCompletionStreak = habit.currentStreak + 1;
    const nextReward = habit.baseReward * streakMultiplier(nextCompletionStreak);
    const ladderProgress = Math.min(100, (habit.currentStreak / 20) * 100);
    const currentMultiplier = streakMultiplier(Math.max(1, habit.currentStreak));

    return (
        <section aria-label="Streak and reward progress" className="hidden flex-1 items-center justify-center py-7 md:flex">
            <div className="w-full max-w-sm">
                <div className="flex items-end justify-between gap-6">
                    <div>
                        <strong className="text-6xl leading-none tracking-[-0.06em] text-foreground">{habit.currentStreak}</strong>
                        <p className="mt-1 text-[0.65rem] font-bold tracking-[0.16em] text-muted uppercase">Current streak</p>
                    </div>
                    <div className="pb-1 text-right">
                        <strong className="text-3xl leading-none text-[var(--module-accent)]">×{currentMultiplier}</strong>
                        <p className="mt-1 text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase">Multiplier</p>
                    </div>
                </div>

                <div className="mt-7" aria-label={`Current streak ${habit.currentStreak}. Reward multiplier milestones at 10 and 20 completions.`}>
                    <div className="relative h-px bg-border-strong">
                        <span className="absolute -top-px left-0 h-[3px] rounded-full bg-[var(--module-accent)] transition-[width] duration-200" style={{ width: `${ladderProgress}%` }} />
                        <span className="absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-strong bg-surface" />
                        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-strong bg-surface" />
                        <span className="absolute top-1/2 right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full border border-border-strong bg-surface" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 text-[0.65rem] font-bold text-muted">
                        <span>×1</span>
                        <span className="text-center">×1.5 · 10</span>
                        <span className="text-right">×2 · 20</span>
                    </div>
                </div>

                <div className="mt-7 grid grid-cols-3 divide-x divide-border-subtle border-t border-border-subtle pt-4 text-center">
                    <div className="px-2">
                        <Sparkles aria-hidden="true" className="mx-auto text-[var(--module-accent)]" size={15} />
                        <strong className="mt-2 block text-sm text-foreground">+{nextReward} SP</strong>
                        <span className="mt-0.5 block text-[0.6rem] font-bold tracking-wider text-muted uppercase">Next</span>
                    </div>
                    <div className="px-2">
                        <TrendingUp aria-hidden="true" className="mx-auto text-secondary" size={15} />
                        <strong className="mt-2 block text-sm text-foreground">{nextMilestoneLabel(habit.currentStreak)}</strong>
                        <span className="mt-0.5 block text-[0.6rem] font-bold tracking-wider text-muted uppercase">{nextMilestoneTier(habit.currentStreak)}</span>
                    </div>
                    <div className="px-2">
                        <CalendarDays aria-hidden="true" className="mx-auto text-secondary" size={15} />
                        <strong className="mt-2 block text-sm text-foreground">{formatCompactDate(habit.startsOn)}</strong>
                        <span className="mt-0.5 block text-[0.6rem] font-bold tracking-wider text-muted uppercase">Started</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
