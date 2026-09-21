import type { FocusSessionData } from './types';

interface FocusSessionResponse {
    session: FocusSessionData;
    sessions: FocusSessionData[];
}

export class FocusRequestError extends Error {
    constructor(message: string, public readonly sessions: FocusSessionData[] | null = null) {
        super(message);
    }
}

export function switchFocusSession(taskId: number): Promise<FocusSessionResponse> {
    return sendFocusRequest(`/tasks/${taskId}/focus-sessions/switch`);
}

export function transitionFocusSession(sessionId: number, transition: 'pause' | 'resume' | 'stop'): Promise<FocusSessionResponse> {
    return sendFocusRequest(`/task-focus-sessions/${sessionId}/${transition}`);
}

export interface FocusTaskOption {
    id: number;
    title: string;
    projectName: string | null;
    scheduledDate: string;
}

export async function findFocusTasks(search: string, signal: AbortSignal): Promise<FocusTaskOption[]> {
    const response = await fetch(`/focus-task-options?q=${encodeURIComponent(search)}`, {
        headers: { Accept: 'application/json' },
        signal,
    });

    if (!response.ok) throw new Error('Tasks could not be loaded.');

    const payload = await response.json() as { tasks: FocusTaskOption[] };
    return payload.tasks;
}

async function sendFocusRequest(url: string): Promise<FocusSessionResponse> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: '{}',
    });
    const payload = await response.json() as Partial<FocusSessionResponse> & { message?: string };

    if (!response.ok || !payload.session || !payload.sessions) {
        const message = response.status >= 500 ? 'Focus could not be updated. Reload and try again.' : payload.message ?? 'Focus could not be updated.';
        throw new FocusRequestError(message, payload.sessions ?? null);
    }

    return { session: payload.session, sessions: payload.sessions };
}
