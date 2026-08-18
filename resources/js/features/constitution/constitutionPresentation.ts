import type { LawSeverity } from './types';

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
