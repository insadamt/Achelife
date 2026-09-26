import { LocalViewTabs } from '../../components/ui';

export type TodayTab = 'tasks' | 'habits';

interface TodayTabSwitcherProps {
    activeTab: TodayTab;
    pendingTaskCount: number;
    unresolvedHabitCount: number;
    onChange: (tab: TodayTab) => void;
}

export function TodayTabSwitcher({ activeTab, pendingTaskCount, unresolvedHabitCount, onChange }: TodayTabSwitcherProps) {
    return (
        <LocalViewTabs
            active={activeTab}
            className="today-glass mx-auto mb-5 w-full max-w-xl"
            idPrefix="today"
            label="Today views"
            onChange={onChange}
            views={[
                { value: 'tasks', label: 'Tasks', count: pendingTaskCount },
                { value: 'habits', label: 'Habits', count: unresolvedHabitCount },
            ]}
        />
    );
}
