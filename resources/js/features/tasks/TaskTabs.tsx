import { classNames } from '../../components/ui/classNames';

export type TaskTab = 'today' | 'overdue' | 'upcoming' | 'completed';

interface TaskTabOption {
    value: TaskTab;
    label: string;
    count: number;
}

export function TaskTabs({ activeTab, counts, onChange }: {
    activeTab: TaskTab;
    counts: Record<TaskTab, number>;
    onChange: (tab: TaskTab) => void;
}) {
    const options: TaskTabOption[] = [
        { value: 'today', label: 'Today', count: counts.today },
        { value: 'overdue', label: 'Overdue', count: counts.overdue },
        { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
        { value: 'completed', label: 'Completed', count: counts.completed },
    ];

    return (
        <div aria-label="Task views" className="grid grid-cols-2 gap-1 rounded-2xl border border-border-subtle bg-surface p-1 sm:grid-cols-4" role="tablist">
            {options.map((option) => (
                <button
                    aria-controls={`task-panel-${option.value}`}
                    aria-selected={activeTab === option.value}
                    className={classNames(
                        'focus-ring flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors',
                        activeTab === option.value
                            ? 'bg-elevated text-foreground shadow-sm'
                            : 'text-muted hover:bg-surface-hover hover:text-foreground',
                        option.value === 'overdue' && option.count > 0 && activeTab !== option.value && 'text-warning',
                    )}
                    key={option.value}
                    id={`task-tab-${option.value}`}
                    onClick={() => onChange(option.value)}
                    role="tab"
                    type="button"
                >
                    {option.label}
                    <span className={classNames(
                        'rounded-full px-1.5 py-0.5 text-[0.6875rem]',
                        activeTab === option.value ? 'bg-app text-secondary' : 'bg-elevated text-muted',
                    )}>
                        {option.count}
                    </span>
                </button>
            ))}
        </div>
    );
}
