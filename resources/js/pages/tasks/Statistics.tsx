import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { CSSProperties } from 'react';

import { TaskStatisticsPanel } from '../../features/tasks/TaskStatisticsPanel';
import type { TaskStatisticsData } from '../../features/tasks/TaskStatisticsPanel';

export default function TaskStatisticsPage({ statistics }: { statistics: TaskStatisticsData }) {
    return (
        <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
            <Head title="Task statistics" />
            <div className="mx-auto max-w-6xl">
                <Link className="focus-ring mb-6 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border-subtle px-3 text-xs font-semibold text-secondary hover:bg-surface-hover hover:text-foreground" href="/tasks">
                    <ArrowLeft aria-hidden="true" size={15} />Back to tasks
                </Link>
                <header className="mb-7">
                    <div className="min-w-0">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Task statistics</p>
                        <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Task statistics</h1>
                        <p className="mt-3 text-sm text-muted">See your follow-through take shape.</p>
                    </div>
                </header>
                <TaskStatisticsPanel statistics={statistics} />
            </div>
        </div>
    );
}
