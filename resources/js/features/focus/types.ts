export type FocusSessionState = 'running' | 'paused' | 'completed';

export interface FocusSessionData {
    id: number;
    taskId: number;
    taskTitle: string;
    projectName: string | null;
    state: FocusSessionState;
    source: 'timer' | 'manual';
    timezone: string;
    startedAt: string;
    endedAt: string | null;
    accumulatedSeconds: number;
    openIntervalStartedAt: string | null;
    elapsedSeconds: number;
    serverTimestamp: string;
    active: boolean;
    running: boolean;
}

export interface FocusSavedEvent {
    type: 'focus-saved';
    id: number;
    taskTitle: string;
    durationSeconds: number;
}

export type FocusIslandEvent = FocusSavedEvent;
