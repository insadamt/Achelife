import { classNames } from '../../components/ui/classNames';

export type TodayTab = 'tasks' | 'habits';

interface TodayTabSwitcherProps {
    activeTab: TodayTab;
    taskCount: number;
    habitCount: number;
    onChange: (tab: TodayTab) => void;
}

export function TodayTabSwitcher({ activeTab, taskCount, habitCount, onChange }: TodayTabSwitcherProps) {
    return (
        <div aria-label="Today views" className="sticky top-[4.75rem] z-10 mx-auto mb-7 grid w-full max-w-xl grid-cols-2 rounded-full border border-border-strong bg-elevated/95 p-1.5 shadow-[0_16px_38px_rgba(0,0,0,0.28)] backdrop-blur-md md:top-4" role="tablist">
            {([
                { id: 'tasks', label: 'Tasks', count: taskCount },
                { id: 'habits', label: 'Habits', count: habitCount },
            ] as const).map((tab) => {
                const selected = activeTab === tab.id;

                return (
                    <button
                        aria-controls={`today-${tab.id}-panel`}
                        aria-selected={selected}
                        className={classNames(
                            'focus-ring flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-bold transition-[background-color,color,box-shadow] duration-200',
                            selected
                                ? 'bg-foreground text-app shadow-[0_8px_22px_rgba(0,0,0,0.26)]'
                                : 'text-secondary hover:bg-surface-hover hover:text-foreground',
                        )}
                        id={`today-${tab.id}-tab`}
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        role="tab"
                        type="button"
                    >
                        <span>{tab.label}</span>
                        <span className={classNames('rounded-full px-2 py-0.5 text-xs', selected ? 'bg-app/10' : 'bg-app text-muted')}>
                            {tab.count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
