export type TaskState = 'incomplete' | 'overdue' | 'completed';
export type RecurrenceType = 'daily' | 'weekdays';

export interface TaskSubtask {
    id: number;
    title: string;
    completed: boolean;
}

export interface TaskRecurrence {
    type: RecurrenceType;
    weekdays: number[];
    label: string;
}

export interface TaskReschedule {
    fromDate: string;
    toDate: string;
    rescheduledAt: string;
}

export interface TaskFocusHistorySession {
    id: number;
    source: 'timer' | 'manual';
    startedAt: string;
    endedAt: string;
    localStartedAt: string;
    localEndedAt: string;
    durationSeconds: number;
    intervalCount: number;
}

export interface TaskFocusHistory {
    timezone: string;
    totalSeconds: number;
    sessions: TaskFocusHistorySession[];
}

export interface TaskViewData {
    id: number;
    title: string;
    notes: string | null;
    taskProjectId: number | null;
    projectName: string | null;
    projectColor: string | null;
    position: number;
    scheduledDate: string;
    originalScheduledDate: string | null;
    important: boolean;
    state: TaskState;
    completedAt: string | null;
    completionTiming: 'early' | 'on_time' | 'late' | null;
    earnedSp: number | null;
    projectedSp: number | null;
    rewardContext: string;
    lateRewardReduced: boolean;
    rewardSeasonNumber: number | null;
    completionLocked: boolean;
    canUncomplete: boolean;
    canEdit: boolean;
    canDelete: boolean;
    recurrence: TaskRecurrence | null;
    subtasks: TaskSubtask[];
    completedSubtasks: number;
    totalSubtasks: number;
    canComplete: boolean;
    rescheduleHistory: TaskReschedule[];
    focus: TaskFocusHistory;
}

export interface EditableSubtask {
    id?: number;
    title: string;
    completed?: boolean;
}

export interface TaskFormData {
    title: string;
    task_project_id?: number | null;
    notes: string;
    scheduled_date: string;
    important: boolean;
    recurrence_type: RecurrenceType | null;
    weekdays: number[];
    subtasks: EditableSubtask[];
}

export interface TaskSearchFilters {
    search: string;
    status: 'all' | 'incomplete' | 'completed';
    taskProject: string;
    important: 'all' | 'yes' | 'no';
}

export interface TaskProjectViewData {
    id: number;
    name: string;
    color: string | null;
    position: number;
    openTaskCount: number;
}

export interface TaskFolderViewData {
    id: number;
    name: string;
    color: string | null;
    position: number;
    projectCount: number;
    openTaskCount: number;
    projects: TaskProjectViewData[];
}

export interface TaskExplorerViewData {
    folders: TaskFolderViewData[];
    rootProjects: TaskProjectViewData[];
    inboxCount: number;
    archivedFolders: TaskFolderViewData[];
    archivedProjects: TaskProjectViewData[];
}

export type TaskWorkspaceView = 'files' | 'folder' | 'today' | 'inbox' | 'upcoming' | 'overdue' | 'completed' | 'project';
export type ProjectTaskView = 'today' | 'overdue' | 'upcoming' | 'completed';

export interface TaskWorkspaceViewData {
    view: TaskWorkspaceView;
    taskView: ProjectTaskView;
    projectId: number | null;
    folderId: number | null;
    label: string;
    manualTasks: TaskViewData[] | null;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedTasks {
    data: TaskViewData[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
}
