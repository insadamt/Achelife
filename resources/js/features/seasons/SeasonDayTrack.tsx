import { classNames } from '../../components/ui/classNames';

interface SeasonDayTrackProps {
    daysReached: number;
    currentDay?: number | null;
    label: string;
}

const milestones = [1, 7, 14, 21, 30];

export function SeasonDayTrack({ daysReached, currentDay = null, label }: SeasonDayTrackProps) {
    const safeDaysReached = Math.min(30, Math.max(0, daysReached));

    return (
        <div aria-label={label} aria-valuemax={30} aria-valuemin={0} aria-valuenow={safeDaysReached} role="progressbar">
            <div className="grid h-8 grid-cols-[repeat(30,minmax(0,1fr))] items-end gap-1" aria-hidden="true">
                {Array.from({ length: 30 }, (_, index) => {
                    const day = index + 1;
                    const reached = day <= safeDaysReached;
                    const today = day === currentDay;
                    const milestone = milestones.includes(day);

                    return (
                        <span
                            className={classNames(
                                'min-w-0 rounded-full border transition-[height,background-color,border-color,box-shadow] duration-200',
                                milestone ? 'h-5' : 'h-3',
                                reached && 'border-[var(--module-accent)] bg-[var(--module-accent)]',
                                !reached && 'border-border-strong bg-app',
                                today && 'h-7 shadow-[0_0_14px_color-mix(in_srgb,var(--module-accent)_38%,transparent)]',
                            )}
                            key={day}
                        />
                    );
                })}
            </div>
            <div className="mt-2 flex justify-between text-[0.5625rem] font-bold tracking-[0.12em] text-muted" aria-hidden="true">
                {milestones.map((milestone) => <span key={milestone}>{String(milestone).padStart(2, '0')}</span>)}
            </div>
        </div>
    );
}
