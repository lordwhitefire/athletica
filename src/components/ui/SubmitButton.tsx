"use client";

import { useFormContext } from "react-hook-form";

interface SubmitButtonProps {
    label: string;
    loading?: boolean;
}

export function SubmitButton({ label, loading }: SubmitButtonProps) {
    const { formState } = useFormContext();
    const isSubmitting = loading || formState.isSubmitting;

    return (
        <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-primary text-on-primary font-bold rounded hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Processing...
                </span>
            ) : (
                label
            )}
        </button>
    );
}
