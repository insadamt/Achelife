import type { HabitDefinitionData, HabitDifficulty } from './types';

export const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const weekdayShortLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const difficultyLabels: Record<HabitDifficulty, string> = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
};

export function scheduleSummary(definition: HabitDefinitionData): string {
    if (definition.scheduleType === 'every_day') {
        return 'Every day';
    }

    return definition.weekdays.map((weekday) => weekdayLabels[weekday - 1]).join(' · ');
}

export function formatNumber(value: string | null): string {
    if (value === null) {
        return '0';
    }

    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function formatHabitDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(`${value}T12:00:00`),
    );
}
