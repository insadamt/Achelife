import type { CSSProperties, ReactNode } from 'react';

interface CircularProgressProps {
    value: number;
    maximum?: number;
    accent?: string;
    label?: string;
    size?: number;
    centerContent?: ReactNode;
}

type ProgressStyle = CSSProperties & { '--module-accent'?: string };

export function CircularProgress({
    value,
    maximum = 100,
    accent,
    label = 'Progress',
    size = 128,
    centerContent,
}: CircularProgressProps) {
    const safeMaximum = maximum > 0 ? maximum : 100;
    const percentage = Math.min(100, Math.max(0, (value / safeMaximum) * 100));
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const style: ProgressStyle = accent ? { '--module-accent': accent } : {};

    return (
        <div
            aria-label={`${label}: ${Math.round(percentage)}%`}
            className="relative inline-grid shrink-0 place-items-center"
            role="img"
            style={{ ...style, width: size, height: size }}
        >
            <svg aria-hidden="true" className="-rotate-90" height="100%" viewBox="0 0 100 100" width="100%">
                <circle cx="50" cy="50" fill="none" r={radius} stroke="var(--border-subtle)" strokeWidth="7" />
                <circle
                    className="transition-[stroke-dashoffset] duration-200 ease-out"
                    cx="50"
                    cy="50"
                    fill="none"
                    r={radius}
                    stroke="var(--module-accent)"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    strokeWidth="7"
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
                {centerContent ?? (
                    <span className="text-2xl font-bold tracking-[-0.03em] text-foreground">{Math.round(percentage)}%</span>
                )}
            </div>
        </div>
    );
}
