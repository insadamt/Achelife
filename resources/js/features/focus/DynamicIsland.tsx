import { Check, CirclePause, Pause, Play, Plus, Square, Timer } from 'lucide-react';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { classNames } from '../../components/ui/classNames';
import { FocusTaskFinder } from './FocusTaskFinder';
import { useFocusTimer } from './FocusTimerContext';

const motionEase = 'power3.out';

export function DynamicIsland({ mobileVisible, mobileTriggerRef, onMobileDismiss }: {
    mobileVisible: boolean;
    mobileTriggerRef: RefObject<HTMLButtonElement | null>;
    onMobileDismiss: () => void;
}) {
    const focus = useFocusTimer();
    const islandRef = useRef<HTMLDivElement>(null);
    const surfaceRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    const compactContentRef = useRef<HTMLDivElement>(null);
    const taskFinderRef = useRef<HTMLDivElement>(null);
    const savedStatusRef = useRef<HTMLParagraphElement>(null);
    const previousSurfaceBounds = useRef<DOMRect | null>(null);
    const hasAnimatedIn = useRef(false);
    const [controlsExpanded, setControlsExpanded] = useState(false);
    const [controlsMounted, setControlsMounted] = useState(false);
    const [findingTask, setFindingTask] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());
    const [savedFeedbackFading, setSavedFeedbackFading] = useState(false);
    const runningSession = focus.sessions.find((session) => session.running);
    const pausedSessions = focus.sessions.filter((session) => !session.running);
    const eventOnly = !focus.session && Boolean(focus.event);
    const primaryTitle = runningSession?.taskTitle ?? (pausedSessions.length === 1 ? pausedSessions[0]?.taskTitle : `${pausedSessions.length} Tasks paused`);
    const stateLabel = runningSession ? 'Running' : 'All paused';
    const sessionStateKey = focus.sessions.map((session) => `${session.id}-${session.running}-${session.elapsedSeconds}`).join('|');
    const visualKey = eventOnly
        ? `saved-${focus.event?.id ?? ''}`
        : `${sessionStateKey}-${focus.event?.id ?? ''}-${controlsMounted}-${findingTask}`;

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
        updateMotionPreference();
        mediaQuery.addEventListener('change', updateMotionPreference);
        return () => mediaQuery.removeEventListener('change', updateMotionPreference);
    }, []);

    useEffect(() => {
        if (!mobileVisible || controlsExpanded) return;
        const timer = window.setTimeout(onMobileDismiss, 3500);
        return () => window.clearTimeout(timer);
    }, [controlsExpanded, mobileVisible, onMobileDismiss]);

    useEffect(() => {
        if (!controlsExpanded && !mobileVisible) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!(event.target instanceof Node) || islandRef.current?.contains(event.target)) return;

            closeControls();
            if (mobileVisible && !mobileTriggerRef.current?.contains(event.target)) onMobileDismiss();
        };

        document.addEventListener('click', closeOnOutsideClick, true);
        return () => document.removeEventListener('click', closeOnOutsideClick, true);
    }, [controlsExpanded, mobileVisible, mobileTriggerRef, onMobileDismiss]);

    useEffect(() => {
        if (!eventOnly || !focus.event) {
            setSavedFeedbackFading(false);
            return;
        }

        const fadeTimer = window.setTimeout(() => setSavedFeedbackFading(true), 4550);
        return () => window.clearTimeout(fadeTimer);
    }, [eventOnly, focus.event]);

    useLayoutEffect(() => {
        const surface = surfaceRef.current;
        if (!surface) return;

        const nextBounds = surface.getBoundingClientRect();
        const previousBounds = previousSurfaceBounds.current;
        previousSurfaceBounds.current = nextBounds;

        if (reducedMotion) {
            hasAnimatedIn.current = true;
            return;
        }

        const context = gsap.context(() => {
            if (!hasAnimatedIn.current) {
                gsap.fromTo(surface, { autoAlpha: 0, scale: 0.96, y: -10 }, {
                    autoAlpha: 1,
                    duration: 0.28,
                    ease: motionEase,
                    clearProps: 'transform',
                });
                hasAnimatedIn.current = true;
                return;
            }

            if (!previousBounds) return;

            gsap.set(surface, {
                height: previousBounds.height,
                overflow: 'hidden',
                width: previousBounds.width,
            });
            gsap.to(surface, {
                height: nextBounds.height,
                duration: 0.3,
                ease: motionEase,
                width: nextBounds.width,
                onComplete: () => gsap.set(surface, { clearProps: 'height,overflow,width' }),
            });
        }, islandRef);

        return () => context.revert();
    }, [reducedMotion, visualKey]);

    useEffect(() => {
        if (reducedMotion || !controlsMounted || !controlsRef.current) return;

        const context = gsap.context(() => {
            gsap.fromTo(controlsRef.current, { autoAlpha: 0, y: -8 }, {
                autoAlpha: 1,
                duration: 0.18,
                ease: motionEase,
            });
            gsap.fromTo('.focus-island-control', { autoAlpha: 0, y: -5 }, {
                autoAlpha: 1,
                delay: 0.05,
                duration: 0.16,
                ease: motionEase,
                stagger: 0.035,
            });
        }, controlsRef);

        return () => context.revert();
    }, [controlsMounted, reducedMotion]);

    useEffect(() => {
        if (reducedMotion || !compactContentRef.current || eventOnly) return;

        const context = gsap.context(() => {
            gsap.fromTo(compactContentRef.current, { autoAlpha: 0, y: 3 }, {
                autoAlpha: 1,
                duration: 0.16,
                ease: motionEase,
            });
        }, compactContentRef);

        return () => context.revert();
    }, [eventOnly, primaryTitle, reducedMotion, runningSession?.id, stateLabel]);

    useEffect(() => {
        if (!findingTask || reducedMotion || !taskFinderRef.current) return;
        const context = gsap.context(() => {
            gsap.fromTo(taskFinderRef.current, { autoAlpha: 0, y: -5 }, {
                autoAlpha: 1,
                duration: 0.16,
                ease: motionEase,
            });
        }, controlsRef);
        return () => context.revert();
    }, [findingTask, reducedMotion]);

    useEffect(() => {
        if (!focus.event || eventOnly || reducedMotion || !savedStatusRef.current) return;
        const context = gsap.context(() => {
            gsap.fromTo(savedStatusRef.current, { autoAlpha: 0, y: -3 }, {
                autoAlpha: 1,
                duration: 0.16,
                ease: motionEase,
            });
        }, controlsRef);
        return () => context.revert();
    }, [eventOnly, focus.event, reducedMotion]);

    useEffect(() => {
        if (!savedFeedbackFading || reducedMotion || !surfaceRef.current) return;
        const context = gsap.context(() => {
            gsap.to(surfaceRef.current, { autoAlpha: 0, duration: 0.42, ease: 'power1.in' });
        }, islandRef);
        return () => context.revert();
    }, [reducedMotion, savedFeedbackFading]);

    function openControls() {
        setControlsMounted(true);
        setControlsExpanded(true);
    }

    function closeControls() {
        if (!controlsMounted) return;

        setControlsExpanded(false);
        setFindingTask(false);
        if (reducedMotion || !controlsRef.current) {
            setControlsMounted(false);
            return;
        }

        gsap.to(controlsRef.current, {
            autoAlpha: 0,
            duration: 0.14,
            ease: 'power1.in',
            onComplete: () => setControlsMounted(false),
        });
    }

    if (!focus.session && !focus.event) return <p aria-live="polite" className="sr-only">{focus.announcement}</p>;

    return (
        <div className={classNames(
            'fixed top-18 left-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 md:top-4',
            !mobileVisible && 'max-md:hidden',
        )} ref={islandRef}>
            <div
                className={classNames(
                    'mx-auto border border-border-strong bg-elevated/96 shadow-2xl backdrop-blur-md',
                    eventOnly
                        ? 'flex w-fit max-w-full items-center gap-3 rounded-full border-success/35 px-4 py-3 text-sm font-bold'
                        : classNames('rounded-[1.5rem] p-2', controlsMounted ? 'w-full' : 'w-[min(24rem,calc(100vw-2rem))]'),
                )}
                ref={surfaceRef}
                role={eventOnly ? 'status' : 'region'}
                aria-label={eventOnly ? undefined : `Focus ${stateLabel.toLowerCase()}, ${primaryTitle}`}
            >
                {eventOnly && focus.event ? <>
                    <Check aria-hidden="true" className="text-success" size={18} />
                    <span className="truncate">Focus saved · {formatFocusDuration(focus.event.durationSeconds)}</span>
                </> : <>
                    <div className="flex items-center gap-1" ref={compactContentRef}>
                        <button
                            aria-expanded={controlsExpanded}
                            aria-label={`${controlsExpanded ? 'Hide' : 'Show'} Focus controls. ${stateLabel}: ${primaryTitle}`}
                            className="focus-ring flex min-h-12 min-w-0 flex-1 items-center justify-center gap-3 rounded-[1.1rem] px-2 text-left hover:bg-surface-hover"
                            onClick={() => controlsMounted ? closeControls() : openControls()}
                            type="button"
                        >
                            <span className={classNames('grid size-9 shrink-0 place-items-center rounded-full', runningSession ? 'bg-[var(--task-accent)] text-accent-foreground' : 'bg-surface-hover text-warning')}>
                                {runningSession ? <Timer aria-hidden="true" size={17} /> : <CirclePause aria-hidden="true" size={17} />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold">{primaryTitle}</span>
                                <span className="block text-[0.6875rem] font-bold tracking-[0.1em] text-muted uppercase">{stateLabel}</span>
                            </span>
                            {runningSession && <time className="shrink-0 font-mono text-lg font-bold tabular-nums" dateTime={`PT${focus.elapsedSeconds}S`}>
                                {formatFocusClock(focus.elapsedSeconds)}
                            </time>}
                        </button>
                        {runningSession && <button
                            aria-label="Find another Focus Task"
                            className="focus-ring grid size-11 shrink-0 place-items-center rounded-full text-accent-ink hover:bg-surface-hover"
                            onClick={() => { openControls(); setFindingTask(true); }}
                            title="Find another Task"
                            type="button"
                        ><Plus aria-hidden="true" size={19} /></button>}
                    </div>

                    {controlsMounted && <div className="max-h-[min(70vh,32rem)] space-y-3 overflow-y-auto px-2 pt-3 pb-1" ref={controlsRef}>
                        {runningSession && <div className="focus-island-control grid grid-cols-2 gap-2">
                            <button
                                className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-hover px-4 text-sm font-bold hover:brightness-110 disabled:opacity-55"
                                disabled={focus.processing}
                                onClick={focus.pause}
                                type="button"
                            ><Pause aria-hidden="true" size={16} />Pause</button>
                            <button
                                className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger/12 px-4 text-sm font-bold text-danger hover:bg-danger/20 disabled:opacity-55"
                                disabled={focus.processing}
                                onClick={() => focus.stopSession(runningSession.id)}
                                type="button"
                            ><Square aria-hidden="true" fill="currentColor" size={14} />Finish focus</button>
                        </div>}

                        {pausedSessions.length > 0 && <section aria-label="Paused Focus Tasks" className="focus-island-control space-y-1">
                            <h2 className="px-2 text-xs font-bold text-muted uppercase">{runningSession ? 'Switch to' : 'Paused Tasks'}</h2>
                            {pausedSessions.map((pausedSession) => <div className="flex min-h-12 items-center gap-2 rounded-xl bg-surface-hover/60 px-2" key={pausedSession.id}>
                                <CirclePause aria-hidden="true" className="shrink-0 text-warning" size={16} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">{pausedSession.taskTitle}</span>
                                    <span className="block font-mono text-xs text-muted">{formatFocusClock(pausedSession.elapsedSeconds)}</span>
                                </span>
                                <button
                                    aria-label={`Resume Focus for ${pausedSession.taskTitle}`}
                                    className="focus-ring grid size-10 shrink-0 place-items-center rounded-full hover:bg-elevated disabled:opacity-55"
                                    disabled={focus.processing}
                                    onClick={() => focus.switchTo(pausedSession.taskId, pausedSession.taskTitle)}
                                    title="Resume Focus"
                                    type="button"
                                ><Play aria-hidden="true" fill="currentColor" size={16} /></button>
                                <button
                                    aria-label={`Finish Focus for ${pausedSession.taskTitle}`}
                                    className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-danger hover:bg-danger/12 disabled:opacity-55"
                                    disabled={focus.processing}
                                    onClick={() => focus.stopSession(pausedSession.id)}
                                    title="Finish Focus"
                                    type="button"
                                ><Square aria-hidden="true" fill="currentColor" size={13} /></button>
                            </div>)}
                        </section>}

                        <button
                            aria-expanded={findingTask}
                            className="focus-island-control focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong text-sm font-bold hover:bg-surface-hover"
                            onClick={() => setFindingTask((open) => !open)}
                            type="button"
                        ><Plus aria-hidden="true" size={16} />Find another Task</button>
                        {findingTask && <div className="focus-island-control" ref={taskFinderRef}><FocusTaskFinder onSelected={() => setFindingTask(false)} /></div>}
                        {focus.event && <p className="focus-island-control text-center text-xs font-semibold text-success" ref={savedStatusRef} role="status">Focus saved · {formatFocusDuration(focus.event.durationSeconds)}</p>}
                    </div>}
                </>}
            </div>
            <p aria-live="polite" className="sr-only">{focus.announcement}</p>
        </div>
    );
}

export function formatFocusClock(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainder = safeSeconds % 60;
    return [hours, minutes, remainder].map((value) => value.toString().padStart(2, '0')).join(':');
}

function formatFocusDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}m`;
    return `${hours}h ${minutes % 60}m`;
}

function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
