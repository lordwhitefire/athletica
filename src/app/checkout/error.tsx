"use client";

import Link from "next/link";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function CheckoutError({ error, reset }: ErrorProps) {
    return (
        <div className="min-h-[70vh] bg-surface flex flex-col items-center justify-center text-center px-4 py-24">
            <div className="w-20 h-20 bg-error rounded-sm flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-on-error text-3xl">credit_card</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline text-on-surface tracking-tighter mb-4">
                Checkout temporarily unavailable
            </h1>
            <p className="text-on-surface-variant max-w-md mb-10">
                We couldn&apos;t process your checkout right now. Your cart is saved.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="px-8 py-3.5 bg-primary text-on-primary font-black rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                    Try Again
                </button>
                <Link
                    href="/cart"
                    className="px-8 py-3.5 border border-outline-variant text-on-surface font-bold rounded hover:border-primary hover:text-primary transition-colors"
                >
                    Back to Cart
                </Link>
            </div>
        </div>
    );
}
