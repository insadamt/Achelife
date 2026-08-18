import { classNames } from '../../components/ui/classNames';
import type { RecurrenceType } from './types';

interface RecurrenceControlsProps {
    type: RecurrenceType | null;
    weekdays: number[];
    onTypeChange: (type: RecurrenceType | null) => void;
    onWeekdaysChange: (weekdays: number[]) => void;
    allowNone?: boolean;
}

const weekdayOptions = [
    { value: 1, label: 'M', fullLabel: 'Monday' },
    { value: 2, label: 'T', fullLabel: 'Tuesday' },
    { value: 3, label: 'W', fullLabel: 'Wednesday' },
    { value: 4, label: 'T', fullLabel: 'Thursday' },
    { value: 5, label: 'F', fullLabel: 'Friday' },
    { value: 6, label: 'S', fullLabel: 'Saturday' },
    { value: 7, label: 'S', fullLabel: 'Sunday' },
];

export function RecurrenceControls({ type, weekdays, onTypeChange, onWeekdaysChange, allowNone = true }: RecurrenceControlsProps) {
    function toggleWeekday(weekday: number) {
        const nextWeekdays = weekdays.includes(weekday)
            ? weekdays.filter((candidate) => candidate !== weekday)
            : [...weekdays, weekday].sort();
        onWeekdaysChange(nextWeekdays);
    }

    return (
        <div>
            <div className="grid gap-2 sm:grid-cols-2">
                {allowNone && (
                    <button
                        aria-pressed={type === null}
                        className={classNames('focus-ring min-h-11 rounded-2xl border px-4 text-sm font-bold', type === null ? 'accent-border bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-foreground' : 'border-border-strong bg-app text-secondary')}
                        onClick={() => onTypeChange(null)}
                        type="button"
                    >
                        Does not repeat
                    </button>
                )}
                <button
                    aria-pressed={type === 'daily'}
                    className={classNames('focus-ring min-h-11 rounded-2xl border px-4 text-sm font-bold', type === 'daily' ? 'accent-border bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-foreground' : 'border-border-strong bg-app text-secondary')}
                    onClick={() => onTypeChange('daily')}
                    type="button"
                >
                    Every day
                </button>
                <button
                    aria-pressed={type === 'weekdays'}
                    className={classNames('focus-ring min-h-11 rounded-2xl border px-4 text-sm font-bold', type === 'weekdays' ? 'accent-border bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-foreground' : 'border-border-strong bg-app text-secondary')}
                    onClick={() => onTypeChange('weekdays')}
                    type="button"
                >
                    Selected weekdays
                </button>
            </div>

            {type === 'weekdays' && (
                <fieldset className="mt-5">
                    <legend className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Repeat on</legend>
                    <div className="mt-3 flex justify-between gap-1.5">
                        {weekdayOptions.map((weekday) => (
                            <button
                                aria-label={weekday.fullLabel}
                                aria-pressed={weekdays.includes(weekday.value)}
                                className={classNames(
                                    'focus-ring grid size-10 place-items-center rounded-full border text-xs font-bold transition-colors',
                                    weekdays.includes(weekday.value)
                                        ? 'border-[var(--module-accent)] bg-[var(--module-accent)] text-accent-foreground'
                                        : 'border-border-strong bg-app text-secondary hover:text-foreground',
                                )}
                                key={weekday.value}
                                onClick={() => toggleWeekday(weekday.value)}
                                type="button"
                            >
                                {weekday.label}
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}
        </div>
    );
}
