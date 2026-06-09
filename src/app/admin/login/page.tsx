"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/lib/actions/admin-auth";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setFieldErrors({});
        setLoading(true);

        const result = await adminLogin(email, password);

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
            setLoading(false);
            return;
        }

        router.push("/admin");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
            <div className="w-full max-w-md p-8">
                <div className="text-center mb-10">
                    <div className="bg-zinc-900 text-white w-fit px-3 py-1.5 mx-auto mb-4">
                        <span className="text-lg font-black italic tracking-tighter">AT</span>
                    </div>
                    <h1 className="text-white text-2xl font-black uppercase tracking-tight">Admin Login</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-zinc-400 text-sm font-medium mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-red-600 transition-colors"
                            placeholder="admin@example.com"
                        />
                        {fieldErrors.email && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-sm font-medium mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-white rounded focus:outline-none focus:border-red-600 transition-colors"
                        />
                        {fieldErrors.password && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded transition-colors uppercase tracking-wider text-sm"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
