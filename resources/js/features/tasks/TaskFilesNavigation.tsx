import { Link } from '@inertiajs/react';

import { classNames } from '../../components/ui/classNames';
import { taskNavigationHref } from './taskNavigation';
import type { TaskSearchFilters } from './types';

export function TaskFilesNavigation({ active, filters }: { active: 'files' | 'archived'; filters: TaskSearchFilters }) {
    return (
        <nav aria-label="Task files views" className="mt-6 flex gap-1 rounded-2xl border border-border-subtle bg-surface p-1" data-horizontal-nav="task-files">
            {(['files', 'archived'] as const).map((view) => (
                <Link
                    aria-current={active === view ? 'page' : undefined}
                    className={classNames(
                        'focus-ring flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-bold transition-[background-color,color,box-shadow] duration-200',
                        active === view
                            ? 'bg-elevated text-foreground shadow-sm'
                            : 'text-secondary hover:bg-surface-hover hover:text-foreground',
                    )}
                    href={taskNavigationHref(view, filters)}
                    key={view}
                >
                    {view === 'files' ? 'Files' : 'Archived'}
                </Link>
            ))}
        </nav>
    );
}
