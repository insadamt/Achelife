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

export interface TaskViewData {
    id: number;
    title: string;
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
}

export interface EditableSubtask {
    id?: number;
    title: string;
    completed?: boolean;
}

export interface TaskFormData {
    title: string;
    scheduled_date: string;
    important: boolean;
    recurrence_type: RecurrenceType | null;
    weekdays: number[];
    subtasks: EditableSubtask[];
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
