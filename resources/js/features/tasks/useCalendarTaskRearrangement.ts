import { useLayoutEffect, useRef } from 'react';

import type { TaskViewData } from './types';

export function useCalendarTaskRearrangement(tasks: TaskViewData[]) {
    const listRef = useRef<HTMLDivElement>(null);
    const previousPositions = useRef(new Map<number, number>());

    useLayoutEffect(() => {
        const positions = new Map<number, number>();
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        listRef.current?.querySelectorAll<HTMLElement>('[data-calendar-task-id]').forEach((element) => {
            const taskId = Number(element.dataset.calendarTaskId);
            const currentTop = element.offsetTop;
            const previousTop = previousPositions.current.get(taskId);
            positions.set(taskId, currentTop);

            if (!reduceMotion && previousTop !== undefined && previousTop !== currentTop) {
                element.animate([
                    { transform: `translateY(${previousTop - currentTop}px)` },
                    { transform: 'translateY(0)' },
                ], { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
            }
        });

        previousPositions.current = positions;
    }, [tasks]);

    return listRef;
}
