import type { RankViewData } from './types';

export interface SeasonCloseoutSummary {
    seasonId: number;
    seasonNumber: number;
    startDate: string;
    endDate: string;
    seasonPoints: number;
    rank: RankViewData;
    breakdown: Record<'tasks' | 'habits' | 'diary' | 'objectives' | 'constitution', number>;
    metrics: {
        objectivesCompleted: number;
        objectivesTotal: number;
        tasksResolved: number;
        tasksTotal: number;
        habitsCompleted: number;
        habitsSkipped: number;
        habitsRequired: number;
        habitAdherencePercent: number;
        diaryDays: number;
        constitutionViolations: number;
        constitutionSp: number;
    };
}

export interface SeasonCloseoutData extends SeasonCloseoutSummary {
    reflection: string;
    recapSeenAt: string | null;
    previous: SeasonCloseoutSummary | null;
}
