export type HabitType = 'boolean' | 'numeric';
export type HabitDifficulty = 'easy' | 'normal' | 'hard';
export type HabitScheduleType = 'every_day' | 'selected_weekdays';
export type HabitOccurrenceState = 'pending' | 'completed' | 'skipped' | 'missed' | null;
export type HabitCalendarLabels = 'calendar_dates' | 'season_days';

export interface HabitDefinitionData {
    difficulty: HabitDifficulty;
    baseReward: number;
    scheduleType: HabitScheduleType;
    weekdays: number[];
    flexible: boolean;
    numericTarget: string | null;
}

export interface HabitDayData {
    date: string;
    seasonDay: number;
    calendarDay: number;
    month: string;
    weekday: number;
    state: HabitOccurrenceState;
    kind: 'required' | 'flexible_extra' | null;
    numericValue: string | null;
    target: string | null;
    earnedSp: number;
    streakAfter: number | null;
    multiplier: string | null;
    available: boolean;
    clickable: boolean;
    required: boolean;
    flexibleExtra: boolean;
    past: boolean;
    today: boolean;
    future: boolean;
}

export interface HabitViewData extends HabitDefinitionData {
    id: number;
    name: string;
    type: HabitType;
    unit: string | null;
    startsOn: string;
    currentStreak: number;
    editDefinition: HabitDefinitionData;
    changesStartTomorrow: boolean;
    days: HabitDayData[];
}

export interface ArchivedHabitData extends HabitDefinitionData {
    id: number;
    name: string;
    type: HabitType;
    unit: string | null;
    startsOn: string;
    archivedAt: string;
    inactiveOn: string;
    currentStreak: number;
}

export interface CurrentSeasonData {
    id: number;
    number: number;
    startDate: string;
    endDate: string;
    seasonPoints: number;
}
