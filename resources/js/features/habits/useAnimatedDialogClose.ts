import { useRef, useState } from 'react';

export function useAnimatedDialogClose(onClose: () => void) {
    const [closing, setClosing] = useState(false);
    const closingRef = useRef(false);

    function requestClose() {
        if (closingRef.current) return;
        closingRef.current = true;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            onClose();
            return;
        }

        setClosing(true);
    }

    return { closing, requestClose, onExitComplete: onClose };
}
