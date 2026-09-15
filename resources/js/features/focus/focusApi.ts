import type { FocusSessionData } from './types';

interface FocusSessionResponse {
    session: FocusSessionData;
}

export class FocusRequestError extends Error {
    constructor(message: string, public readonly activeSession: FocusSessionData | null = null) {
        super(message);
    }
}

export function startFocusSession(taskId: number): Promise<FocusSessionData> {
    return sendFocusRequest(`/tasks/${taskId}/focus-sessions`);
}

export function transitionFocusSession(sessionId: number, transition: 'pause' | 'resume' | 'stop'): Promise<FocusSessionData> {
    return sendFocusRequest(`/task-focus-sessions/${sessionId}/${transition}`);
}

async function sendFocusRequest(url: string): Promise<FocusSessionData> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        body: '{}',
    });
    const payload = await response.json() as Partial<FocusSessionResponse> & { activeSession?: FocusSessionData; message?: string };

    if (!response.ok || !payload.session) {
        throw new FocusRequestError(payload.message ?? 'Focus could not be updated.', payload.activeSession ?? null);
    }

    return payload.session;
}
