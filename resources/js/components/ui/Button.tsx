import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { classNames } from './classNames';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'small' | 'medium';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'accent-background border-transparent shadow-[0_8px_24px_color-mix(in_srgb,var(--module-accent)_12%,transparent)] hover:brightness-110 active:translate-y-px active:brightness-95',
    secondary:
        'border-border-strong bg-elevated text-foreground hover:border-[color-mix(in_srgb,var(--module-accent)_38%,var(--border-strong))] hover:bg-surface-hover active:translate-y-px',
    ghost: 'border-transparent bg-transparent text-secondary hover:bg-surface-hover hover:text-foreground active:translate-y-px',
    destructive: 'border-danger/50 bg-danger/12 text-danger hover:bg-danger/20 active:translate-y-px',
};

const sizeClasses: Record<ButtonSize, string> = {
    small: 'min-h-9 px-3.5 py-2 text-xs',
    medium: 'min-h-11 px-5 py-2.5 text-sm',
};

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    type = 'button',
    ...props
}: PropsWithChildren<ButtonProps>) {
    return (
        <button
            className={classNames(
                'focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-bold tracking-[0.08em] uppercase transition-[transform,background-color,border-color,color,filter,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-45',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth && 'w-full',
                className,
            )}
            type={type}
            {...props}
        >
            {children}
        </button>
    );
}
