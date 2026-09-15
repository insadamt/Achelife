import { FolderKanban, ListTodo } from 'lucide-react';

import { Surface } from '../../components/ui';
import { formatFocusDuration } from './taskStatisticsPresentation';
import type { TaskFocusStatisticsData } from './taskStatisticsTypes';

interface RankedItem {
    key: string;
    label: string;
    seconds: number;
}

function Ranking({ items, empty }: { items: RankedItem[]; empty: string }) {
    const maximum = Math.max(1, ...items.map((item) => item.seconds));

    if (items.length === 0) return <p className="mt-5 grid min-h-40 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/35 px-5 text-center text-sm text-muted">{empty}</p>;

    return <ol className="mt-5 space-y-3">{items.map((item, index) => <li className="relative overflow-hidden rounded-xl border border-border-subtle bg-app/45 p-3" key={item.key}>
        <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--module-accent)_12%,transparent)]" style={{ width: `${item.seconds / maximum * 100}%` }} />
        <div className="relative flex items-center justify-between gap-3"><span className="min-w-0 truncate text-sm font-semibold"><span className="mr-2 text-xs text-muted">{index + 1}</span>{item.label}</span><span className="shrink-0 text-xs font-bold tabular-nums">{formatFocusDuration(item.seconds)}</span></div>
    </li>)}</ol>;
}

export function TaskFocusRankings({ focus }: { focus: TaskFocusStatisticsData }) {
    const projects = focus.projects.map((project) => ({ key: project.id === null ? 'inbox' : String(project.id), label: project.name, seconds: project.seconds }));
    const tasks = focus.tasks.map((task) => ({ key: String(task.id), label: task.title, seconds: task.seconds }));

    return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Surface className="min-w-0 rounded-3xl p-4 sm:p-6"><h3 className="flex items-center gap-2 text-lg font-bold"><FolderKanban aria-hidden="true" className="text-accent-ink" size={18} />Focus by Project</h3><p className="mt-1 text-sm text-muted">Historical Focus follows each Task’s current location.</p><Ranking empty="No Project Focus in this period." items={projects} /></Surface>
        <Surface className="min-w-0 rounded-3xl p-4 sm:p-6"><h3 className="flex items-center gap-2 text-lg font-bold"><ListTodo aria-hidden="true" className="text-accent-ink" size={18} />Most-focused Tasks</h3><p className="mt-1 text-sm text-muted">Your top Tasks by completed Focus Time.</p><Ranking empty="No focused Tasks in this period." items={tasks} /></Surface>
    </div>;
}
