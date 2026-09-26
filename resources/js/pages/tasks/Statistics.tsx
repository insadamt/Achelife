import { Head } from '@inertiajs/react';
import type { CSSProperties } from 'react';

import { PageChrome, PageHeader, PageRail } from '../../components/ui';
import { TaskSectionNav } from '../../features/tasks/TaskSectionNav';
import { TaskStatisticsPanel } from '../../features/tasks/TaskStatisticsPanel';
import type { TaskStatisticsData } from '../../features/tasks/taskStatisticsTypes';

export default function TaskStatisticsPage({ statistics }: { statistics: TaskStatisticsData }) {
    return (
        <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
            <Head title="Task statistics" />
            <PageRail>
                <PageChrome>
                    <PageHeader title="Statistics" />
                    <TaskSectionNav active="statistics" />
                </PageChrome>
                <TaskStatisticsPanel statistics={statistics} />
            </PageRail>
        </div>
    );
}
