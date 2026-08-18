import { router } from '@inertiajs/react';

import type { HabitCalendarLabels } from './types';

export function CalendarLabelSetting({ value }: { value: HabitCalendarLabels }) {
    function update(calendarLabels: HabitCalendarLabels) {
        router.put('/habits/settings/calendar-labels', { calendar_labels: calendarLabels }, { preserveScroll: true });
    }

    return (
        <div className="rounded-2xl border border-border-subtle bg-surface p-1.5">
            <p className="px-2 pt-1 text-[0.58rem] font-bold tracking-[0.12em] text-muted uppercase">Calendar dates</p>
            <div className="mt-1 grid grid-cols-2 gap-1">
                <button
                    aria-pressed={value === 'calendar_dates'}
                    className={`focus-ring rounded-xl px-3 py-2 text-xs font-bold ${value === 'calendar_dates' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-secondary hover:bg-surface-hover'}`}
                    onClick={() => update('calendar_dates')}
                    type="button"
                >
                    Dates
                </button>
                <button
                    aria-pressed={value === 'season_days'}
                    className={`focus-ring rounded-xl px-3 py-2 text-xs font-bold ${value === 'season_days' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-secondary hover:bg-surface-hover'}`}
                    onClick={() => update('season_days')}
                    type="button"
                >
                    Season days
                </button>
            </div>
        </div>
    );
}
