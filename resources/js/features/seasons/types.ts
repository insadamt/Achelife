export type SeasonState = 'completed' | 'current' | 'locked';

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
}
