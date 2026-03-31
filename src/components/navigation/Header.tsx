"use client";

import { useState } from "react";
import Link from "next/link";
import { NavigationData } from "@/types/navigation";
import MainNav from "@/components/navigation/MainNav";
import MobileNav from "@/components/navigation/MobileNav";
import MiniCart from "@/components/cart/MiniCart";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
    navigation: NavigationData[];
}

export default function Header({ navigation }: HeaderProps) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
    const { cart } = useCart();
    const { auth, logout } = useAuth();

    return (
        <>
            <header className="w-full bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">

                {/* ── DESKTOP TOP BAR ── */}
                <div className="hidden lg:flex items-center w-full h-14 px-6 gap-4">

                    {/* Logo — left, shrinks to fit */}
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0 ">
                        <div className="w-8 h-8 bg-red-600 flex items-center justify-center rounded-sm">
                            <span className="text-white font-black text-sm">A</span>
                        </div>
                        <span className="text-xl font-black tracking-tight text-black">
                            athletica
                        </span>
                    </Link>

                    {/* Search bar — middle, fills all remaining space */}
                    <div className="hidden lg:flex flex-1 justify-center">
                        <div className="flex items-center max-w-xl w-full h-[40px]  bg-gray-50 border border-gray-200 rounded focus-within:border-red-500 transition-colors gap-2">
                            <svg
                                className="text-gray-400 w-4 h-4 flex-shrink-0 relative left-[20px]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                type="search"
                                placeholder="Search elite performance gear..."
                                className="flex-1 relative left-[20px] bg-transparent border-none outline-none py-2 pl-3 text-sm text-gray-700 placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Icons — right, shrinks to fit */}
                    <div className="flex items-center gap-2 flex-shrink-0 ">
                        {auth.isLoggedIn ? (
                            <>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium leading-none">Member</p>
                                    <p className="text-sm font-bold text-black leading-tight mt-0.5">
                                        Hi, {auth.user?.name.split(" ")[0]}
                                    </p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                                    aria-label="Logout"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                                aria-label="Login"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </Link>
                        )}

                        <button
                            onClick={() => setIsMiniCartOpen(true)}
                            className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                            aria-label="Open cart"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            {cart.totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── MOBILE/TABLET TOP BAR ── */}
                <div className="flex lg:hidden items-center w-full h-14 px-4">

                    {/* Left — hamburger + logo */}
                    <button
                        onClick={() => setIsMobileNavOpen(true)}
                        className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-red-600 transition-colors flex-shrink-0 mr-2"
                        aria-label="Open menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect y="3" width="20" height="2" rx="1" fill="currentColor" />
                            <rect y="9" width="20" height="2" rx="1" fill="currentColor" />
                            <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
                        </svg>
                    </button>

                    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 bg-red-600 flex items-center justify-center rounded-sm">
                            <span className="text-white font-black text-sm">A</span>
                        </div>
                        <span className="text-lg font-black tracking-tight text-black">
                            athletica
                        </span>
                    </Link>

                    {/* Spacer — pushes icons to the right */}
                    <div className="flex-1" />

                    {/* Right — account + cart */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                            href={auth.isLoggedIn ? "/" : "/login"}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                            aria-label="Account"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </Link>

                        <button
                            onClick={() => setIsMiniCartOpen(true)}
                            className="relative w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 transition-colors"
                            aria-label="Open cart"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            {cart.totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── MOBILE SEARCH BAR — second row ── */}
                <div className="flex lg:hidden w-full px-4 pb-2">
                    <div className="relative w-full">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <input
                            type="search"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                        />
                    </div>
                </div>

                {/* ── NAV BAR — desktop only ── */}
                <div className="hidden lg:block w-full border-t border-gray-100">
                    <MainNav navigation={navigation} />
                </div>
            </header>

            <MobileNav
                navigation={navigation}
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
            />

            <MiniCart
                isOpen={isMiniCartOpen}
                onClose={() => setIsMiniCartOpen(false)}
            />
        </>
    );
}