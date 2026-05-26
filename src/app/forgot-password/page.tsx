"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!email) return;

        setLoading(true);
        const supabase = createClient();
        const { error: resetError } =
            await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
        setLoading(false);

        if (resetError) {
            setError(resetError.message);
            return;
        }

        setSent(true);
    }

    if (sent) {
        return (
            <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
                    <span
                        className="material-symbols-outlined text-4xl text-on-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        mail
                    </span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-3">
                    Check your email
                </h1>
                <p className="text-on-surface-variant max-w-md mb-2">
                    We sent a password reset link to{" "}
                    <strong className="text-on-surface">{email}</strong>
                </p>
                <p className="text-on-surface-variant text-sm mb-10">
                    If you don&apos;t see it, check your spam folder.
                </p>
                <Link
                    href="/login"
                    className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                    Back to Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 mb-6 group"
                    >
                        <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center group-hover:bg-primary-container transition-colors">
                            <span className="text-on-primary font-black">A</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-on-surface">
                            athletica
                        </span>
                    </Link>
                    <h1 className="text-2xl font-black text-on-surface">
                        Forgot password?
                    </h1>
                    <p className="text-on-surface-variant mt-1 text-sm">
                        Enter your email and we&apos;ll send you a reset link.
                    </p>
                </div>

                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8 border border-surface">
                    {error && (
                        <div className="mb-4 p-4 bg-error-container border border-error-container text-on-error-container text-sm rounded flex items-start gap-3">
                            <span
                                className="material-symbols-outlined text-[18px] mt-0.5"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                error
                            </span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 font-bold rounded flex items-center justify-center gap-2 transition-colors ${
                                loading
                                    ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                                    : "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="text-sm text-primary font-bold hover:text-primary-container transition-colors"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
