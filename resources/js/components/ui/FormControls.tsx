import { useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

import { classNames } from './classNames';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

interface SelectOption {
    label: string;
    value: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: SelectOption[];
    error?: string;
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    description?: string;
    error?: string;
}

const controlClasses =
    'focus-ring mt-2 min-h-11 w-full rounded-2xl border border-border-strong bg-app px-4 py-2.5 text-base text-foreground transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-muted hover:border-[color-mix(in_srgb,var(--module-accent)_32%,var(--border-strong))] focus:border-[var(--module-accent)] disabled:cursor-not-allowed disabled:bg-elevated disabled:text-muted';

function FieldLabel({ children, htmlFor }: { children: string; htmlFor: string }) {
    return (
        <label className="text-sm font-semibold text-secondary" htmlFor={htmlFor}>
            {children}
        </label>
    );
}

function FieldError({ error, id }: { error?: string; id: string }) {
    if (!error) {
        return null;
    }

    return (
        <p className="mt-2 text-sm font-medium text-danger" id={id} role="alert">
            {error}
        </p>
    );
}

export function Field({ label, error, className, id, ...props }: FieldProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
        <div>
            <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
            <input
                aria-describedby={error ? errorId : undefined}
                aria-invalid={Boolean(error)}
                className={classNames(controlClasses, error && 'border-danger', className)}
                id={inputId}
                {...props}
            />
            <FieldError error={error} id={errorId} />
        </div>
    );
}

export function SelectField({ label, options, error, className, id, ...props }: SelectFieldProps) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
        <div>
            <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
            <select
                aria-describedby={error ? errorId : undefined}
                aria-invalid={Boolean(error)}
                className={classNames(controlClasses, 'appearance-none', error && 'border-danger', className)}
                id={selectId}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <FieldError error={error} id={errorId} />
        </div>
    );
}

export function Checkbox({ label, description, error, className, id, ...props }: CheckboxProps) {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const errorId = `${checkboxId}-error`;

    return (
        <div>
            <label className="group flex cursor-pointer items-start gap-3" htmlFor={checkboxId}>
                <input
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={Boolean(error)}
                    className={classNames(
                        'focus-ring mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-md border border-border-strong bg-app transition-[background-color,border-color,box-shadow] duration-200 checked:border-[var(--module-accent)] checked:bg-[var(--module-accent)] checked:bg-[url("data:image/svg+xml,%3Csvg_viewBox=%270_0_16_16%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath_d=%27m3_8_3_3_7-7%27_fill=%27none%27_stroke=%27%23101506%27_stroke-linecap=%27round%27_stroke-linejoin=%27round%27_stroke-width=%272%27/%3E%3C/svg%3E")] disabled:cursor-not-allowed disabled:opacity-45',
                        error && 'border-danger',
                        className,
                    )}
                    id={checkboxId}
                    type="checkbox"
                    {...props}
                />
                <span>
                    <span className="block text-sm font-semibold text-foreground">{label}</span>
                    {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
                </span>
            </label>
            <FieldError error={error} id={errorId} />
        </div>
    );
}
