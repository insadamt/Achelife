export type SeasonState = 'completed' | 'current' | 'locked';

export type RankTier = 'unranked' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' | 'legend';

export interface RankViewData {
    key: string;
    name: string;
    tier: RankTier;
    division: string | null;
    displayName: string;
    minimumSp: number | null;
    nextThreshold: number | null;
    nextRank: string | null;
    progressCurrent: number | null;
    progressRequired: number | null;
    progressPercent: number | null;
    spToNext: number | null;
    topRank: boolean;
}

export interface ObjectiveViewData {
    id: number;
    title: string;
    order: number;
    creationOrder: number;
    completed: boolean;
    completedAt: string | null;
    earnedSp: number | null;
    rewardSp: number;
}

export interface SeasonViewData {
    id: number | null;
    number: number;
    state: SeasonState;
    startDate: string;
    endDate: string;
    day: number | null;
    progressPercentage: number;
    seasonPoints: number;
    rank: RankViewData | null;
    objectives: ObjectiveViewData[];
    objectiveCount: number;
    objectiveCompletedCount: number;
    objectiveEarnedSp: number;
    objectiveRewardPerObjective: number;
    objectiveRewardMaximum: number;
    objectiveSetupOpen: boolean;
    objectiveSetupDaysRemaining: number;
    objectiveCompletionMutable: boolean;
}
