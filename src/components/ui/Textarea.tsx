"use client";

import { UseFormRegisterReturn } from "react-hook-form";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    registration: UseFormRegisterReturn;
}

export function Textarea({ label, error, registration, rows = 3, placeholder, ...props }: TextareaProps) {
    const errorId = `${registration.name}-error`;
    return (
        <div>
            <label htmlFor={registration.name} className="block text-sm font-medium text-on-surface mb-1">
                {label}
            </label>
            <textarea
                id={registration.name}
                {...registration}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                rows={rows}
                placeholder={placeholder}
                className={`w-full px-3 py-2 border rounded bg-surface text-on-surface ${error ? "border-error" : "border-surface-container-high"} focus:outline-none focus:ring-2 focus:ring-primary`}
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
