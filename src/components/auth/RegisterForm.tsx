"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function ConfirmationScreen({ email, onBack }: { email: string; onBack: () => void }) {
    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6 mx-auto">
                    <span className="material-symbols-outlined text-4xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-3">Check your email</h1>
                <p className="text-on-surface-variant max-w-md mb-2">
                    We sent a confirmation link to <strong className="text-on-surface">{email}</strong>
                </p>
                <p className="text-on-surface-variant text-sm mb-10">Click the link to activate your account, then sign in.</p>
                <div className="flex flex-col gap-3 items-center">
                    <Link href="/login" className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors">
                        Sign In
                    </Link>
                    <button onClick={onBack} className="text-sm text-primary-container font-bold hover:text-primary transition-colors">
                        Use a different email
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
    const { register } = useAuth();
    const router = useRouter();

    const passwordChecks = {
        minLength: password.length >= 6,
        hasMatch: confirmPassword.length > 0 && password === confirmPassword,
        hasMismatch: confirmPassword.length > 0 && password !== confirmPassword,
    };

    if (confirmedEmail) {
        return (
            <ConfirmationScreen
                email={confirmedEmail}
                onBack={() => setConfirmedEmail(null)}
            />
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setFieldErrors({});

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            setFieldErrors({ password: "Password must be at least 6 characters." });
            return;
        }

        if (password !== confirmPassword) {
            setFieldErrors({ confirmPassword: "Passwords do not match." });
            return;
        }

        setLoading(true);
        const result = await register(name, email, password);
        setLoading(false);

        if (result.error) {
            if (result.error.fields) {
                const errors: Record<string, string> = {};
                for (const f of result.error.fields) {
                    errors[f.field] = f.message;
                }
                setFieldErrors(errors);
            } else {
                setError(result.error.message);
            }
            return;
        }

        if (result.data.needsEmailConfirmation) {
            setConfirmedEmail(email);
            return;
        }

        router.push("/");
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center group-hover:bg-primary-container transition-colors">
                            <span className="text-on-primary font-black">A</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-on-surface">athletica</span>
                    </Link>
                    <h1 className="text-2xl font-black text-on-surface">Create your account</h1>
                    <p className="text-on-surface-variant mt-1 text-sm">Join Athletica and start shopping</p>
                </div>

                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8 border border-surface">
                    {error && (
                        <div className="mb-4 p-4 bg-error-container border border-error-container text-on-error-container text-sm rounded flex items-start gap-3">
                            <span className="material-symbols-outlined text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Smith"
                                className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary-container text-sm transition-colors"
                            />
                            {fieldErrors.name && (
                                <p className="text-xs text-error mt-1">{fieldErrors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary-container text-sm transition-colors"
                            />
                            {fieldErrors.email && (
                                <p className="text-xs text-error mt-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    className="w-full px-4 py-2.5 pr-10 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary-container text-sm transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                                    tabIndex={-1}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-xs text-error mt-1">{fieldErrors.password}</p>
                            )}
                            {password && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${passwordChecks.minLength ? "text-primary-container" : "text-on-surface-variant/50"}`}>
                                        {passwordChecks.minLength ? (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                6+ characters
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">radio_button_unchecked</span>
                                                6+ characters
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1.5">
                                Confirm password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    className="w-full px-4 py-2.5 pr-10 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary-container text-sm transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                                    tabIndex={-1}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {showConfirmPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="text-xs text-error mt-1.5">{fieldErrors.confirmPassword}</p>
                            )}
                            {!fieldErrors.confirmPassword && passwordChecks.hasMismatch && (
                                <p className="text-xs text-error mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                                    Passwords do not match
                                </p>
                            )}
                            {passwordChecks.hasMatch && (
                                <p className="text-xs text-primary-container mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    Passwords match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors ${loading
                                    ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                                    : "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-on-surface-variant">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary-container font-bold hover:text-primary transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-on-surface-variant/60 mt-6">
                    By creating an account you agree to our{" "}
                    <Link href="/privacy-policy" className="hover:text-on-surface underline">Privacy Policy</Link>
                    {" "}and{" "}
                    <Link href="/terms" className="hover:text-on-surface underline">Terms of Service</Link>
                </p>
            </div>
        </div>
    );
}
