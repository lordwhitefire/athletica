"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setFieldErrors({});

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        const result = await login(email, password);
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
                        <span className="text-2xl font-black tracking-tight text-on-surface">
                            athletica
                        </span>
                    </Link>
                    <h1 className="text-2xl font-black text-on-surface">Welcome back</h1>
                    <p className="text-on-surface-variant mt-1 text-sm">Sign in to your account</p>
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
                                    placeholder="••••••••"
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
                        </div>

                        <div className="flex items-center justify-end">
                            <Link href="/forgot-password" className="text-xs font-bold text-primary-container hover:text-primary transition-colors">
                                Forgot password?
                            </Link>
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
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-on-surface-variant">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-primary-container font-bold hover:text-primary transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-on-surface-variant/60 mt-6">
                    By signing in you agree to our{" "}
                    <Link href="/privacy-policy" className="hover:text-on-surface underline">Privacy Policy</Link>
                    {" "}and{" "}
                    <Link href="/terms" className="hover:text-on-surface underline">Terms of Service</Link>
                </p>
            </div>
        </div>
    );
}
