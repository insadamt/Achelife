import { router } from '@inertiajs/react';
import { CalendarDays, Hash } from 'lucide-react';

import type { HabitCalendarLabels } from './types';

export function CalendarLabelSetting({ value }: { value: HabitCalendarLabels }) {
    function update(calendarLabels: HabitCalendarLabels) {
        router.put('/habits/settings/calendar-labels', { calendar_labels: calendarLabels }, { preserveScroll: true });
    }

    return (
        <div aria-label="Calendar labels" className="flex rounded-full border border-border-subtle bg-surface p-1" role="group">
            <button
                aria-label="Show calendar dates"
                aria-pressed={value === 'calendar_dates'}
                className={`focus-ring grid size-9 place-items-center rounded-full ${value === 'calendar_dates' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-secondary hover:bg-surface-hover hover:text-foreground'}`}
                onClick={() => update('calendar_dates')}
                title="Calendar dates"
                type="button"
            >
                <CalendarDays aria-hidden="true" size={17} />
            </button>
            <button
                aria-label="Show Season days"
                aria-pressed={value === 'season_days'}
                className={`focus-ring grid size-9 place-items-center rounded-full ${value === 'season_days' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-secondary hover:bg-surface-hover hover:text-foreground'}`}
                onClick={() => update('season_days')}
                title="Season days"
                type="button"
            >
                <Hash aria-hidden="true" size={17} />
            </button>
        </div>
    );
}
