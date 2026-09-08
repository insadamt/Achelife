import { Link } from '@inertiajs/react';
import { ChartColumn, ListTodo } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';

const sections = [
    { href: '/tasks', icon: ListTodo, label: 'Tasks', value: 'tasks' },
    { href: '/tasks/statistics', icon: ChartColumn, label: 'Statistics', value: 'statistics' },
] as const;

export function TaskSectionNav({ active }: { active: 'tasks' | 'statistics' }) {
    return (
        <nav aria-label="Task sections" className="flex max-w-full gap-1 rounded-full border border-border-subtle bg-surface p-1">
            {sections.map(({ href, icon: Icon, label, value }) => (
                <Link
                    aria-current={active === value ? 'page' : undefined}
                    className={classNames(
                        'focus-ring icon-text flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                        active === value ? 'bg-elevated text-foreground shadow-sm' : 'text-muted hover:text-foreground',
                    )}
                    href={href}
                    key={value}
                >
                    <Icon aria-hidden="true" size={15} />
                    {label}
                </Link>
            ))}
        </nav>
    );
}
