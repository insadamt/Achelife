export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

interface NavigationAnimationOptions {
    container: HTMLElement;
    elements: HTMLElement[];
    direction: NavigationDirection;
}

export function animateNavigationContent({ container, elements, direction }: NavigationAnimationOptions): () => void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || elements.length === 0) return () => {};

    const vertical = direction === 'up' || direction === 'down';
    const distance = (direction === 'down' || direction === 'right' ? -1 : 1) * (vertical ? 32 : 24);
    const transform = `translate${vertical ? 'Y' : 'X'}(${distance}px)`;
    const animations: Animation[] = [];
    let finished = false;

    function finish() {
        if (finished) return;
        finished = true;
        reducedMotion.removeEventListener('change', finish);
        animations.forEach((animation) => animation.cancel());
        container.classList.remove('navigation-transition-active');
    }

    container.classList.add('navigation-transition-active');
    for (const element of elements) {
        animations.push(element.animate([{ transform }, { transform: 'translate(0, 0)' }], {
            duration: vertical ? 180 : 160,
            easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
        }));
    }

    reducedMotion.addEventListener('change', finish);
    void Promise.all(animations.map((animation) => animation.finished)).then(finish, finish);
    return finish;
}
