import type { LawViewData } from '../constitution/types';
import type { HabitViewData } from '../habits/types';
import type { MoneyAccountData, MoneyCategoryData } from '../money/types';
import type { SeasonViewData } from '../seasons/types';
import type { TaskViewData } from '../tasks/types';

export interface TodayProgressData {
    completed: number;
    total: number;
    percentage: number;
}

export interface TodayTaskData {
    today: TaskViewData[];
    overdue: TaskViewData[];
    overdueCount: number;
    upcoming: TaskViewData[];
    upcomingVisible: boolean;
}

export interface TodayDiaryData {
    state: 'pending' | 'completed' | 'missed';
    streak: number;
    earnedSp: number;
    href: string;
}

export interface TodaySettingsData {
    showFlexibleHabits: boolean;
    showUpcomingTasks: boolean;
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
    constitution: {
        laws: LawViewData[];
    };
    money: {
        accounts: MoneyAccountData[];
        categories: MoneyCategoryData[];
        totalsByCurrency: Record<string, number>;
        canTransfer: boolean;
    };
    settings: TodaySettingsData;
}
