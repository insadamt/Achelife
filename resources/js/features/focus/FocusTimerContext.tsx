import { router, usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import type { SharedPageProps } from '../../types';
import { FocusRequestError, startFocusSession, transitionFocusSession } from './focusApi';
import type { FocusIslandEvent, FocusSessionData } from './types';

interface FocusTimerContextValue {
    session: FocusSessionData | null;
    event: FocusIslandEvent | null;
    elapsedSeconds: number;
    processing: boolean;
    announcement: string;
    start: (taskId: number, taskTitle: string) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

export function FocusTimerProvider({ children }: PropsWithChildren) {
    const sharedSession = usePage<SharedPageProps>().props.activeFocusSession;
    const [session, setSession] = useState<FocusSessionData | null>(sharedSession);
    const [event, setEvent] = useState<FocusIslandEvent | null>(null);
    const [processing, setProcessing] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [clockTick, setClockTick] = useState(() => Date.now());
    const [responseReceivedAt, setResponseReceivedAt] = useState(() => Date.now());

    const acceptSession = useCallback((nextSession: FocusSessionData | null) => {
        setResponseReceivedAt(Date.now());
        setClockTick(Date.now());
        setSession(nextSession?.active ? nextSession : null);
    }, []);

    useEffect(() => router.on('navigate', (navigation) => {
        const nextSession = (navigation.detail.page.props as unknown as SharedPageProps).activeFocusSession;
        setEvent(null);
        acceptSession(nextSession);
    }), [acceptSession]);

    useEffect(() => {
        if (!session?.running) return;
        const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [session?.id, session?.running]);

    useEffect(() => {
        if (!event) return;
        const timer = window.setTimeout(() => setEvent(null), 5000);
        return () => window.clearTimeout(timer);
    }, [event]);

    const runControl = useCallback(async (control: 'pause' | 'resume' | 'stop') => {
        if (!session || processing) return;
        setProcessing(true);
        try {
            const updated = await transitionFocusSession(session.id, control);
            if (control === 'stop') {
                setEvent({
                    type: 'focus-saved',
                    id: updated.id,
                    taskTitle: updated.taskTitle,
                    durationSeconds: updated.elapsedSeconds,
                });
                setSession(null);
                setAnnouncement(`Focus saved for ${formatSpokenDuration(updated.elapsedSeconds)}.`);
                return;
            }
            acceptSession(updated);
            setAnnouncement(`Focus ${control === 'pause' ? 'paused' : 'resumed'} for ${updated.taskTitle}.`);
        } catch (error) {
            setAnnouncement(focusErrorMessage(error));
        } finally {
            setProcessing(false);
        }
    }, [acceptSession, processing, session]);

    const start = useCallback(async (taskId: number, taskTitle: string) => {
        if (processing) return;
        if (session) {
            setAnnouncement(session.taskId === taskId
                ? `Focus is already ${session.state} for ${session.taskTitle}.`
                : `Focus is active for ${session.taskTitle}. Stop it before starting ${taskTitle}.`);
            return;
        }
        setProcessing(true);
        try {
            const started = await startFocusSession(taskId);
            setEvent(null);
            acceptSession(started);
            setAnnouncement(`Focus started for ${started.taskTitle}.`);
        } catch (error) {
            if (error instanceof FocusRequestError && error.activeSession) acceptSession(error.activeSession);
            setAnnouncement(focusErrorMessage(error));
        } finally {
            setProcessing(false);
        }
    }, [acceptSession, processing, session]);

    const elapsedSeconds = session === null ? 0 : currentElapsedSeconds(session, clockTick, responseReceivedAt);
    const value = useMemo<FocusTimerContextValue>(() => ({
        session,
        event,
        elapsedSeconds,
        processing,
        announcement,
        start,
        pause: () => runControl('pause'),
        resume: () => runControl('resume'),
        stop: () => runControl('stop'),
    }), [announcement, elapsedSeconds, event, processing, runControl, session, start]);

    return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>;
}

export function useFocusTimer(): FocusTimerContextValue {
    const value = useContext(FocusTimerContext);
    if (!value) throw new Error('useFocusTimer must be used inside FocusTimerProvider.');
    return value;
}

function currentElapsedSeconds(session: FocusSessionData, now: number, receivedAt: number): number {
    if (!session.running || !session.openIntervalStartedAt) return session.elapsedSeconds;
    const serverElapsed = session.accumulatedSeconds + Math.max(0, Math.floor(
        (Date.parse(session.serverTimestamp) - Date.parse(session.openIntervalStartedAt)) / 1000,
    ));
    const localElapsed = Math.max(0, Math.floor((now - receivedAt) / 1000));
    return Math.max(session.elapsedSeconds, serverElapsed) + localElapsed;
}

function focusErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Focus could not be updated.';
}

function formatSpokenDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return `${seconds} seconds`;
    const hours = Math.floor(minutes / 60);
    return hours < 1 ? `${minutes} minutes` : `${hours} hours and ${minutes % 60} minutes`;
}
