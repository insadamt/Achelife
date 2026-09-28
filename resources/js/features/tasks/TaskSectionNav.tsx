import { CalendarDays, ChartColumn, ListTodo } from 'lucide-react';

import { ModuleNavigation } from '../../components/ui';

const sections = [
    { href: '/tasks', icon: ListTodo, label: 'Tasks', value: 'tasks' },
    { href: '/tasks/calendar', icon: CalendarDays, label: 'Calendar', value: 'calendar' },
    { href: '/tasks/statistics', icon: ChartColumn, label: 'Statistics', value: 'statistics' },
] as const;

export function TaskSectionNav({ active }: { active: 'tasks' | 'calendar' | 'statistics' }) {
    return <ModuleNavigation active={active} indicatorGroup="task-sections" items={sections.map(({ icon: Icon, ...section }) => ({ ...section, icon: <Icon aria-hidden="true" size={16} /> }))} label="Task sections" />;
}
