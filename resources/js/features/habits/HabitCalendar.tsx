import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

import { Button } from '../../components/ui';
import { weekdayLabels } from './habitPresentation';
import type { HabitCalendarLabels, HabitDayData, HabitViewData } from './types';

interface HabitCalendarProps {
    habit: HabitViewData;
    calendarLabels: HabitCalendarLabels;
    weekStart: string;
    onSelectNumeric: (day: HabitDayData) => void;
    onRequestSkip: (day: HabitDayData) => void;
}

const stateClasses = {
    completed: 'border-transparent bg-[#3fbf73] text-[#07170e]',
    skipped: 'border-transparent bg-[#818a97] text-[#0d1014]',
    missed: 'border-transparent bg-[#e25760] text-[#1d080a]',
    pending: 'border-[#a87318] bg-[#e8ad3d] text-[#211504]',
};

const pastStateBorders = {
    completed: 'border-[#267948]',
    skipped: 'border-[#555d69]',
    missed: 'border-[#9e363d]',
    pending: 'border-[#a87318]',
};

function addDays(date: string, days: number): string {
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate() + days);

    return value.toISOString().slice(0, 10);
}

function dayLabel(day: HabitDayData, labels: HabitCalendarLabels): number {
    return labels === 'season_days' ? day.seasonDay : day.calendarDay;
}

function DaySquare({
    day,
    labels,
    onActivate,
    onRequestSkip,
}: {
    day: HabitDayData;
    labels: HabitCalendarLabels;
    onActivate: () => void;
    onRequestSkip: () => void;
}) {
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdTriggered = useRef(false);
    const [holding, setHolding] = useState(false);
    const semanticClass = day.state ? stateClasses[day.state] : null;
    const availableClass = day.available
        ? 'border-border-strong bg-transparent text-secondary hover:border-[var(--module-accent)] hover:text-foreground'
        : 'border-transparent bg-white/[0.025] text-muted/45';
    const pastBorderClass = day.past && day.state ? pastStateBorders[day.state] : '';
    const showMonth = labels === 'calendar_dates' && (day.calendarDay === 1 || day.seasonDay === 1);

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
        <div className="relative min-w-0">
            <button
                aria-label={`${day.date}: ${day.state ?? (day.flexibleExtra ? 'optional flexible day' : 'unavailable')}`}
                className={`focus-ring relative grid aspect-square w-full min-w-0 place-items-center rounded-xl border text-sm font-bold transition-[transform,border-color,background-color,color] duration-160 ${semanticClass ?? availableClass} ${pastBorderClass} ${holding ? 'scale-95' : ''}`}
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
                {showMonth && <span className="absolute top-1 text-[0.45rem] font-bold tracking-wide uppercase opacity-70">{day.month}</span>}
                <span className={showMonth ? 'pt-2' : ''}>{dayLabel(day, labels)}</span>
                {day.numericValue !== null && day.state !== 'completed' && (
                    <span aria-hidden="true" className="absolute bottom-1 size-1 rounded-full bg-current opacity-75" />
                )}
            </button>
            {day.required && day.clickable && (
                <button
                    aria-label={`More actions for ${day.date}`}
                    className="focus-ring absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border border-border-strong bg-elevated text-[0.65rem] font-bold text-secondary hover:text-foreground"
                    onClick={onRequestSkip}
                    title="Skip this required day"
                    type="button"
                >
                    ···
                </button>
            )}
        </div>
    );
}

export function HabitCalendar({ habit, calendarLabels, weekStart, onSelectNumeric, onRequestSkip }: HabitCalendarProps) {
    const [expanded, setExpanded] = useState(false);
    const daysByDate = new Map(habit.days.map((day) => [day.date, day]));
    const weekDays = Array.from({ length: 7 }, (_, index) => daysByDate.get(addDays(weekStart, index)) ?? null);
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

    function renderDay(day: HabitDayData | null, index: number) {
        return day ? (
            <DaySquare
                day={day}
                key={day.date}
                labels={calendarLabels}
                onActivate={() => activate(day)}
                onRequestSkip={() => onRequestSkip(day)}
            />
        ) : (
            <div aria-hidden="true" className="aspect-square min-w-0" key={`placeholder-${index}`} />
        );
    }

    return (
        <div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekdayLabels.map((label) => (
                    <span className="text-center text-[0.6rem] font-bold tracking-[0.1em] text-muted uppercase" key={label}>
                        {label}
                    </span>
                ))}
                {(expanded ? expandedCells : weekDays).map(renderDay)}
            </div>
            <Button className="mx-auto mt-4 flex" onClick={() => setExpanded((value) => !value)} size="small" variant="ghost">
                {expanded ? 'Collapse calendar' : 'Expand calendar'}
            </Button>
        </div>
    );
}
