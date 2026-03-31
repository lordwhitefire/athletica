"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            setError(result.error || "Invalid email or password.");
            return;
        }

        router.push("/");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-green-500 rounded-sm flex items-center justify-center">
                            <span className="text-white font-black">A</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-gray-900">athletica</span>
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
                    <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded focus:outline-none focus:border-green-500 text-sm transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded focus:outline-none focus:border-green-500 text-sm transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded font-bold text-sm transition-colors ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-600"}`}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link href="/register" className="text-green-500 font-bold hover:text-green-600 transition-colors">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    By signing in you agree to our{" "}
                    <Link href="/privacy" className="hover:text-gray-600 underline">Privacy Policy</Link>
                    {" "}and{" "}
                    <Link href="/terms" className="hover:text-gray-600 underline">Terms of Service</Link>
                </p>
            </div>
        </div>
    );
}