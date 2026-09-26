import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { PageRail } from '../components/ui';
import { TodayHabitSection } from '../features/today/TodayHabitSection';
import { TodayHeader } from '../features/today/TodayHeader';
import { TodaySettingsDialog } from '../features/today/TodaySettingsDialog';
import { TodayTaskList } from '../features/today/TodayTaskList';
import type { TodayPageProps } from '../features/today/types';
import { MoneySubscriptionSummary } from '../features/money/MoneySubscriptionSummary';
import { TaskDetailsDrawer } from '../features/tasks/TaskDetailsDrawer';

const todayStyle = { '--module-accent': 'var(--accent)' } as CSSProperties;

export default function Home(props: TodayPageProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const selectedTask = [...props.tasks.today, ...props.tasks.overdue].find((task) => task.id === selectedTaskId) ?? null;

    return (
        <PageRail className="today-page" style={todayStyle}>
            <Head title="Today" />

            <TodayHeader onOpenSettings={() => setSettingsOpen(true)} />

            <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-6">
                <section aria-labelledby="today-task-list-title" className="today-glass min-w-0 rounded-[1.75rem] p-4 pb-8 sm:p-5 lg:p-6">
                    <TodayTaskList headingId="today-task-list-title" onOpen={setSelectedTaskId} overdue={props.tasks.overdue} overdueCount={props.tasks.overdueCount} tasks={props.tasks.today} />
                </section>
                <section aria-labelledby="today-habit-list-title" className="today-glass min-w-0 rounded-[1.75rem] p-4 pb-8 sm:p-5 lg:p-6">
                    <TodayHabitSection flexible={props.habits.flexible} headingId="today-habit-list-title" required={props.habits.required} />
                </section>
            </div>

            <MoneySubscriptionSummary due={props.manualSubscriptionPayments} surfaceClassName="today-glass" title="Manual payments due" />

            {settingsOpen && <TodaySettingsDialog onClose={() => setSettingsOpen(false)} settings={props.settings} />}
            {selectedTask && <TaskDetailsDrawer explorer={props.explorer} key={selectedTask.id} onClose={() => setSelectedTaskId(null)} task={selectedTask} today={props.today} />}
        </PageRail>
    );
}
