import { Check, CirclePause, Pause, Play, Plus, Sparkles, Square, Timer } from 'lucide-react';
import gsap from 'gsap';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';

import { RankEmblem } from '../../components/rank/RankEmblem';
import { rankAccents } from '../../components/rank/rankPresentation';
import { classNames } from '../../components/ui/classNames';
import { FocusTaskFinder } from './FocusTaskFinder';
import { useFocusTimer } from './FocusTimerContext';
import { animateIslandEntrance, animateIslandTransition, animateIslandNotificationExit, animateRankPromotion, islandMotionEase } from './dynamicIslandMotion';
import type { IslandControlsSnapshot } from './dynamicIslandMotion';
import type { SpGainEvent } from '../progress/SpGainContext';

const motionEase = islandMotionEase;

export function DynamicIsland({ mobileVisible, mobileTriggerRef, onMobileDismiss, spGain }: {
    mobileVisible: boolean;
    mobileTriggerRef: RefObject<HTMLButtonElement | null>;
    onMobileDismiss: () => void;
    spGain: SpGainEvent | null;
}) {
    const focus = useFocusTimer();
    const islandRef = useRef<HTMLDivElement>(null);
    const surfaceRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    const compactContentRef = useRef<HTMLDivElement>(null);
    const savedContentRef = useRef<HTMLDivElement>(null);
    const spContentRef = useRef<HTMLDivElement>(null);
    const entryIconRef = useRef<HTMLSpanElement>(null);
    const taskFinderRef = useRef<HTMLDivElement>(null);
    const previousSurfaceBounds = useRef<DOMRect | null>(null);
    const previousVisibleMode = useRef<'timer' | 'saved' | 'sp' | null>(null);
    const previousContentKey = useRef<string | null>(null);
    const previousContentSnapshot = useRef<HTMLDivElement | null>(null);
    const previousControlsSnapshot = useRef<IslandControlsSnapshot | null>(null);
    const skipCompactFadeRef = useRef(false);
    const [controlsExpanded, setControlsExpanded] = useState(false);
    const [controlsMounted, setControlsMounted] = useState(false);
    const [findingTask, setFindingTask] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());
    const runningSession = focus.sessions.find((session) => session.running);
    const pausedSessions = focus.sessions.filter((session) => !session.running);
    const primarySession = runningSession ?? pausedSessions[0];
    const listedPausedSessions = runningSession ? pausedSessions : pausedSessions.slice(1);
    const showSavedEvent = Boolean(focus.event);
    const showSpEvent = !showSavedEvent && spGain !== null;
    const promotedRank = showSpEvent ? spGain?.promotedRank : null;
    const showNotification = showSavedEvent || showSpEvent;
    const dismissAfterNotification = !focus.session && !(showSavedEvent && spGain);
    const mobileVisibilityKey = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches && mobileVisible;
    const primaryTitle = primarySession?.taskTitle ?? '';
    const primaryElapsedSeconds = runningSession ? focus.elapsedSeconds : primarySession?.elapsedSeconds ?? 0;
    const stateLabel = runningSession ? 'Running' : 'Paused';
    const visibleMode = showSavedEvent ? 'saved' : showSpEvent ? 'sp' : 'timer';
    const contentKey = showSavedEvent
        ? `saved-${focus.event?.id ?? ''}`
        : showSpEvent
          ? `sp-${spGain?.id ?? ''}-${spGain?.points ?? ''}`
        : `timer-${primarySession?.id ?? ''}-${primaryTitle}-${stateLabel}`;
    const visualKey = showNotification ? contentKey : `${contentKey}-${controlsMounted}-${findingTask}-${pausedSessions.map((session) => session.id).join(',')}`;

    const closeControls = useCallback(() => {
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
    }, [controlsMounted, reducedMotion]);

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
    }, [controlsExpanded, focus.event, mobileVisible, onMobileDismiss, spGain?.id]);

    useEffect(() => {
        if (!showNotification) return;
        const frame = window.requestAnimationFrame(() => {
            setControlsExpanded(false);
            setControlsMounted(false);
            setFindingTask(false);
        });
        return () => window.cancelAnimationFrame(frame);
    }, [showNotification]);

    useEffect(() => {
        if (!controlsExpanded && !mobileVisible) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!(event.target instanceof Node) || islandRef.current?.contains(event.target)) return;

            closeControls();
            if (mobileVisible && !mobileTriggerRef.current?.contains(event.target)) onMobileDismiss();
        };

        document.addEventListener('click', closeOnOutsideClick, true);
        return () => document.removeEventListener('click', closeOnOutsideClick, true);
    }, [closeControls, controlsExpanded, mobileVisible, mobileTriggerRef, onMobileDismiss]);

    useLayoutEffect(() => {
        const content = showSavedEvent ? savedContentRef.current : spContentRef.current;
        if (!showNotification || !dismissAfterNotification || reducedMotion || !surfaceRef.current || !content) return;
        const context = animateIslandNotificationExit(surfaceRef.current, content, islandRef.current, promotedRank ? 3.1 : 2);
        return () => context.revert();
    }, [dismissAfterNotification, focus.event, promotedRank, reducedMotion, showNotification, showSavedEvent, spGain]);

    useLayoutEffect(() => {
        if (!promotedRank || reducedMotion || !spContentRef.current) return;
        const context = animateRankPromotion(spContentRef.current, islandRef.current);
        return () => context.revert();
    }, [promotedRank, reducedMotion, spGain?.id]);

    useLayoutEffect(() => {
        const surface = surfaceRef.current;
        const island = islandRef.current;
        if (!surface || !island || window.getComputedStyle(island).display === 'none') {
            previousVisibleMode.current = null;
            previousContentKey.current = null;
            previousSurfaceBounds.current = null;
            previousContentSnapshot.current = null;
            previousControlsSnapshot.current = null;
            return;
        }

        const nextBounds = surface.getBoundingClientRect();
        const previousBounds = previousSurfaceBounds.current;
        const enterFromCircle = previousVisibleMode.current === null;
        const transitionContent = previousContentKey.current !== null && previousContentKey.current !== contentKey;
        previousSurfaceBounds.current = nextBounds;
        previousVisibleMode.current = visibleMode;
        previousContentKey.current = contentKey;
        skipCompactFadeRef.current = !reducedMotion && (enterFromCircle || transitionContent);

        if (reducedMotion) return;

        if (enterFromCircle && nextBounds.height <= 90 && entryIconRef.current) {
            const content = showSavedEvent ? savedContentRef.current : showSpEvent ? spContentRef.current : compactContentRef.current;
            if (!content) return;
            const context = animateIslandEntrance(surface, content, entryIconRef.current, islandRef.current);
            return () => context.revert();
        }

        if (transitionContent) {
            const incoming = showSavedEvent ? savedContentRef.current : showSpEvent ? spContentRef.current : compactContentRef.current;
            const outgoing = previousContentSnapshot.current;
            if (incoming && outgoing && previousBounds) {
                const context = animateIslandTransition({
                    surface,
                    incoming,
                    outgoing,
                    previousBounds,
                    nextBounds,
                    outgoingControls: previousControlsSnapshot.current,
                    incomingControls: controlsRef.current,
                    scope: islandRef.current,
                });
                return () => context.revert();
            }
        }

        const context = gsap.context(() => {
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
    }, [contentKey, mobileVisibilityKey, reducedMotion, runningSession?.id, showSavedEvent, showSpEvent, visibleMode, visualKey]);

    useLayoutEffect(() => {
        const content = showSavedEvent ? savedContentRef.current : showSpEvent ? spContentRef.current : compactContentRef.current;
        previousContentSnapshot.current = createMotionSnapshot(content);
        const controls = controlsRef.current;
        const controlsContent = createMotionSnapshot(controls);
        previousControlsSnapshot.current = controls && controlsContent
            ? { content: controlsContent, scrollTop: controls.scrollTop, top: controls.offsetTop }
            : null;
    });

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
        if (reducedMotion || skipCompactFadeRef.current || !compactContentRef.current || showNotification) return;

        const context = gsap.context(() => {
            gsap.fromTo(compactContentRef.current, { autoAlpha: 0, y: 3 }, {
                autoAlpha: 1,
                duration: 0.16,
                ease: motionEase,
            });
        }, compactContentRef);

        return () => context.revert();
    }, [primaryTitle, reducedMotion, runningSession?.id, showNotification, stateLabel]);

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

    function openControls() {
        setControlsMounted(true);
        setControlsExpanded(true);
    }

    if (!focus.session && !focus.event && !spGain) return <p aria-live="polite" className="sr-only">{focus.announcement}</p>;

    return (
        <div className={classNames(
            'fixed top-18 left-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 md:top-4',
            !mobileVisible && !showNotification && 'max-md:hidden',
        )} ref={islandRef}>
            <div
                className={classNames(
                    'mx-auto border border-border-strong bg-overlay shadow-[var(--shadow-raised)]',
                    'relative rounded-[1.5rem] p-2',
                    showSavedEvent
                        ? 'w-[min(24rem,calc(100vw-2rem))] border-success/35'
                        : showSpEvent ? promotedRank
                            ? 'w-[min(24rem,calc(100vw-2rem))] border-[var(--rank-accent)]'
                            : 'w-[min(24rem,calc(100vw-2rem))] border-success/35'
                        : controlsMounted ? 'w-full' : 'w-[min(24rem,calc(100vw-2rem))]',
                )}
                ref={surfaceRef}
                style={promotedRank ? { '--rank-accent': rankAccents[promotedRank.tier] } as CSSProperties : undefined}
                role="region"
                aria-label={showSavedEvent && focus.event
                    ? `Focus saved for ${focus.event.taskTitle}, ${formatFocusDuration(focus.event.durationSeconds)}`
                    : showSpEvent && spGain ? promotedRank
                        ? `Promoted to ${promotedRank.displayName}, ${spGain.points} Season Points earned, ${spGain.seasonPoints} Season Points total`
                        : `${spGain.points} Season Points earned, ${spGain.seasonPoints} Season Points total`
                    : `Focus ${stateLabel.toLowerCase()}, ${primaryTitle}`}
            >
                {showSavedEvent && focus.event ? <div className="flex min-h-12 items-center gap-3 px-2" ref={savedContentRef}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success/15 text-success" data-island-glyph="saved" data-island-icon>
                        <Check aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0 flex-1" data-island-copy>
                        <span className="block truncate text-sm font-bold">{focus.event.taskTitle}</span>
                        <span className="block text-[0.6875rem] font-bold tracking-[0.1em] text-success uppercase">Focus saved</span>
                    </span>
                    <span className="shrink-0 font-mono text-lg font-bold tabular-nums" data-island-value>{formatFocusDuration(focus.event.durationSeconds)}</span>
                </div> : showSpEvent && spGain ? <div className="flex min-h-12 items-center gap-3 px-2" ref={spContentRef}>
                    <span className={classNames('relative grid size-9 shrink-0 place-items-center rounded-full', promotedRank ? 'bg-[color-mix(in_srgb,var(--rank-accent)_15%,transparent)]' : 'bg-success/15 text-success')} data-island-glyph={promotedRank ? `rank-${promotedRank.key}` : 'sp'} data-island-icon>
                        {promotedRank ? <>
                            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border border-[var(--rank-accent)] opacity-0" data-island-rank-halo />
                            <RankEmblem className="size-8" data-island-rank-emblem rank={promotedRank} />
                        </> : <Sparkles aria-hidden="true" size={18} />}
                    </span>
                    <span className="min-w-0 flex-1" data-island-copy>
                        <span className="block truncate text-sm font-bold">{promotedRank ? promotedRank.displayName : 'SP earned'}</span>
                        <span className={classNames('block text-[0.6875rem] font-bold tracking-[0.04em]', promotedRank ? 'text-[var(--rank-accent)]' : 'text-muted')}>{promotedRank ? 'Rank up' : 'Season total'} · {spGain.seasonPoints.toLocaleString()} SP</span>
                    </span>
                    <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-success" data-island-value>{spGain.points > 0 ? `+${spGain.points.toLocaleString()} SP` : 'Rank up'}</span>
                </div> : <div className="flex items-center gap-1" ref={compactContentRef}>
                        <button
                            aria-expanded={controlsExpanded}
                            aria-label={`${controlsExpanded ? 'Hide' : 'Show'} Focus controls. ${stateLabel}: ${primaryTitle}`}
                            className="focus-ring flex min-h-12 min-w-0 flex-1 items-center justify-center gap-3 rounded-[1.1rem] px-2 text-left hover:bg-surface-hover"
                            onClick={() => controlsMounted ? closeControls() : openControls()}
                            type="button"
                        >
                            <span className={classNames('grid size-9 shrink-0 place-items-center rounded-full', runningSession ? 'bg-[var(--task-accent)] text-accent-foreground' : 'bg-surface-hover text-warning')} data-island-glyph={runningSession ? 'timer' : 'paused'} data-island-icon>
                                {runningSession ? <Timer aria-hidden="true" size={17} /> : <CirclePause aria-hidden="true" size={17} />}
                            </span>
                            <span className="min-w-0 flex-1" data-island-copy>
                                <span className="block truncate text-sm font-bold">{primaryTitle}</span>
                                <span className="block text-[0.6875rem] font-bold tracking-[0.1em] text-muted uppercase">{stateLabel}</span>
                            </span>
                            {primarySession && <time className="shrink-0 font-mono text-lg font-bold tabular-nums" data-island-value dateTime={`PT${primaryElapsedSeconds}S`}>
                                {formatFocusClock(primaryElapsedSeconds)}
                            </time>}
                        </button>
                        {runningSession && <button
                            aria-label="Find another Focus Task"
                            className="focus-ring grid size-11 shrink-0 place-items-center rounded-full text-accent-ink hover:bg-surface-hover"
                            data-island-action
                            onClick={() => { openControls(); setFindingTask(true); }}
                            title="Find another Task"
                            type="button"
                        ><Plus aria-hidden="true" size={19} /></button>}
                    </div>}

                    {!showNotification && controlsMounted && <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto px-2 pt-6 pb-1" ref={controlsRef}>
                        {primarySession && <div className="focus-island-control grid grid-cols-2 gap-2">
                            {runningSession ? <button
                                className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-hover px-4 text-sm font-bold hover:brightness-110 disabled:opacity-55"
                                disabled={focus.processing}
                                onClick={focus.pause}
                                type="button"
                            ><Pause aria-hidden="true" size={16} />Pause</button> : <button
                                className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-warning/12 px-4 text-sm font-bold text-warning hover:bg-warning/20 disabled:opacity-55"
                                disabled={focus.processing}
                                onClick={() => focus.switchTo(primarySession.taskId, primarySession.taskTitle)}
                                type="button"
                            ><Play aria-hidden="true" fill="currentColor" size={15} />Resume</button>}
                            <button
                                className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger/12 px-4 text-sm font-bold text-danger hover:bg-danger/20 disabled:opacity-55"
                                disabled={focus.processing}
                                onClick={() => focus.stopSession(primarySession.id)}
                                type="button"
                            ><Square aria-hidden="true" fill="currentColor" size={14} />Finish focus</button>
                        </div>}

                        {listedPausedSessions.length > 0 && <section aria-label="Paused Focus Tasks" className="focus-island-control space-y-2">
                            <h2 className="px-2 text-xs font-bold text-muted uppercase">{runningSession ? 'Switch to' : 'Other paused tasks'}</h2>
                            {listedPausedSessions.map((pausedSession) => <div className="flex min-h-14 items-center gap-2 rounded-xl border border-border-strong/60 bg-surface-hover/50 px-2 transition-colors hover:bg-surface-hover" key={pausedSession.id}>
                                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-warning/12 text-warning"><CirclePause aria-hidden="true" size={16} /></span>
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
                    </div>}
                <span className={classNames(
                    'pointer-events-none invisible absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full',
                    showSavedEvent ? 'bg-success/15 text-success' : promotedRank ? 'bg-[color-mix(in_srgb,var(--rank-accent)_15%,transparent)]' : showSpEvent ? 'bg-success/15 text-success' : runningSession ? 'bg-[var(--task-accent)] text-accent-foreground' : 'bg-surface-hover text-warning',
                )} ref={entryIconRef}>
                    {showSavedEvent ? <Check aria-hidden="true" size={18} /> : promotedRank ? <RankEmblem className="size-8" rank={promotedRank} /> : showSpEvent ? <Sparkles aria-hidden="true" size={18} /> : runningSession ? <Timer aria-hidden="true" size={17} /> : <CirclePause aria-hidden="true" size={17} />}
                </span>
            </div>
            <p aria-live="polite" className="sr-only">{focus.announcement}</p>
            <p aria-live="polite" className="sr-only">{showSpEvent && spGain ? `${promotedRank ? `Promoted to ${promotedRank.displayName}. ` : ''}${spGain.points} Season Points earned. Season total ${spGain.seasonPoints} Season Points.` : ''}</p>
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

function createMotionSnapshot(content: HTMLDivElement | null): HTMLDivElement | null {
    if (!content) return null;
    const snapshot = content.cloneNode(true) as HTMLDivElement;
    snapshot.removeAttribute('style');
    snapshot.querySelectorAll('[style]').forEach((element) => element.removeAttribute('style'));
    return snapshot;
}
