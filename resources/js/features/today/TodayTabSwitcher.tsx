import { classNames } from '../../components/ui/classNames';

export type TodayTab = 'tasks' | 'habits';

interface TodayTabSwitcherProps {
    activeTab: TodayTab;
    pendingTaskCount: number;
    unresolvedHabitCount: number;
    onChange: (tab: TodayTab) => void;
}

export function TodayTabSwitcher({ activeTab, pendingTaskCount, unresolvedHabitCount, onChange }: TodayTabSwitcherProps) {
    return (
        <div aria-label="Today views" className="today-glass sticky top-[4.75rem] z-10 mx-auto mb-5 grid w-full max-w-xl grid-cols-2 rounded-full p-1.5 md:top-4" role="tablist">
            {([
                { id: 'tasks', label: 'Tasks', count: pendingTaskCount },
                { id: 'habits', label: 'Habits', count: unresolvedHabitCount },
            ] as const).map((tab) => {
                const selected = activeTab === tab.id;

                return (
                    <button
                        aria-controls={`today-${tab.id}-panel`}
                        aria-label={`${tab.label}, ${tab.count} left`}
                        aria-selected={selected}
                        className={classNames(
                            'focus-ring flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-bold transition-[background-color,color,box-shadow] duration-200',
                            selected
                                ? 'today-glass-tab-active text-foreground'
                                : 'text-secondary hover:bg-surface-hover/40 hover:text-foreground',
                        )}
                        id={`today-${tab.id}-tab`}
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        role="tab"
                        type="button"
                    >
                        <span>{tab.label}</span>
                        <span className={classNames('rounded-full px-2 py-0.5 text-xs', selected ? 'bg-accent/15 text-foreground' : 'bg-app/30 text-muted')}>
                            {tab.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
