import { classNames } from '../../components/ui/classNames';

interface SegmentedSeasonProgressProps {
    completedDays: number;
    label: string;
}

export function SegmentedSeasonProgress({ completedDays, label }: SegmentedSeasonProgressProps) {
    const safeCompletedDays = Math.min(30, Math.max(0, completedDays));

    return (
        <div aria-label={label} aria-valuemax={30} aria-valuemin={0} aria-valuenow={safeCompletedDays} role="progressbar">
            <div className="grid grid-cols-10 gap-1.5 sm:[grid-template-columns:repeat(15,minmax(0,1fr))]" aria-hidden="true">
                {Array.from({ length: 30 }, (_, dayIndex) => (
                    <span
                        className={classNames(
                            'h-2.5 rounded-full border transition-[background-color,border-color,box-shadow] duration-200',
                            dayIndex < safeCompletedDays
                                ? 'border-[var(--module-accent)] bg-[var(--module-accent)] shadow-[0_0_10px_color-mix(in_srgb,var(--module-accent)_20%,transparent)]'
                                : 'border-border-strong bg-app',
                        )}
                        key={dayIndex}
                    />
                ))}
            </div>
        </div>
    );
}
