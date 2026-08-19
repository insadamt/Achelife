import { router } from '@inertiajs/react';
import { Archive, CalendarDays, Flame, Gauge, MoreHorizontal, Pencil, Shuffle, Target, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { HabitCalendar } from './HabitCalendar';
import { HabitProgressSummary } from './HabitProgressSummary';
import { difficultyLabels, formatNumber, scheduleSummary } from './habitPresentation';
import type { HabitCalendarLabels, HabitDayData, HabitViewData } from './types';

interface HabitCardProps {
    habit: HabitViewData;
    calendarLabels: HabitCalendarLabels;
    calendarExpanded: boolean;
    weekStart: string;
    onEdit: () => void;
    onExpansionChange: (expanded: boolean) => void;
    onSelectNumeric: (day: HabitDayData) => void;
    onRequestSkip: (day: HabitDayData) => void;
}

type LifecycleConfirmation = 'archive' | 'delete' | null;

export function HabitCard({ habit, calendarLabels, calendarExpanded, weekStart, onEdit, onExpansionChange, onSelectNumeric, onRequestSkip }: HabitCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<LifecycleConfirmation>(null);

    function finishLifecycle() {
        if (confirmation === 'archive') {
            router.post(`/habits/${habit.id}/archive`, {}, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        } else if (confirmation === 'delete') {
            router.delete(`/habits/${habit.id}`, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        }
    }

    return (
        <Surface className="habit-card relative overflow-visible rounded-[1.3rem] px-4 py-3.5 sm:p-4">
            <div className={classNames(
                'grid gap-3.5 md:grid-cols-[minmax(0,1fr)_minmax(20rem,27rem)] md:gap-5',
                calendarExpanded ? 'md:items-stretch' : 'md:items-center',
            )}>
                <div className={classNames('min-w-0', calendarExpanded && 'md:flex md:flex-col')}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-bold tracking-[-0.02em] text-foreground sm:text-[1.35rem]">{habit.name}</h2>
                            {habit.flexible && (
                                <span aria-label="Flexible" className="grid size-7 place-items-center rounded-full border border-[color-mix(in_srgb,var(--module-accent)_42%,var(--border-subtle))] text-[var(--module-accent)]" title="Flexible">
                                    <Shuffle aria-hidden="true" size={14} />
                                </span>
                            )}
                            {habit.changesStartTomorrow && (
                                <span aria-label="Rule changes start tomorrow" className="grid size-7 place-items-center rounded-full border border-warning/40 text-warning" title="Rule changes start tomorrow">
                                    <TriangleAlert aria-hidden="true" size={14} />
                                </span>
                            )}
                        </div>
                        <div className="relative shrink-0">
                            <button
                                aria-expanded={menuOpen}
                                aria-label={`Actions for ${habit.name}`}
                                className="focus-ring grid size-9 place-items-center rounded-full text-secondary hover:bg-surface-hover hover:text-foreground"
                                onClick={() => setMenuOpen((value) => !value)}
                                type="button"
                            >
                                <MoreHorizontal aria-hidden="true" size={18} />
                            </button>
                            {menuOpen && (
                                <div className="absolute top-10 right-0 z-20 w-40 rounded-2xl border border-border-strong bg-elevated p-1.5 shadow-2xl">
                                    <button className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={() => { setMenuOpen(false); onEdit(); }} type="button"><Pencil aria-hidden="true" size={15} />Edit</button>
                                    <button className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={() => { setMenuOpen(false); setConfirmation('archive'); }} type="button"><Archive aria-hidden="true" size={15} />Archive</button>
                                    <button className="focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/10" onClick={() => { setMenuOpen(false); setConfirmation('delete'); }} type="button"><Trash2 aria-hidden="true" size={15} />Delete</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-sm font-semibold text-secondary">
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
                        <span className={classNames('inline-flex items-center gap-1.5 text-[var(--module-accent)]', calendarExpanded && 'md:hidden')} title="Current streak">
                            <Flame aria-hidden="true" size={15} />
                            {habit.currentStreak}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5" title={scheduleSummary(habit)}>
                            <CalendarDays aria-hidden="true" className="shrink-0" size={15} />
                            <span className="truncate">{scheduleSummary(habit)}</span>
                        </span>
                    </div>

                    {calendarExpanded && <HabitProgressSummary habit={habit} />}
                </div>

                <div className={classNames(
                    'min-w-0 border-border-subtle',
                    'border-t pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-5',
                )}>
                    <HabitCalendar
                        calendarLabels={calendarLabels}
                        expanded={calendarExpanded}
                        habit={habit}
                        onExpansionChange={onExpansionChange}
                        onRequestSkip={onRequestSkip}
                        onSelectNumeric={onSelectNumeric}
                        weekStart={weekStart}
                    />
                </div>
            </div>

            <Dialog
                description={confirmation === 'delete'
                    ? "Removes today's entry and stops future activity. History and SP remain preserved."
                    : "Stops future activity and removes today's entry. Archived habits cannot be reactivated."}
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
