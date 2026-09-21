import { router, usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import type { SharedPageProps } from '../../types';
import { FocusRequestError, switchFocusSession, transitionFocusSession } from './focusApi';
import type { FocusIslandEvent, FocusSessionData } from './types';

interface FocusTimerContextValue {
    session: FocusSessionData | null;
    sessions: FocusSessionData[];
    event: FocusIslandEvent | null;
    elapsedSeconds: number;
    processing: boolean;
    announcement: string;
    error: string;
    switchTo: (taskId: number, taskTitle: string) => Promise<void>;
    pause: () => Promise<void>;
    stopSession: (sessionId: number) => Promise<void>;
}

const FocusTimerContext = createContext<FocusTimerContextValue | null>(null);

export function FocusTimerProvider({ children }: PropsWithChildren) {
    const sharedSessions = usePage<SharedPageProps>().props.openFocusSessions;
    const [sessions, setSessions] = useState<FocusSessionData[]>(sharedSessions);
    const [event, setEvent] = useState<FocusIslandEvent | null>(null);
    const [processing, setProcessing] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [error, setError] = useState('');
    const [clockTick, setClockTick] = useState(() => Date.now());
    const [responseReceivedAt, setResponseReceivedAt] = useState(() => Date.now());
    const session = sessions[0] ?? null;

    const acceptSessions = useCallback((nextSessions: FocusSessionData[]) => {
        setResponseReceivedAt(Date.now());
        setClockTick(Date.now());
        setSessions(nextSessions);
    }, []);

    useEffect(() => router.on('navigate', (navigation) => {
        const nextSessions = (navigation.detail.page.props as unknown as SharedPageProps).openFocusSessions;
        setEvent(null);
        setError('');
        acceptSessions(nextSessions);
    }), [acceptSessions]);

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

    useEffect(() => {
        if (!error) return;
        const timer = window.setTimeout(() => setError(''), 6000);
        return () => window.clearTimeout(timer);
    }, [error]);

    const switchTo = useCallback(async (taskId: number, taskTitle: string) => {
        if (processing) return;
        if (session?.running && session.taskId === taskId) {
            setAnnouncement(`Focus is already running for ${taskTitle}.`);
            return;
        }

        setProcessing(true);
        try {
            const result = await switchFocusSession(taskId);
            acceptSessions(result.sessions);
            setEvent(null);
            setError('');
            setAnnouncement(`Focus is now running for ${result.session.taskTitle}.`);
        } catch (error) {
            if (error instanceof FocusRequestError && error.sessions) acceptSessions(error.sessions);
            const message = focusErrorMessage(error);
            setError(message);
            setAnnouncement(message);
        } finally {
            setProcessing(false);
        }
    }, [acceptSessions, processing, session]);

    const pause = useCallback(async () => {
        if (!session?.running || processing) return;
        setProcessing(true);
        try {
            const result = await transitionFocusSession(session.id, 'pause');
            acceptSessions(result.sessions);
            setError('');
            setAnnouncement(`Focus paused for ${result.session.taskTitle}.`);
        } catch (error) {
            if (error instanceof FocusRequestError && error.sessions) acceptSessions(error.sessions);
            const message = focusErrorMessage(error);
            setError(message);
            setAnnouncement(message);
        } finally {
            setProcessing(false);
        }
    }, [acceptSessions, processing, session]);

    const stopSession = useCallback(async (sessionId: number) => {
        if (processing) return;
        setProcessing(true);
        try {
            const result = await transitionFocusSession(sessionId, 'stop');
            acceptSessions(result.sessions);
            setError('');
            setEvent({
                type: 'focus-saved',
                id: result.session.id,
                taskTitle: result.session.taskTitle,
                durationSeconds: result.session.elapsedSeconds,
            });
            setAnnouncement(`Focus saved for ${result.session.taskTitle}: ${formatSpokenDuration(result.session.elapsedSeconds)}.`);
        } catch (error) {
            if (error instanceof FocusRequestError && error.sessions) acceptSessions(error.sessions);
            const message = focusErrorMessage(error);
            setError(message);
            setAnnouncement(message);
        } finally {
            setProcessing(false);
        }
    }, [acceptSessions, processing]);

    const elapsedSeconds = session === null ? 0 : currentElapsedSeconds(session, clockTick, responseReceivedAt);
    const value = useMemo<FocusTimerContextValue>(() => ({
        session,
        sessions,
        event,
        elapsedSeconds,
        processing,
        announcement,
        error,
        switchTo,
        pause,
        stopSession,
    }), [announcement, elapsedSeconds, error, event, pause, processing, session, sessions, stopSession, switchTo]);

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
