"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AccountPage() {
    const { auth, logout } = useAuth();

    if (!auth.isLoggedIn) {
        return (
            <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-3">My Account</h1>
                <p className="text-on-surface-variant max-w-md mb-8">Sign in to view your account details and order history.</p>
                <Link href="/login" className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors">
                    Sign In
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] bg-surface">
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-3xl font-black font-headline text-on-surface">My Account</h1>
                    <button
                        onClick={logout}
                        className="text-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        Sign Out
                    </button>
                </div>

                <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface mb-6">
                    <h2 className="font-bold text-on-surface text-lg mb-4">Account Details</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-surface">
                            <span className="text-on-surface-variant text-sm">Name</span>
                            <span className="font-medium text-on-surface text-sm">{auth.user?.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-surface">
                            <span className="text-on-surface-variant text-sm">Email</span>
                            <span className="font-medium text-on-surface text-sm">{auth.user?.email}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-on-surface-variant text-sm">Member since</span>
                            <span className="font-medium text-on-surface text-sm">
                                {auth.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString() : "—"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface">
                    <h2 className="font-bold text-on-surface text-lg mb-4">Recent Orders</h2>
                    <p className="text-on-surface-variant text-sm">No orders yet. Start shopping to see your order history here.</p>
                    <Link href="/football-boots" className="inline-block mt-4 px-6 py-2.5 bg-primary text-on-primary font-bold rounded text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors">
                        Shop Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
