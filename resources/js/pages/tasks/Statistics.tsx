import { Head } from '@inertiajs/react';
import type { CSSProperties } from 'react';

import { TaskSectionNav } from '../../features/tasks/TaskSectionNav';
import { TaskStatisticsPanel } from '../../features/tasks/TaskStatisticsPanel';
import type { TaskStatisticsData } from '../../features/tasks/TaskStatisticsPanel';

export default function TaskStatisticsPage({ statistics }: { statistics: TaskStatisticsData }) {
    return (
        <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
            <Head title="Task statistics" />
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--module-accent)]">Tasks</p>
                        <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Task statistics</h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">See how often you finish, how reliably you meet your dates, and where your momentum changes.</p>
                    </div>
                    <TaskSectionNav active="statistics" />
                </div>
                <TaskStatisticsPanel statistics={statistics} />
            </div>
        </div>
    );
}
