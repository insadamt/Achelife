import { useEffect, useId, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import { X } from 'lucide-react';

import { Button } from './Button';
import { classNames } from './classNames';

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    placement?: 'center' | 'right' | 'right-card';
    size?: 'default' | 'large';
}

const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const openDialogStack: symbol[] = [];

export function Dialog({
    open,
    onClose,
    title,
    description,
    placement = 'center',
    size = 'default',
    children,
}: PropsWithChildren<DialogProps>) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const dialogKeyRef = useRef(Symbol('dialog'));
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (!open) {
            return;
        }

        const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dialog = dialogRef.current;
        const dialogKey = dialogKeyRef.current;
        const bodyOverflow = document.body.style.overflow;
        openDialogStack.push(dialogKey);
        document.body.style.overflow = 'hidden';

        window.requestAnimationFrame(() => {
            const preferredFocusTarget = dialog?.querySelector<HTMLElement>('[data-dialog-autofocus], [autofocus]');
            (preferredFocusTarget ?? dialog?.querySelector<HTMLElement>(focusableSelector))?.focus();
        });

        function handleKeyDown(event: KeyboardEvent) {
            if (openDialogStack.at(-1) !== dialogKey) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialog) {
                return;
            }

            const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
            const firstElement = focusableElements[0];
            const lastElement = focusableElements.at(-1);

            if (!firstElement || !lastElement) {
                event.preventDefault();
                return;
            }

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            const dialogIndex = openDialogStack.lastIndexOf(dialogKey);
            if (dialogIndex >= 0) {
                openDialogStack.splice(dialogIndex, 1);
            }
            document.body.style.overflow = bodyOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedElement?.focus();
        };
    }, [onClose, open]);

    if (!open) {
        return null;
    }

    return (
        <div
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            aria-modal="true"
            className={classNames(
                'fixed inset-0 z-50 flex bg-black/72 backdrop-blur-[2px]',
                placement === 'center'
                    ? 'items-center justify-center p-4'
                    : placement === 'right-card'
                        ? 'justify-end sm:items-center sm:p-4'
                        : 'justify-end',
            )}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
            role="dialog"
        >
            <div
                className={classNames(
                    'border border-border-strong bg-elevated shadow-2xl transition-[width] duration-300',
                    placement === 'center'
                        ? classNames(
                            'w-full rounded-[var(--radius-panel)] p-5 sm:p-6',
                            size === 'large'
                                ? 'max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto'
                                : 'max-w-md',
                        )
                        : placement === 'right-card'
                            ? 'h-full w-[min(94vw,30rem)] overflow-y-auto border-y-0 border-r-0 p-5 sm:h-[min(92vh,54rem)] sm:rounded-[var(--radius-panel)] sm:border'
                            : classNames(
                                'h-full overflow-y-auto border-y-0 border-r-0 p-5',
                                size === 'large' ? 'w-[min(96vw,60rem)]' : 'w-[min(94vw,28rem)]',
                            ),
                )}
                ref={dialogRef}
            >
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold tracking-[-0.02em] text-foreground" id={titleId}>
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-1 text-sm leading-6 text-secondary" id={descriptionId}>
                                {description}
                            </p>
                        )}
                    </div>
                    <Button aria-label="Close" className="-mr-2 -mt-2 size-10 px-0" onClick={onClose} variant="ghost">
                        <X aria-hidden="true" size={19} />
                    </Button>
                </div>
                <div className="mt-6">{children}</div>
            </div>
        </div>
    );
}
