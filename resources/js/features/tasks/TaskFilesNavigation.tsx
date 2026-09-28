import { Link } from '@inertiajs/react';
import { useRef } from 'react';

import { SlidingNavigationIndicator } from '../../components/ui/SlidingNavigationIndicator';
import { classNames } from '../../components/ui/classNames';
import { taskNavigationHref } from './taskNavigation';
import type { TaskSearchFilters } from './types';

export function TaskFilesNavigation({ active, filters }: { active: 'files' | 'archived'; filters: TaskSearchFilters }) {
    const navigationRef = useRef<HTMLElement>(null);
    return (
        <nav aria-label="Task files views" className="relative mt-6 flex gap-1 rounded-2xl border border-border-subtle bg-surface p-1" data-horizontal-nav="task-files" ref={navigationRef}>
            <SlidingNavigationIndicator active={active} containerRef={navigationRef} group="task-files" />
            {(['files', 'archived'] as const).map((view) => (
                <Link
                    aria-current={active === view ? 'page' : undefined}
                    className={classNames(
                        'focus-ring relative z-10 flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors duration-200',
                        active === view
                            ? 'text-foreground'
                            : 'text-secondary hover:bg-surface-hover hover:text-foreground',
                    )}
                    data-nav-value={view}
                    href={taskNavigationHref(view, filters)}
                    key={view}
                >
                    {view === 'files' ? 'Files' : 'Archived'}
                </Link>
            ))}
        </nav>
    );
}
