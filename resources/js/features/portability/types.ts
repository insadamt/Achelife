export interface RestorePreview {
    createdAt: string;
    ageSeconds: number;
    sourceApplication: string;
    sourceApplicationVersion: string;
    archiveFormatVersion: number;
    timezone: string;
    calendarStartedOn: string;
    seasonRolloverPreference: 'automatic' | 'manual';
    latestSeason: null | {
        number: number;
        startDate: string;
        endDate: string;
        rank: string;
        seasonPoints: number;
        finalized: boolean;
    };
    countsByModule: Record<string, number>;
    catchUp: null | {
        fromDate: string;
        throughDate: string | null;
        originalDay30: string;
        seasonHasEnded: boolean;
        habitMisses: number;
        diary: { missedDays: number; resultingStreak: number };
        recurringTaskOccurrences: number;
        subscriptions: { automaticCount: number; automaticValueMinor: number; automaticValueMinorByCurrency: Record<string, number> };
        heldSeasonNumber: number;
    };
    warnings: string[];
}
