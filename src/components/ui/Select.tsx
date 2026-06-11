"use client";

import { UseFormRegisterReturn } from "react-hook-form";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    options: SelectOption[];
    error?: string;
    registration: UseFormRegisterReturn;
    placeholder?: string;
}

export function Select({ label, options, error, registration, placeholder }: SelectProps) {
    const errorId = `${registration.name}-error`;
    return (
        <div>
            <label htmlFor={registration.name} className="block text-sm font-medium text-on-surface mb-1">
                {label}
            </label>
            <select
                id={registration.name}
                {...registration}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={`w-full px-3 py-2 border rounded bg-surface text-on-surface ${error ? "border-error" : "border-surface-container-high"}`}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && (
                <p id={errorId} className="text-xs text-error mt-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
