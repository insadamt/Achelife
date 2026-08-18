import type { HabitViewData } from '../habits/types';
import type { SeasonViewData } from '../seasons/types';
import type { TaskViewData } from '../tasks/types';

export interface TodayProgressData {
    completed: number;
    total: number;
    percentage: number;
    todaySp: number;
    breakdown: {
        tasks: TodayProgressBreakdown;
        habits: TodayProgressBreakdown;
        diary: TodayProgressBreakdown;
    };
}

export interface TodayProgressBreakdown {
    completed: number;
    total: number;
}

export interface TodayTaskData {
    today: TaskViewData[];
    overdue: TaskViewData[];
    overdueCount: number;
}

export interface TodayDiaryData {
    state: 'pending' | 'completed' | 'missed';
    streak: number;
    earnedSp: number;
    href: string;
}

export interface TodaySettingsData {
    showFlexibleHabits: boolean;
}

export interface TodayPageProps {
    today: string;
    currentSeason: SeasonViewData & { id: number; day: number; state: 'current' };
    dailyProgress: TodayProgressData;
    tasks: TodayTaskData;
    habits: {
        required: HabitViewData[];
        flexible: HabitViewData[];
    };
    diary: TodayDiaryData;
    settings: TodaySettingsData;
}
