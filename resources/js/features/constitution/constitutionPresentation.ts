import type { LawSeverity, ViolationViewData } from './types';

export const severityLabels: Record<LawSeverity, string> = {
    minor: 'Minor',
    major: 'Major',
    critical: 'Critical',
};

export const severityPenalties: Record<LawSeverity, number> = {
    minor: -10,
    major: -50,
    critical: -100,
};

export const severityStyles: Record<LawSeverity, { text: string; border: string; background: string }> = {
    minor: {
        text: 'text-[#e7bd61]',
        border: 'border-[#9b7738]',
        background: 'bg-[#e7bd61]/8',
    },
    major: {
        text: 'text-[#ef914f]',
        border: 'border-[#a95d2d]',
        background: 'bg-[#ef914f]/8',
    },
    critical: {
        text: 'text-danger',
        border: 'border-danger/65',
        background: 'bg-danger/8',
    },
};

export function formatConstitutionDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(`${value}T12:00:00`),
    );
}

export function formatPenalty(value: number): string {
    return `${value.toLocaleString()} SP`;
}

export function formatSpDelta(value: number): string {
    const prefix = value > 0 ? '+' : '';

    return `${prefix}${value.toLocaleString()} SP`;
}

export function calculateLawSeasonPenalty(violations: ViolationViewData[]): number {
    return violations.reduce((total, violation) => total + violation.penalty, 0);
}

export function projectRecordedViolation(lawBasePenalty: number, date: string, violations: ViolationViewData[]) {
    const existingViolations = orderViolations(violations);
    const insertionIndex = existingViolations.findIndex((violation) => violation.date > date);
    const resolvedInsertionIndex = insertionIndex === -1 ? existingViolations.length : insertionIndex;
    const sequence = resolvedInsertionIndex + 1;
    const recordedViolation: ViolationViewData = {
        id: Number.MAX_SAFE_INTEGER,
        date,
        severity: 'minor',
        basePenalty: lawBasePenalty,
        multiplier: sequence,
        penalty: lawBasePenalty * sequence,
        recordedAt: '9999-12-31T23:59:59Z',
    };
    const projectedViolations = [
        ...existingViolations.slice(0, resolvedInsertionIndex),
        recordedViolation,
        ...existingViolations.slice(resolvedInsertionIndex),
    ];

    return {
        sequence,
        recordPenalty: lawBasePenalty * sequence,
        seasonAdjustment: calculateProjectedAdjustment(existingViolations, projectedViolations),
    };
}

export function projectCorrectedViolation(date: string, violationId: number, violations: ViolationViewData[]): number {
    const projectedViolations = violations.map((violation) => violation.id === violationId ? { ...violation, date } : violation);

    return calculateProjectedAdjustment(violations, projectedViolations);
}

export function projectDeletedViolation(violationId: number, violations: ViolationViewData[]): number {
    return calculateProjectedAdjustment(
        violations,
        violations.filter((violation) => violation.id !== violationId),
    );
}

function calculateProjectedAdjustment(currentViolations: ViolationViewData[], projectedViolations: ViolationViewData[]): number {
    const currentTotal = calculateLawSeasonPenalty(currentViolations);
    const projectedTotal = orderViolations(projectedViolations).reduce(
        (total, violation, index) => total + violation.basePenalty * (index + 1),
        0,
    );

    return projectedTotal - currentTotal;
}

function orderViolations(violations: ViolationViewData[]): ViolationViewData[] {
    return [...violations].sort((left, right) => {
        const dateOrder = left.date.localeCompare(right.date);
        if (dateOrder !== 0) return dateOrder;

        const recordedOrder = left.recordedAt.localeCompare(right.recordedAt);
        if (recordedOrder !== 0) return recordedOrder;

        return left.id - right.id;
    });
}
