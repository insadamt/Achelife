import type { SeasonCloseoutData } from './closeoutTypes';

export interface SeasonTimelinePoint {
    day: number;
    date: string;
    label: string;
    dailySp: number;
    cumulativeSp: number;
}

export interface SeasonInsightsData {
    summary: SeasonCloseoutData;
    elapsedDays: number;
    averageSpPerDay: number;
    spToday: number;
    timeline: SeasonTimelinePoint[];
    previousTimeline: SeasonTimelinePoint[] | null;
}
