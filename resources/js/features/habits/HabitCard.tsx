import { Link, router } from '@inertiajs/react';
import { Archive, ArrowUpRight, BarChart3, Flame, MoreHorizontal, Pencil, Shuffle, Trash2, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, Dialog, Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { HabitCalendar } from './HabitCalendar';
import { HabitIcon } from './HabitIcon';
import { HabitProgressSummary } from './HabitProgressSummary';
import type { HabitCalendarLabels, HabitDayData, HabitViewData } from './types';

interface HabitCardProps {
    habit: HabitViewData;
    calendarLabels: HabitCalendarLabels;
    calendarExpanded: boolean;
    onEdit: () => void;
    onExpansionChange: (expanded: boolean) => void;
    onSelectNumeric: (day: HabitDayData) => void;
    onRequestSkip: (day: HabitDayData) => void;
}

type LifecycleConfirmation = 'archive' | 'delete' | null;

export function HabitCard({ habit, calendarLabels, calendarExpanded, onEdit, onExpansionChange, onSelectNumeric, onRequestSkip }: HabitCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<LifecycleConfirmation>(null);
    const menuContainer = useRef<HTMLDivElement>(null);
    const menuTrigger = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        function closeOutside(event: PointerEvent) {
            if (!menuContainer.current?.contains(event.target as Node)) setMenuOpen(false);
        }
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape') return;
            setMenuOpen(false);
            menuTrigger.current?.focus();
        }
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [menuOpen]);


    function finishLifecycle() {
        if (confirmation === 'archive') {
            router.post(`/habits/${habit.id}/archive`, {}, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        } else if (confirmation === 'delete') {
            router.delete(`/habits/${habit.id}`, { preserveScroll: true, onSuccess: () => setConfirmation(null) });
        }
    }

    return (
        <Surface className="habit-card relative overflow-visible rounded-3xl px-4 py-5 transition-colors hover:border-border-strong sm:p-6">
            <div className={classNames(
                'grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(20rem,27rem)] md:gap-7',
                calendarExpanded ? 'md:items-stretch' : 'md:items-center',
            )}>
                <div className={classNames('min-w-0', calendarExpanded && 'md:flex md:flex-col')}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-subtle bg-elevated text-accent-ink"><HabitIcon name={habit.icon} /></span>
                            <h2 className="min-w-0 flex-1 break-words text-xl font-bold tracking-[-0.02em] text-foreground sm:text-[1.35rem]">{habit.name}</h2>
                            {habit.flexible && (
                                <span aria-label="Flexible" className="grid size-7 place-items-center rounded-full border border-[color-mix(in_srgb,var(--module-accent)_42%,var(--border-subtle))] text-accent-ink" title="Flexible">
                                    <Shuffle aria-hidden="true" size={14} />
                                </span>
                            )}
                            {habit.changesStartTomorrow && (
                                <span aria-label="Rule changes start tomorrow" className="grid size-7 place-items-center rounded-full border border-warning/40 text-warning" title="Rule changes start tomorrow">
                                    <TriangleAlert aria-hidden="true" size={14} />
                                </span>
                            )}
                        </div>
                        <div className="relative shrink-0" ref={menuContainer}>
                            <button
                                ref={menuTrigger}
                                aria-expanded={menuOpen}
                                aria-label={`Actions for ${habit.name}`}
                                className="focus-ring grid size-11 place-items-center rounded-full text-secondary hover:bg-surface-hover hover:text-foreground"
                                onClick={() => setMenuOpen((value) => !value)}
                                type="button"
                            >
                                <MoreHorizontal aria-hidden="true" size={18} />
                            </button>
                            {menuOpen && (
                                <div className="absolute top-12 right-0 z-20 w-40 rounded-2xl border border-border-strong bg-elevated p-1.5 shadow-2xl">
                                    <button className="focus-ring flex w-full items-center gap-2 min-h-11 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={() => { setMenuOpen(false); onEdit(); }} type="button"><Pencil aria-hidden="true" size={15} />Edit</button>
                                    <button className="focus-ring flex w-full items-center gap-2 min-h-11 rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={() => { setMenuOpen(false); setConfirmation('archive'); }} type="button"><Archive aria-hidden="true" size={15} />Archive</button>
                                    <button className="focus-ring flex w-full items-center gap-2 min-h-11 rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/10" onClick={() => { setMenuOpen(false); setConfirmation('delete'); }} type="button"><Trash2 aria-hidden="true" size={15} />Delete</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-secondary" title="Current streak">
                            <Flame aria-hidden="true" className="text-accent-ink" size={17} />
                            <strong className="text-base tabular-nums text-foreground">{habit.currentStreak}</strong> streak
                        </span>
                        <Link aria-label={`Statistics for ${habit.name}`} className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-border-subtle bg-elevated px-3 text-xs font-bold text-secondary transition-colors hover:border-[var(--module-accent)] hover:text-accent-ink" href={`/habits/${habit.id}/statistics`}>
                            <BarChart3 aria-hidden="true" size={15} />Statistics<ArrowUpRight aria-hidden="true" size={14} />
                        </Link>
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
