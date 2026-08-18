export type SeasonState = 'completed' | 'current' | 'locked';

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
    rank: string | null;
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
