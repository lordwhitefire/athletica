"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { NavigationData } from "@/types/navigation";
import MainNav from "@/components/navigation/MainNav";
import MobileNav from "@/components/navigation/MobileNav";
import MiniCart from "@/components/cart/MiniCart";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
    navigation: NavigationData[];
    siteLogoUrl?: string | null;
}

export default function Header({ navigation, siteLogoUrl }: HeaderProps) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { cart } = useCart();
    const { auth, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const q = searchQuery.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    }

    return (
        <>
            <header className="w-full bg-black sticky top-0 z-30 border-b border-zinc-800">

                {/* ── ROW 1 — Search + Icons — ALL screen sizes ── */}
                <div className="flex items-center justify-between w-full px-4 md:px-8 py-3 gap-3">
                    <form onSubmit={handleSearch} className="w-full max-w-[220px] sm:max-w-[220px] md:flex-1 md:max-w-md lg:max-w-2xl">
                        <div className="flex items-center w-full h-[42px] bg-zinc-800 border border-zinc-700 rounded-lg focus-within:border-primary-container transition-colors gap-2">
                            <svg
                                aria-hidden="true"
                                className="text-zinc-500 w-5 h-5 flex-shrink-0 ml-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search elite performance gear..."
                                className="flex-1 bg-transparent border-none outline-none py-2 pr-3 text-sm text-zinc-300 placeholder-zinc-500"
                            />
                        </div>
                    </form>
                    {/* Group 2 — icons (wrapped together) */}
                    <div className="flex items-center gap-2">

                        {/* Account icon */}
                        {auth.isLoggedIn ? (
                            <Link
                                href="/account"
                                className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-full text-sm font-bold hover:opacity-90 transition-opacity flex-shrink-0"
                                aria-label="My Account"
                            >
                                {auth.user?.name?.charAt(0)?.toUpperCase()}
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-primary-container transition-colors flex-shrink-0"
                                aria-label="Login"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </Link>
                        )}

                        {/* Cart icon */}
                        <button
                            onClick={() => setIsMiniCartOpen(true)}
                            aria-expanded={isMiniCartOpen}
                            aria-controls="mini-cart"
                            data-testid="cart-icon"
                            className="relative w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-primary-container transition-colors flex-shrink-0"
                            aria-label="Open cart"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            {cart.totalItems > 0 && (
                                <span data-testid="cart-count" className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-on-primary text-xs font-bold rounded-full flex items-center justify-center leading-none">
                                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                                </span>
                            )}
                        </button>
                    </div>

                </div>

                {/* ── ROW 2 MOBILE/TABLET — Logo left + Hamburger right — < xl ── */}
                <div className="flex xl:hidden items-center justify-between -ml-8 px-4 md:px-8 py-2 border-t border-zinc-800">
                    <Link href="/" className="flex items-center">
                        {siteLogoUrl ? (
                            <Image src={siteLogoUrl} alt="Athletica" width={240} height={100} className="w-[240px] h-[100px] object-cover " />
                        ) : (
                            <>
                                <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-sm">
                                    <span className="text-white font-black text-lg">A</span>
                                </div>
                                <span className="text-xl font-black tracking-tight text-white ml-2">athletica</span>
                            </>
                        )}
                    </Link>
                    <button
                        onClick={() => setIsMobileNavOpen(true)}
                        aria-expanded={isMobileNavOpen}
                        aria-controls="mobile-nav-menu"
                        className="flex items-center justify-center w-10 h-10 text-zinc-300 hover:text-primary-container transition-colors flex-shrink-0"
                        aria-label="Open menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>
                </div>

                {/* ── ROW 2 DESKTOP — Logo + MainNav megamenu — xl+ ── */}
                <div className="hidden xl:flex items-center -ml-12 px-8 py-4 border-t border-zinc-800 relative">
                    <div className="flex items-center gap-12">
                        <Link href="/" className="flex items-center flex-shrink-0 z-10">
                            {siteLogoUrl ? (
                                <Image src={siteLogoUrl} alt="Athletica" width={240} height={100} className="w-[240px] h-[100px] object-cover border-r border-zinc-800 pl-6 " />
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-sm">
                                        <span className="text-white font-black text-xl">A</span>
                                    </div>
                                    <span className="text-2xl font-black tracking-tight text-white ml-2">athletica</span>
                                </>
                            )}
                        </Link>
                        <MainNav navigation={navigation} />
                    </div>
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
