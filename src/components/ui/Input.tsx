"use client";

import { UseFormRegisterReturn } from "react-hook-form";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    registration: UseFormRegisterReturn;
}

export function Input({ label, error, registration, className = "", ...props }: InputProps) {
    const errorId = `${registration.name}-error`;
    return (
        <div>
            <label htmlFor={registration.name} className="block text-sm font-medium text-on-surface mb-1">
                {label}
            </label>
            <input
                id={registration.name}
                {...registration}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={`w-full px-3 py-2 border rounded bg-surface text-on-surface ${error ? "border-error" : "border-surface-container-high"} focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
                {...props}
            />
            {error && (
                <p id={errorId} className="text-xs text-error mt-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
