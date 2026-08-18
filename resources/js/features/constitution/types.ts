export type LawSeverity = 'minor' | 'major' | 'critical';

export interface ConstitutionSeasonData {
    id: number;
    number: number;
    startDate: string;
    endDate: string;
    seasonPoints: number;
}

export interface ViolationViewData {
    id: number;
    date: string;
    severity: LawSeverity;
    basePenalty: number;
    multiplier: number;
    penalty: number;
    recordedAt: string;
}

export interface LawViewData {
    id: number;
    name: string;
    severity: LawSeverity;
    basePenalty: number;
    createdOn: string;
    violationCount: number;
    currentSeasonViolationCount: number;
    nextMultiplier: number;
    nextPenalty: number;
    canDelete: boolean;
    violations: ViolationViewData[];
}

export interface ArchivedLawViewData {
    id: number;
    name: string;
    severity: LawSeverity;
    basePenalty: number;
    archivedAt: string;
    violationCount: number;
}
