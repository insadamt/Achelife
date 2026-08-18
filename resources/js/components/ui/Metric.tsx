interface MetricProps {
    label: string;
    value: string | number;
    suffix?: string;
    context?: string;
    className?: string;
}

export function Metric({ label, value, suffix, context, className }: MetricProps) {
    return (
        <div className={className}>
            <p className="text-muted text-[0.6875rem] font-bold tracking-[0.18em] uppercase">{label}</p>
            <p className="mt-2 text-4xl leading-none font-bold tracking-[-0.035em] text-foreground sm:text-5xl">
                {value}
                {suffix && <span className="ml-2 text-base tracking-normal text-secondary">{suffix}</span>}
            </p>
            {context && <p className="mt-2 text-sm font-medium text-secondary">{context}</p>}
        </div>
    );
}
