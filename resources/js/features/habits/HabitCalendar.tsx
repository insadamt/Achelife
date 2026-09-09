import { router } from '@inertiajs/react';
import { Check, ChevronDown, Circle, Minus, MoreHorizontal, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { weekdayLabels } from './habitPresentation';
import type { HabitCalendarLabels, HabitDayData, HabitViewData } from './types';

interface HabitCalendarProps {
    habit: HabitViewData;
    calendarLabels: HabitCalendarLabels;
    expanded: boolean;
    onExpansionChange: (expanded: boolean) => void;
    onSelectNumeric: (day: HabitDayData) => void;
    onRequestSkip: (day: HabitDayData) => void;
}

const stateClasses = {
    completed: 'border-transparent bg-[var(--habit-completed)] text-[var(--habit-completed-foreground)]',
    skipped: 'border-transparent bg-[var(--habit-skipped)] text-[var(--habit-skipped-foreground)]',
    missed: 'border-transparent bg-[var(--habit-missed)] text-[var(--habit-missed-foreground)]',
    pending: 'border-[var(--habit-pending-border)] bg-[var(--habit-pending)] text-[var(--habit-pending-foreground)]',
};

const pastStateBorders = {
    completed: 'border-[var(--habit-completed-border)]',
    skipped: 'border-[var(--habit-skipped-border)]',
    missed: 'border-[var(--habit-missed-border)]',
    pending: 'border-[var(--habit-pending-border)]',
};

const stateIcons = {
    completed: Check,
    skipped: Minus,
    missed: X,
    pending: Circle,
};

function dayLabel(day: HabitDayData, labels: HabitCalendarLabels): number {
    return labels === 'season_days' && day.seasonDay > 0 ? day.seasonDay : day.calendarDay;
}

function DaySquare({
    day,
    labels,
    weekdayLabel,
    onActivate,
    onRequestSkip,
}: {
    day: HabitDayData;
    labels: HabitCalendarLabels;
    weekdayLabel?: string;
    onActivate: () => void;
    onRequestSkip: () => void;
}) {
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdTriggered = useRef(false);
    const [holding, setHolding] = useState(false);
    const semanticClass = day.state ? stateClasses[day.state] : null;
    const availableClass = day.available
        ? 'border-border-strong bg-transparent text-secondary hover:border-[var(--module-accent)] hover:text-foreground'
        : weekdayLabel
          ? 'border-transparent bg-foreground/[0.035] text-muted/60'
          : 'border-transparent bg-transparent text-muted/45';
    const pastBorderClass = day.past && day.state ? pastStateBorders[day.state] : '';
    const showMonth = !weekdayLabel && labels === 'calendar_dates' && (day.calendarDay === 1 || day.seasonDay === 1);
    const StateIcon = day.state ? stateIcons[day.state] : null;

    function startHold() {
        if (!day.required || !day.clickable) {
            return;
        }

        holdTriggered.current = false;
        setHolding(true);
        holdTimer.current = setTimeout(() => {
            holdTriggered.current = true;
            setHolding(false);
            onRequestSkip();
        }, 550);
    }

    function cancelHold() {
        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
        }
        setHolding(false);
    }

    return (
        <div className="group relative min-w-0">
            <button
                aria-label={`${day.date}: ${day.state ?? (day.flexibleExtra ? 'optional flexible day' : 'unavailable')}`}
                className={`focus-ring relative grid aspect-square w-full min-w-0 place-items-center rounded-lg border text-sm font-bold transition-[transform,border-color,background-color,color] duration-160 sm:rounded-xl ${semanticClass ?? availableClass} ${pastBorderClass} ${day.today ? 'ring-1 ring-[var(--module-accent)] ring-offset-1 ring-offset-elevated' : ''} ${holding ? 'scale-95' : ''}`}
                disabled={!day.clickable}
                onClick={() => {
                    if (holdTriggered.current) {
                        holdTriggered.current = false;
                        return;
                    }
                    onActivate();
                }}
                onContextMenu={(event) => {
                    if (day.required && day.clickable) {
                        event.preventDefault();
                        onRequestSkip();
                    }
                }}
                onPointerCancel={cancelHold}
                onPointerDown={startHold}
                onPointerLeave={cancelHold}
                onPointerUp={cancelHold}
                type="button"
            >
                {weekdayLabel && <span className="absolute top-1.5 text-[0.5rem] font-bold tracking-[0.08em] uppercase opacity-75">{weekdayLabel}</span>}
                {showMonth && <span className="absolute top-1 text-[0.45rem] font-bold tracking-wide uppercase opacity-70">{day.month}</span>}
                <span className={weekdayLabel || showMonth ? 'pt-2.5' : ''}>{dayLabel(day, labels)}</span>
                {StateIcon && <StateIcon aria-hidden="true" className="absolute right-1 bottom-1 opacity-80" fill={day.state === 'pending' ? 'currentColor' : 'none'} size={9} strokeWidth={3} />}
                {!day.state && day.flexibleExtra && <Plus aria-hidden="true" className="absolute right-1 bottom-1 opacity-70" size={9} strokeWidth={3} />}
                {day.numericValue !== null && day.state !== 'completed' && <span aria-hidden="true" className="absolute bottom-1 left-1 size-1 rounded-full bg-current opacity-75" />}
            </button>
            {day.required && day.clickable && (
                <button
                    aria-label={`More actions for ${day.date}`}
                    className="focus-ring absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border border-border-strong bg-elevated text-[0.65rem] font-bold text-secondary transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    onClick={onRequestSkip}
                    title="Skip this required day"
                    type="button"
                >
                    <MoreHorizontal aria-hidden="true" size={11} />
                </button>
            )}
        </div>
    );
}

export function HabitCalendar({ habit, calendarLabels, expanded, onExpansionChange, onSelectNumeric, onRequestSkip }: HabitCalendarProps) {
    const leadingPlaceholders = habit.days[0] ? habit.days[0].weekday - 1 : 0;
    const expandedCells = [...Array.from({ length: leadingPlaceholders }, () => null), ...habit.days];
    const trailingPlaceholders = (7 - (expandedCells.length % 7)) % 7;
    expandedCells.push(...Array.from({ length: trailingPlaceholders }, () => null));

    function activate(day: HabitDayData) {
        if (day.state === 'skipped') {
            router.delete(`/habits/${habit.id}/occurrences/${day.date}`, { preserveScroll: true });
            return;
        }

        if (habit.type === 'numeric') {
            onSelectNumeric(day);
            return;
        }

        router.post(`/habits/${habit.id}/occurrences/${day.date}/toggle`, {}, { preserveScroll: true });
    }

    function renderDay(day: HabitDayData | null, index: number, weekdayLabel?: string) {
        return day ? (
            <DaySquare
                day={day}
                key={day.date}
                labels={calendarLabels}
                onActivate={() => activate(day)}
                onRequestSkip={() => onRequestSkip(day)}
                weekdayLabel={weekdayLabel}
            />
        ) : (
            <div aria-hidden="true" className={`relative aspect-square min-w-0 rounded-lg sm:rounded-xl ${weekdayLabel ? 'bg-foreground/[0.035]' : 'bg-transparent'}`} key={`placeholder-${index}`}>
                {weekdayLabel && <span className="absolute inset-x-0 top-1.5 text-center text-[0.5rem] font-bold tracking-[0.08em] text-muted/65 uppercase">{weekdayLabel}</span>}
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[27rem]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-secondary">{expanded ? 'Season calendar' : 'Last 7 days'}</p>
                <button aria-expanded={expanded} aria-label={expanded ? 'Collapse calendar' : 'Expand calendar'} className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => onExpansionChange(!expanded)} type="button">
                    {expanded ? 'Last 7 days' : 'Show season'}<ChevronDown aria-hidden="true" className={`transition-transform ${expanded ? 'rotate-180' : ''}`} size={15} />
                </button>
            </div>
            {expanded ? (
                <div className="rounded-2xl border border-border-subtle bg-app/45 p-3 sm:p-4">
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {weekdayLabels.map((label) => (
                            <span className="pb-1 text-center text-[0.6rem] font-bold tracking-[0.08em] text-muted uppercase" key={label}>
                                {label}
                            </span>
                        ))}
                        {expandedCells.map((day, index) => renderDay(day, index))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {habit.recentDays.map((day, index) => renderDay(day, index, day.today ? 'Today' : weekdayLabels[day.weekday - 1]))}
                </div>
            )}

        </div>
    );
}
