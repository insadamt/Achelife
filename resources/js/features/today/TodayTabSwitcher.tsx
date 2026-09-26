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
            className="today-glass sticky top-[4.75rem] z-10 mx-auto mb-5 w-full max-w-xl md:top-4"
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
