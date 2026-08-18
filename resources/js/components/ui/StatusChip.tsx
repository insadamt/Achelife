import type { PropsWithChildren } from 'react';

import { classNames } from './classNames';

type Status = 'active' | 'completed' | 'locked' | 'warning' | 'danger' | 'neutral';

interface StatusChipProps {
    status?: Status;
}

const statusClasses: Record<Status, string> = {
    active: 'border-[color-mix(in_srgb,var(--module-accent)_42%,transparent)] bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-[var(--module-accent)]',
    completed: 'border-success/35 bg-success/10 text-success',
    locked: 'border-border-subtle bg-app text-muted',
    warning: 'border-warning/35 bg-warning/10 text-warning',
    danger: 'border-danger/35 bg-danger/10 text-danger',
    neutral: 'border-border-subtle bg-elevated text-secondary',
};

const statusSymbols: Record<Status, string> = {
    active: '●',
    completed: '✓',
    locked: '—',
    warning: '!',
    danger: '×',
    neutral: '○',
};

export function StatusChip({ children, status = 'neutral' }: PropsWithChildren<StatusChipProps>) {
    return (
        <span
            className={classNames(
                'inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] leading-none font-bold tracking-[0.12em] uppercase',
                statusClasses[status],
            )}
        >
            <span aria-hidden="true">{statusSymbols[status]}</span>
            {children}
        </span>
    );
}
