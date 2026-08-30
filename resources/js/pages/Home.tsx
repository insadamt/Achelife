import { Head } from '@inertiajs/react';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { TodayHabitSection } from '../features/today/TodayHabitSection';
import { TodaySettingsDialog } from '../features/today/TodaySettingsDialog';
import { TodayTabSwitcher } from '../features/today/TodayTabSwitcher';
import type { TodayTab } from '../features/today/TodayTabSwitcher';
import { TodayTaskList } from '../features/today/TodayTaskList';
import type { TodayPageProps } from '../features/today/types';
import { MoneySubscriptionSummary } from '../features/money/MoneySubscriptionSummary';

const todayStyle = { '--module-accent': 'var(--accent)' } as CSSProperties;
const activeTabStorageKey = 'achelife.today.active-tab';

function calendarDateLabel(date: string) {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));
}

function initialTab(): TodayTab {
    if (typeof window === 'undefined') {
        return 'tasks';
    }

    return window.sessionStorage.getItem(activeTabStorageKey) === 'habits' ? 'habits' : 'tasks';
}

export default function Home(props: TodayPageProps) {
    const [activeTab, setActiveTab] = useState<TodayTab>(initialTab);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const habitCount = props.habits.required.length + props.habits.flexible.length;

    function selectTab(tab: TodayTab) {
        setActiveTab(tab);
        window.sessionStorage.setItem(activeTabStorageKey, tab);
    }

    return (
        <div className="min-h-[calc(100vh-5rem)]" style={todayStyle}>
            <Head title="Today" />

            <header className="mb-8 flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-[clamp(2rem,5vw,3.75rem)] leading-none font-bold tracking-[-0.05em]">{calendarDateLabel(props.today)}</h1>
                </div>
                <button
                    aria-label="Open Today settings"
                    className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-border-strong bg-elevated text-secondary hover:bg-surface-hover hover:text-foreground"
                    onClick={() => setSettingsOpen(true)}
                    type="button"
                >
                    <Settings aria-hidden="true" size={19} />
                </button>
            </header>

            <MoneySubscriptionSummary due={props.manualSubscriptionPayments} title="Manual payments due" />

            <div className="md:hidden">
                <TodayTabSwitcher
                    activeTab={activeTab}
                    habitCount={habitCount}
                    onChange={selectTab}
                    taskCount={props.tasks.today.length + props.tasks.overdueCount}
                />
            </div>

            <main
                aria-labelledby={`today-${activeTab}-tab`}
                className="pb-8 md:hidden"
                id={`today-${activeTab}-panel`}
                role="tabpanel"
                tabIndex={0}
            >
                {activeTab === 'tasks'
                    ? <TodayTaskList headingId="today-mobile-task-list-title" overdue={props.tasks.overdue} overdueCount={props.tasks.overdueCount} tasks={props.tasks.today} />
                    : <TodayHabitSection flexible={props.habits.flexible} headingId="today-mobile-habit-list-title" required={props.habits.required} />}
            </main>

            <main className="hidden items-start gap-6 pb-8 md:grid md:grid-cols-2">
                <div className="min-h-[18rem] rounded-[2rem] border border-border-subtle bg-surface/45 p-5 shadow-[0_18px_46px_rgba(0,0,0,0.16)] lg:p-6">
                    <TodayTaskList headingId="today-desktop-task-list-title" overdue={props.tasks.overdue} overdueCount={props.tasks.overdueCount} tasks={props.tasks.today} />
                </div>
                <div className="min-h-[18rem] rounded-[2rem] border border-border-subtle bg-surface/45 p-5 shadow-[0_18px_46px_rgba(0,0,0,0.16)] lg:p-6">
                    <TodayHabitSection flexible={props.habits.flexible} headingId="today-desktop-habit-list-title" required={props.habits.required} />
                </div>
            </main>

            {settingsOpen && <TodaySettingsDialog onClose={() => setSettingsOpen(false)} settings={props.settings} />}
        </div>
    );
}
