import gsap from 'gsap';

export const islandMotionEase = 'power3.out';

const motionSlots = {
    icon: '[data-island-icon]',
    copy: '[data-island-copy]',
    value: '[data-island-value]',
    action: '[data-island-action]',
} as const;

function findMotionSlot(content: HTMLElement, slot: keyof typeof motionSlots): HTMLElement | null {
    return content.querySelector<HTMLElement>(motionSlots[slot]);
}

function horizontalCenter(element: HTMLElement): number {
    const bounds = element.getBoundingClientRect();
    return bounds.left + bounds.width / 2;
}

export type IslandControlsSnapshot = { content: HTMLDivElement; scrollTop: number; top: number };

export interface IslandTransitionOptions {
    surface: HTMLDivElement;
    incoming: HTMLDivElement;
    outgoing: HTMLDivElement;
    previousBounds: DOMRect;
    nextBounds: DOMRect;
    outgoingControls: IslandControlsSnapshot | null;
    incomingControls: HTMLDivElement | null;
    promotedSessionId: number | null;
    scope: HTMLDivElement | null;
}

function appendPromotedSessionOverlay(controlsSnapshot: HTMLDivElement | undefined, incoming: HTMLDivElement, sessionId: number | null): HTMLDivElement | null {
    if (!controlsSnapshot || sessionId === null) return null;
    const pausedRow = controlsSnapshot.querySelector<HTMLDivElement>(`[data-island-session-id="${sessionId}"]`);
    const target = incoming.querySelector<HTMLButtonElement>('button');
    if (!pausedRow || !target) return null;

    const sourceBounds = pausedRow.getBoundingClientRect();
    const movingRow = pausedRow.cloneNode(true) as HTMLDivElement;
    movingRow.setAttribute('aria-hidden', 'true');
    movingRow.inert = true;
    Object.assign(movingRow.style, {
        height: `${sourceBounds.height}px`,
        left: `${sourceBounds.left}px`,
        margin: '0',
        pointerEvents: 'none',
        position: 'fixed',
        top: `${sourceBounds.top}px`,
        width: `${sourceBounds.width}px`,
        zIndex: '60',
    });
    document.body.appendChild(movingRow);
    gsap.set(pausedRow, { autoAlpha: 0 });
    return movingRow;
}

export function animateIslandEntrance(surface: HTMLDivElement, content: HTMLDivElement, icon: HTMLSpanElement, scope: HTMLDivElement | null) {
    const expandedWidth = surface.offsetWidth;
    const circleSize = surface.offsetHeight;
    const leadingIcon = findMotionSlot(content, 'icon');
    const copy = findMotionSlot(content, 'copy');
    const value = findMotionSlot(content, 'value');
    const action = findMotionSlot(content, 'action');
    if (!leadingIcon) return gsap.context(() => undefined, scope ?? undefined);

    const iconDestination = leadingIcon.getBoundingClientRect().left + leadingIcon.offsetWidth / 2 - surface.getBoundingClientRect().left;

    return gsap.context(() => {
        gsap.set(surface, {
            borderRadius: circleSize / 2,
            height: circleSize,
            overflow: 'hidden',
            padding: 0,
            width: circleSize,
        });
        gsap.set(content, { autoAlpha: 0, width: expandedWidth - 16 });
        gsap.set(icon, { autoAlpha: 0, left: circleSize / 2, scale: 0.6 });
        gsap.set([leadingIcon, copy, value, action].filter(Boolean), { autoAlpha: 0 });

        const timeline = gsap.timeline();
        timeline.fromTo(surface, { autoAlpha: 0, scale: 0.75 }, { autoAlpha: 1, scale: 1, duration: 0.22, ease: islandMotionEase });
        timeline.to(icon, { autoAlpha: 1, scale: 1, duration: 0.2, ease: islandMotionEase }, '<');
        timeline.to(surface, { borderRadius: 24, padding: 8, width: expandedWidth, duration: 0.46, ease: 'power2.inOut' });
        timeline.set(content, { autoAlpha: 1 }, '<');
        timeline.to(icon, { left: iconDestination, duration: 0.46, ease: 'power2.inOut' }, '<');
        timeline.to([copy, value, action].filter(Boolean), {
            autoAlpha: 1,
            duration: 0.2,
            ease: islandMotionEase,
            stagger: 0.045,
            y: 0,
            startAt: { y: 4 },
        }, '<+=0.2');
        timeline.set(leadingIcon, { autoAlpha: 1 }, '>-0.02');
        timeline.set(icon, { autoAlpha: 0 }, '<');
        timeline.set(surface, { clearProps: 'width,height,padding,borderRadius,overflow,transform,opacity,visibility' });
        timeline.set(content, { clearProps: 'width,opacity,visibility' });
        timeline.set(icon, { clearProps: 'left,transform' });
        timeline.set([leadingIcon, copy, value, action].filter(Boolean), { clearProps: 'opacity,visibility,transform' });
    }, scope ?? undefined);
}

export function animateIslandTransition({
    surface,
    incoming,
    outgoing,
    previousBounds,
    nextBounds,
    outgoingControls,
    incomingControls,
    promotedSessionId,
    scope,
}: IslandTransitionOptions) {
    const outgoingSnapshot = outgoing.cloneNode(true) as HTMLDivElement;
    outgoingSnapshot.setAttribute('aria-hidden', 'true');
    outgoingSnapshot.inert = true;
    Object.assign(outgoingSnapshot.style, {
        left: '8px',
        pointerEvents: 'none',
        position: 'absolute',
        top: '8px',
        width: `${previousBounds.width - 16}px`,
        zIndex: '1',
    });
    const controlsSnapshot = outgoingControls?.content.cloneNode(true) as HTMLDivElement | undefined;
    if (controlsSnapshot && outgoingControls) {
        controlsSnapshot.setAttribute('aria-hidden', 'true');
        controlsSnapshot.inert = true;
        Object.assign(controlsSnapshot.style, {
            left: '8px',
            pointerEvents: 'none',
            position: 'absolute',
            top: `${outgoingControls.top}px`,
            width: `${previousBounds.width - 16}px`,
            zIndex: '1',
        });
    }

    let promotedRow: HTMLDivElement | null = null;
    const context = gsap.context(() => {
        surface.appendChild(outgoingSnapshot);
        if (controlsSnapshot) {
            surface.appendChild(controlsSnapshot);
            controlsSnapshot.scrollTop = outgoingControls?.scrollTop ?? 0;
        }
        gsap.set(surface, { height: previousBounds.height, overflow: 'hidden', width: previousBounds.width });
        promotedRow = appendPromotedSessionOverlay(controlsSnapshot, incoming, promotedSessionId);
        gsap.set(incoming, { autoAlpha: 1 });
        gsap.set((['icon', 'copy', 'value', 'action'] as const).map((slot) => findMotionSlot(incoming, slot)).filter(Boolean), { autoAlpha: 0 });
        if (incomingControls && controlsSnapshot) gsap.set(incomingControls, { autoAlpha: 0, y: 5 });

        const timeline = gsap.timeline({
            onComplete: () => {
                gsap.set(surface, { clearProps: 'height,overflow,width' });
                outgoingSnapshot.remove();
                controlsSnapshot?.remove();
                promotedRow?.remove();
            },
        });
        timeline.to(surface, { height: nextBounds.height, width: nextBounds.width, duration: 0.34, ease: 'power2.inOut' }, 0);
        if (controlsSnapshot) timeline.to(controlsSnapshot, { autoAlpha: 0, duration: 0.15, ease: 'power1.in', y: -4 }, 0);
        if (incomingControls && controlsSnapshot) {
            timeline.to(incomingControls, { autoAlpha: 1, duration: 0.2, ease: islandMotionEase, y: 0 }, 0.1);
        }
        if (promotedRow) {
            const targetBounds = incoming.querySelector('button')?.getBoundingClientRect();
            if (targetBounds) {
                timeline.to(promotedRow, {
                    height: targetBounds.height,
                    left: targetBounds.left,
                    top: targetBounds.top,
                    width: targetBounds.width,
                    duration: 0.34,
                    ease: 'power2.inOut',
                }, 0);
                timeline.to(promotedRow, { autoAlpha: 0, duration: 0.11, ease: 'power1.in' }, 0.23);
            }
        }

        for (const slot of ['icon', 'copy', 'value', 'action'] as const) {
            const previousElement = findMotionSlot(outgoingSnapshot, slot);
            const nextElement = findMotionSlot(incoming, slot);
            const isIcon = slot === 'icon';
            const sameGlyph = isIcon && previousElement?.dataset.islandGlyph === nextElement?.dataset.islandGlyph;
            const delay = isIcon ? 0 : slot === 'copy' ? 0.045 : 0.085;

            if (sameGlyph && previousElement && nextElement) {
                timeline.set(previousElement, { autoAlpha: 0 }, 0);
                timeline.set(nextElement, { autoAlpha: 1 }, 0);
                continue;
            }

            if (previousElement) {
                timeline.to(previousElement, {
                    autoAlpha: 0,
                    duration: isIcon ? 0.14 : 0.16,
                    ease: 'power1.in',
                    scale: isIcon ? 0.88 : 1,
                    y: isIcon ? 0 : -3,
                }, delay);
            }
            if (nextElement) {
                const iconStartX = isIcon && previousElement ? horizontalCenter(previousElement) - horizontalCenter(nextElement) : 0;
                timeline.fromTo(nextElement, {
                    autoAlpha: 0,
                    scale: isIcon ? 0.88 : 1,
                    x: iconStartX,
                    y: isIcon ? 0 : 4,
                }, {
                    autoAlpha: 1,
                    duration: isIcon ? 0.23 : 0.2,
                    ease: islandMotionEase,
                    scale: 1,
                    x: 0,
                    y: 0,
                }, delay + (isIcon ? 0.07 : 0.045));
            }
        }
        timeline.to(outgoingSnapshot, { autoAlpha: 0, duration: 0.1 }, 0.2);
    }, scope ?? undefined);

    return {
        revert: () => {
            context.revert();
            outgoingSnapshot.remove();
            controlsSnapshot?.remove();
            promotedRow?.remove();
        },
    };
}

export function animateSavedFocusExit(surface: HTMLDivElement, content: HTMLDivElement, scope: HTMLDivElement | null) {
    const copy = findMotionSlot(content, 'copy');
    const duration = findMotionSlot(content, 'value');

    return gsap.context(() => {
        const expandedWidth = surface.offsetWidth;
        const circleSize = surface.offsetHeight;
        const surfaceCenter = horizontalCenter(surface);
        const durationDestination = duration
            ? surfaceCenter - horizontalCenter(duration) - (expandedWidth - circleSize) / 2
            : 0;
        const timeline = gsap.timeline({ delay: 2 });
        if (copy) timeline.to(copy, { autoAlpha: 0, duration: 0.18, ease: 'power1.in', y: -3 }, 0);
        if (duration) {
            timeline.to(duration, { duration: 0.45, ease: 'power2.inOut', x: durationDestination }, 0);
            timeline.to(duration, { autoAlpha: 0, duration: 0.15, ease: 'power1.in' }, 0.28);
        }
        timeline.set(content, { width: expandedWidth - 16 }, 0);
        timeline.set(surface, {
            height: circleSize,
            overflow: 'hidden',
            width: expandedWidth,
        }, 0);
        timeline.to(surface, {
            borderRadius: circleSize / 2,
            width: circleSize,
            duration: 0.55,
            ease: 'power2.inOut',
        }, 0);
        timeline.to(surface, { autoAlpha: 0, scale: 0, duration: 0.32, ease: 'power2.in' });
    }, scope ?? undefined);
}
