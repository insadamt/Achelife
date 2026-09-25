import { router, usePage } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import type { SharedPageProps } from '../../types';
import { useFocusTimer } from '../focus/FocusTimerContext';
import type { RankViewData } from '../seasons/types';

export interface SpGainEvent {
    id: number;
    points: number;
    seasonPoints: number;
    promotedRank: RankViewData | null;
}

interface SpGainNotificationValue {
    event: SpGainEvent | null;
    announceGain: (gain: { points: number; seasonPoints: number; earnedOn?: string }) => void;
}

interface SeasonPointsSnapshot {
    seasonId: number;
    points: number;
    rank: RankViewData | null;
}

const SpGainContext = createContext<SpGainNotificationValue | null>(null);

export function SpGainProvider({ children }: PropsWithChildren) {
    const { progressPanel } = usePage<SharedPageProps>().props;
    const focus = useFocusTimer();
    const season = progressPanel?.season;
    const seasonId = season?.id ?? null;
    const seasonPoints = season?.seasonPoints ?? null;
    const rank = season?.rank ?? null;
    const previousPointsRef = useRef<SeasonPointsSnapshot | null>(seasonId === null || seasonPoints === null
        ? null
        : { seasonId, points: seasonPoints, rank });
    const nextEventIdRef = useRef(0);
    const [event, setEvent] = useState<SpGainEvent | null>(null);

    const showGain = useCallback((points: number, seasonPoints: number, promotedRank: RankViewData | null = null) => {
        if (points <= 0 && !promotedRank) return;
        setEvent((current) => ({
            id: ++nextEventIdRef.current,
            points: (current?.points ?? 0) + points,
            seasonPoints,
            promotedRank: promotedRank ?? current?.promotedRank ?? null,
        }));
    }, []);

    useEffect(() => {
        if (seasonId === null || seasonPoints === null) {
            previousPointsRef.current = null;
            return;
        }

        const previous = previousPointsRef.current;
        previousPointsRef.current = { seasonId, points: seasonPoints, rank };
        if (!previous || previous.seasonId !== seasonId) return;

        const gainedPoints = Math.max(0, seasonPoints - previous.points);
        const promotedRank = rank && previous.rank && rank.key !== previous.rank.key
            && (rank.minimumSp ?? Number.NEGATIVE_INFINITY) > (previous.rank.minimumSp ?? Number.NEGATIVE_INFINITY)
            ? rank : null;
        if (gainedPoints > 0 || promotedRank) queueMicrotask(() => showGain(gainedPoints, seasonPoints, promotedRank));
    }, [rank, seasonId, seasonPoints, showGain]);

    useEffect(() => {
        if (!event || focus.event) return;
        const timer = window.setTimeout(() => setEvent(null), event.promotedRank ? 4500 : focus.session ? 2400 : 3200);
        return () => window.clearTimeout(timer);
    }, [event, focus.event, focus.session]);

    const announceGain = useCallback(({ points, seasonPoints, earnedOn }: { points: number; seasonPoints: number; earnedOn?: string }) => {
        if (points <= 0) return;
        if (season && earnedOn !== undefined && earnedOn >= season.startDate && earnedOn <= season.endDate) {
            const previousPoints = previousPointsRef.current?.points ?? season.seasonPoints;
            previousPointsRef.current = { seasonId: season.id, points: seasonPoints, rank: season.rank };
            if (season.rank?.nextThreshold !== null && season.rank?.nextThreshold !== undefined
                && previousPoints < season.rank.nextThreshold && seasonPoints >= season.rank.nextThreshold) {
                router.reload({ only: ['progressPanel'] });
            }
        }
        showGain(points, seasonPoints);
    }, [season, showGain]);

    return <SpGainContext.Provider value={{ event, announceGain }}>{children}</SpGainContext.Provider>;
}

export function useSpGain() {
    const context = useContext(SpGainContext);
    if (!context) throw new Error('useSpGain must be used inside SpGainProvider.');
    return context;
}
