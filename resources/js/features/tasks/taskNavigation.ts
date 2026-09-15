import type { TaskSearchFilters, TaskWorkspaceView } from './types';

export function taskNavigationHref(
    view: TaskWorkspaceView,
    filters: TaskSearchFilters,
    location: { folderId?: number | null; projectId?: number | null } = {},
): string {
    const parameters = new URLSearchParams({ view });
    if (location.folderId !== null && location.folderId !== undefined) parameters.set('folder', String(location.folderId));
    if (location.projectId !== null && location.projectId !== undefined) parameters.set('project', String(location.projectId));
    if (filters.search) parameters.set('search', filters.search);
    if (filters.status !== 'all') parameters.set('status', filters.status);
    if (filters.taskProject !== 'all') parameters.set('task_project', filters.taskProject);
    if (filters.important !== 'all') parameters.set('important', filters.important);
    return `/tasks?${parameters.toString()}`;
}
