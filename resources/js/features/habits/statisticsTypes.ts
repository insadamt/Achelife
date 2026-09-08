export interface HabitStatisticsTotals {
    completionRate: number | null;
    completed: number;
    requiredCompleted: number;
    missed: number;
    skipped: number;
    extras: number;
    bestStreak: number;
    total: number;
    average: number | null;
    recordedDays: number;
}

export interface HabitStatisticsDay {
    date: string;
    state: 'completed' | 'missed' | 'skipped' | 'pending' | null;
    required: boolean;
    value: number | null;
    target: number | null;
}

export interface HabitStatisticsData {
    filter: 'season' | 'month' | 'year' | 'all';
    label: string;
    comparisonLabel: string | null;
    selector: { value: string | null; previousValue: string | null; nextValue: string | null };
    current: HabitStatisticsTotals;
    previous: HabitStatisticsTotals | null;
    currentStreak: number;
    today: string;
    startDate: string;
    endDate: string;
    days: HabitStatisticsDay[];
    trend: { unit: 'day' | 'month' | 'year'; buckets: { date: string; label: string; completed: number; total: number; average: number | null; target: number | null }[] };
}

export const statisticsNumber = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
export function formatStatistic(value: number | null): string {
    return value === null ? '—' : statisticsNumber.format(value);
}
