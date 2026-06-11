"use client";

import Link from "next/link";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function SearchError({ error, reset }: ErrorProps) {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-24">
            <h1 className="text-2xl font-black mb-2">Search error</h1>
            <p className="text-on-surface-variant max-w-md mb-6">
                {process.env.NODE_ENV === "development"
                    ? error.message
                    : "Something went wrong while searching. Please try again."}
            </p>
            <div className="flex gap-4">
                <button onClick={reset} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded">
                    Try Again
                </button>
                <Link href="/" className="px-6 py-2.5 border border-outline-variant text-on-surface font-bold rounded">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
