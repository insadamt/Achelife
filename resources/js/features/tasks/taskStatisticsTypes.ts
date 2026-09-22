export interface TaskCompletionStatisticsTotals {
    completed: number;
    sp: number;
    important: number;
    onTime: number | null;
}

export interface TaskFocusStatisticsTotals {
    totalSeconds: number;
    sessionCount: number;
    averageSessionSeconds: number;
    averageActiveDaySeconds: number;
    longestSessionSeconds: number;
}

export interface TaskFocusStatisticsData {
    current: TaskFocusStatisticsTotals;
    previous: TaskFocusStatisticsTotals | null;
    trend: {
        unit: 'day' | 'month' | 'year';
        buckets: { date: string; label: string; seconds: number }[];
    };
    heatmap: {
        startDate: string;
        endDate: string;
        days: { date: string; seconds: number }[];
    };
    projects: { id: number | null; name: string; color: string | null; seconds: number }[];
    tasks: { id: number; title: string; seconds: number }[];
}

export interface TaskStatisticsData {
    filter: 'season' | 'month' | 'year' | 'all';
    label: string;
    comparisonLabel: string | null;
    selector: {
        value: string | null;
        previousValue: string | null;
        nextValue: string | null;
    };
    current: TaskCompletionStatisticsTotals;
    previous: TaskCompletionStatisticsTotals | null;
    trend: {
        unit: 'day' | 'month' | 'year';
        buckets: { date: string; label: string; count: number; sp: number }[];
    };
    focus: TaskFocusStatisticsData;
}
