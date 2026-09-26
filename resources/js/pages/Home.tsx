import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { TodayHabitSection } from '../features/today/TodayHabitSection';
import { TodayOverview } from '../features/today/TodayOverview';
import { TodaySettingsDialog } from '../features/today/TodaySettingsDialog';
import { TodayTabSwitcher } from '../features/today/TodayTabSwitcher';
import type { TodayTab } from '../features/today/TodayTabSwitcher';
import { TodayTaskList } from '../features/today/TodayTaskList';
import type { TodayPageProps } from '../features/today/types';
import { MoneySubscriptionSummary } from '../features/money/MoneySubscriptionSummary';
import { TaskDetailsDrawer } from '../features/tasks/TaskDetailsDrawer';

const todayStyle = { '--module-accent': 'var(--accent)' } as CSSProperties;
const activeTabStorageKey = 'achelife.today.active-tab';

function initialTab(): TodayTab {
    if (typeof window === 'undefined') {
        return 'tasks';
    }

    return window.sessionStorage.getItem(activeTabStorageKey) === 'habits' ? 'habits' : 'tasks';
}

export default function Home(props: TodayPageProps) {
    const [activeTab, setActiveTab] = useState<TodayTab>(initialTab);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const pendingTaskCount = props.tasks.today.filter((task) => task.state !== 'completed').length + props.tasks.overdueCount;
    const unresolvedHabitCount = props.habits.required.filter((habit) => !['completed', 'skipped'].includes(habit.days[0]?.state ?? '')).length;
    const selectedTask = [...props.tasks.today, ...props.tasks.overdue].find((task) => task.id === selectedTaskId) ?? null;

    function selectTab(tab: TodayTab) {
        setActiveTab(tab);
        window.sessionStorage.setItem(activeTabStorageKey, tab);
    }

    return (
        <div className="today-page min-h-[calc(100vh-5rem)]" style={todayStyle}>
            <Head title="Today" />

            <TodayOverview
                date={props.today}
                onOpenSettings={() => setSettingsOpen(true)}
                progress={props.dailyProgress}
                seasonDay={props.currentSeason.day}
                seasonNumber={props.currentSeason.number}
            />

            <MoneySubscriptionSummary due={props.manualSubscriptionPayments} surfaceClassName="today-glass" title="Manual payments due" />

            <div className="md:hidden">
                <TodayTabSwitcher
                    activeTab={activeTab}
                    unresolvedHabitCount={unresolvedHabitCount}
                    onChange={selectTab}
                    pendingTaskCount={pendingTaskCount}
                />
            </div>

            <main aria-labelledby="today-tasks-tab" className="today-glass rounded-[1.75rem] p-4 pb-8 sm:p-5 md:hidden" hidden={activeTab !== 'tasks'} id="today-tasks-panel" role="tabpanel" tabIndex={0}>
                <TodayTaskList headingId="today-mobile-task-list-title" onOpen={setSelectedTaskId} overdue={props.tasks.overdue} overdueCount={props.tasks.overdueCount} tasks={props.tasks.today} />
            </main>
            <main aria-labelledby="today-habits-tab" className="today-glass rounded-[1.75rem] p-4 pb-8 sm:p-5 md:hidden" hidden={activeTab !== 'habits'} id="today-habits-panel" role="tabpanel" tabIndex={0}>
                <TodayHabitSection flexible={props.habits.flexible} headingId="today-mobile-habit-list-title" required={props.habits.required} />
            </main>

            <main className="today-glass hidden min-h-[18rem] items-start gap-6 rounded-[2rem] p-5 pb-8 md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:p-6">
                <div className="min-w-0 md:border-r md:border-white/20 md:pr-6">
                    <TodayTaskList headingId="today-desktop-task-list-title" onOpen={setSelectedTaskId} overdue={props.tasks.overdue} overdueCount={props.tasks.overdueCount} tasks={props.tasks.today} />
                </div>
                <div className="min-w-0">
                    <TodayHabitSection flexible={props.habits.flexible} headingId="today-desktop-habit-list-title" required={props.habits.required} />
                </div>
            </main>

            {settingsOpen && <TodaySettingsDialog onClose={() => setSettingsOpen(false)} settings={props.settings} />}
            {selectedTask && <TaskDetailsDrawer explorer={props.explorer} key={selectedTask.id} onClose={() => setSelectedTaskId(null)} task={selectedTask} today={props.today} />}
        </div>
    );
}
