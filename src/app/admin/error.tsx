"use client";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center px-4 py-24">
            <div className="w-20 h-20 bg-error rounded-sm flex items-center justify-center mb-8">
                <span className="text-on-error text-3xl font-black">!</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
                Something went wrong
            </h1>
            <p className="text-zinc-400 max-w-md mb-10">
                An error occurred in the admin panel. Please try again.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="px-8 py-3.5 bg-red-600 text-white font-black rounded hover:bg-red-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
