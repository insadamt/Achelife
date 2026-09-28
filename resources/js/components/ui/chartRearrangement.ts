import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const rearrangeDuration = 0.42;

export interface ChartValuePoint {
    key: string;
    x: number;
    value: number | null;
}

export interface ChartValueSeries {
    key: string;
    points: ChartValuePoint[];
}

export interface LineChartFrame {
    minimum: number;
    maximum: number;
    series: ChartValueSeries[];
}

export interface DonutValueSlice {
    key: string;
    value: number;
    color: string;
}

export interface RenderedDonutSlice extends DonutValueSlice {
    exiting: boolean;
}

export interface DonutChartFrame {
    slices: RenderedDonutSlice[];
    arcs: Array<{ key: string; start: number; end: number }>;
    sweep: number;
}

function reducedMotionPreferred(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function interpolateNumber(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
}

function interpolateSeries(from: ChartValueSeries | undefined, to: ChartValueSeries, progress: number): ChartValueSeries {
    const oldByKey = new Map(from?.points.map((point) => [point.key, point]) ?? []);

    return {
        key: to.key,
        points: to.points.map((point, index) => {
            const old = oldByKey.get(point.key) ?? from?.points[Math.min(index, from.points.length - 1)];
            if (!old) return { ...point, value: point.value === null ? null : point.value * progress };

            return {
                key: point.key,
                x: interpolateNumber(old.x, point.x, progress),
                value: point.value === null ? null : interpolateNumber(old.value ?? 0, point.value, progress),
            };
        }),
    };
}

function interpolateLineFrame(from: LineChartFrame, to: LineChartFrame, progress: number): LineChartFrame {
    const oldByKey = new Map(from.series.map((series) => [series.key, series]));

    return {
        minimum: interpolateNumber(from.minimum, to.minimum, progress),
        maximum: interpolateNumber(from.maximum, to.maximum, progress),
        series: to.series.map((series) => interpolateSeries(oldByKey.get(series.key), series, progress)),
    };
}

export function useRearrangedLineChart(target: LineChartFrame): LineChartFrame {
    const signature = JSON.stringify(target);
    const [rendered, setRendered] = useState(target);
    const renderedRef = useRef(rendered);
    const targetRef = useRef(target);
    const signatureRef = useRef(signature);
    const tweenRef = useRef<gsap.core.Tween | null>(null);
    targetRef.current = target;

    useLayoutEffect(() => {
        if (signatureRef.current === signature) return;
        signatureRef.current = signature;
        tweenRef.current?.kill();
        const next = targetRef.current;
        if (reducedMotionPreferred()) {
            renderedRef.current = next;
            setRendered(next);
            return;
        }

        const from = renderedRef.current;
        const tweenState = { progress: 0 };
        renderedRef.current = interpolateLineFrame(from, next, 0);
        setRendered(renderedRef.current);
        tweenRef.current = gsap.to(tweenState, {
            progress: 1,
            duration: rearrangeDuration,
            ease: 'power2.inOut',
            onUpdate: () => {
                renderedRef.current = interpolateLineFrame(from, next, tweenState.progress);
                setRendered(renderedRef.current);
            },
            onComplete: () => {
                renderedRef.current = next;
                setRendered(next);
                tweenRef.current = null;
            },
        });
    }, [signature]);

    useLayoutEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const applyReducedMotion = () => {
            if (!preference.matches) return;
            tweenRef.current?.kill();
            renderedRef.current = targetRef.current;
            setRendered(targetRef.current);
        };
        preference.addEventListener('change', applyReducedMotion);
        return () => {
            preference.removeEventListener('change', applyReducedMotion);
            tweenRef.current?.kill();
        };
    }, []);

    return rendered;
}

function interpolateDonutSlices(from: DonutChartFrame, to: DonutValueSlice[], progress: number): DonutChartFrame {
    const oldByKey = new Map(from.slices.map((slice) => [slice.key, slice]));
    const nextByKey = new Map(to.map((slice) => [slice.key, slice]));
    const order = [...to.map((slice) => slice.key), ...from.slices.filter((slice) => !nextByKey.has(slice.key)).map((slice) => slice.key)];
    const oldAngles = new Map(from.arcs.map((arc) => [arc.key, arc]));
    const nextAngles = new Map(donutArcAngles(to).map((arc) => [arc.key, arc]));

    return { sweep: interpolateNumber(from.sweep, to.some((slice) => slice.value > 0) ? 360 : 0, progress), arcs: order.map((key) => {
        const old = oldAngles.get(key);
        const next = nextAngles.get(key);
        return {
            key,
            start: interpolateNumber(old?.start ?? next?.start ?? 0, next?.start ?? old?.start ?? 0, progress),
            end: interpolateNumber(old?.end ?? next?.start ?? 0, next?.end ?? old?.start ?? 0, progress),
        };
    }), slices: order.map((key) => {
        const old = oldByKey.get(key);
        const next = nextByKey.get(key);
        return {
            key,
            color: next?.color ?? old?.color ?? 'transparent',
            value: interpolateNumber(old?.value ?? 0, next?.value ?? 0, progress),
            exiting: !next,
        };
    }) };
}

export function useRearrangedDonut(target: DonutValueSlice[]): DonutChartFrame {
    const signature = JSON.stringify(target);
    const completedFrame = (slices: DonutValueSlice[]): DonutChartFrame => ({ slices: slices.map((slice) => ({ ...slice, exiting: false })), arcs: donutArcAngles(slices), sweep: slices.some((slice) => slice.value > 0) ? 360 : 0 });
    const [rendered, setRendered] = useState<DonutChartFrame>(() => completedFrame(target));
    const renderedRef = useRef(rendered);
    const targetRef = useRef(target);
    const signatureRef = useRef(signature);
    const tweenRef = useRef<gsap.core.Tween | null>(null);
    targetRef.current = target;

    useLayoutEffect(() => {
        if (signatureRef.current === signature) return;
        signatureRef.current = signature;
        tweenRef.current?.kill();
        const next = targetRef.current;
        if (reducedMotionPreferred()) {
            renderedRef.current = completedFrame(next);
            setRendered(renderedRef.current);
            return;
        }

        const from = renderedRef.current;
        const tweenState = { progress: 0 };
        renderedRef.current = interpolateDonutSlices(from, next, 0);
        setRendered(renderedRef.current);
        tweenRef.current = gsap.to(tweenState, {
            progress: 1,
            duration: rearrangeDuration,
            ease: 'power2.inOut',
            onUpdate: () => {
                renderedRef.current = interpolateDonutSlices(from, next, tweenState.progress);
                setRendered(renderedRef.current);
            },
            onComplete: () => {
                renderedRef.current = completedFrame(next);
                setRendered(renderedRef.current);
                tweenRef.current = null;
            },
        });
    }, [signature]);

    useLayoutEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const applyReducedMotion = () => {
            if (!preference.matches) return;
            tweenRef.current?.kill();
            renderedRef.current = completedFrame(targetRef.current);
            setRendered(renderedRef.current);
        };
        preference.addEventListener('change', applyReducedMotion);
        return () => {
            preference.removeEventListener('change', applyReducedMotion);
            tweenRef.current?.kill();
        };
    }, []);

    return rendered;
}

export function donutArcAngles(slices: DonutValueSlice[], sweep = 360): Array<{ key: string; start: number; end: number }> {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    let cursor = 0;
    return slices.map((slice) => {
        const start = cursor;
        cursor += total > 0 ? slice.value / total * sweep : 0;
        return { key: slice.key, start, end: cursor };
    });
}
