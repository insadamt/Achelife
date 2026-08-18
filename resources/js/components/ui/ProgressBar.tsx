import type { CSSProperties } from 'react';

import { classNames } from './classNames';

interface ProgressBarProps {
    value: number;
    maximum?: number;
    label?: string;
    ariaLabel?: string;
    showValue?: boolean;
    accent?: string;
    activeGlow?: boolean;
    className?: string;
}

type ProgressStyle = CSSProperties & { '--module-accent'?: string };

export function ProgressBar({
    value,
    maximum = 100,
    label,
    ariaLabel,
    showValue = true,
    accent,
    activeGlow = false,
    className,
}: ProgressBarProps) {
    const safeMaximum = maximum > 0 ? maximum : 100;
    const percentage = Math.min(100, Math.max(0, (value / safeMaximum) * 100));
    const style: ProgressStyle = accent ? { '--module-accent': accent } : {};

    return (
        <div className={className} style={style}>
            {(label || showValue) && (
                <div className="mb-2 flex items-end justify-between gap-4 text-xs font-bold tracking-[0.12em] uppercase">
                    <span className="text-secondary">{label}</span>
                    {showValue && <span className="text-foreground">{Math.round(percentage)}%</span>}
                </div>
            )}
            <div
                aria-label={ariaLabel ?? label}
                aria-valuemax={safeMaximum}
                aria-valuemin={0}
                aria-valuenow={Math.min(safeMaximum, Math.max(0, value))}
                className="h-2.5 overflow-hidden rounded-full border border-border-subtle bg-app"
                role="progressbar"
            >
                <div
                    className={classNames(
                        'h-full rounded-full bg-[var(--module-accent)] transition-[width] duration-200 ease-out',
                        activeGlow && 'shadow-[0_0_14px_var(--module-accent)]',
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
