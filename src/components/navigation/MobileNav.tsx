"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationData, NavItem } from "@/types/navigation";
import { useAuth } from "@/context/AuthContext";

interface MobileNavProps {
    navigation: NavigationData[];
    isOpen: boolean;
    onClose: () => void;
}

function L4Item({ l4Item, onClose }: { l4Item: NavItem; onClose: () => void }) {
    const pathname = usePathname();
    const isActive = !l4Item.disabled && l4Item.href && (
        pathname === l4Item.href ||
        (l4Item.href !== "/" && pathname.startsWith(l4Item.href))
    );
    return (
        <div className="pl-4 mt-2 space-y-2 border-l border-zinc-700">
            {l4Item.href && !l4Item.disabled ? (
                <Link
                    href={l4Item.href || "#"}
                    aria-current={isActive ? "page" : undefined}
                    onClick={onClose}
                    className={`block text-[10px] font-medium uppercase tracking-widest py-1 transition-colors ${isActive ? "text-primary-container" : "text-zinc-400 hover:text-primary-container"}`}
                >
                    {l4Item.label}
                </Link>
            ) : (
                <span className="block text-[10px] font-medium text-zinc-400 uppercase tracking-widest py-1">
                    {l4Item.label}
                </span>
            )}
        </div>
    );
}

function L3Item({ l3Item, onClose }: { l3Item: NavItem; onClose: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = l3Item.children && l3Item.children.length > 0;
    const pathname = usePathname();
    const isActive = !l3Item.disabled && l3Item.href && (
        pathname === l3Item.href ||
        (l3Item.href !== "/" && pathname.startsWith(l3Item.href))
    );

    return (
        <div className="relative">
            <div className="flex items-center justify-between py-1 group">
                {l3Item.href && !l3Item.disabled ? (
                    <Link
                        href={l3Item.href || "#"}
                        aria-current={isActive ? "page" : undefined}
                        onClick={onClose}
                        className={`flex-1 font-bold text-xs uppercase transition-colors ${isActive || isOpen ? "text-primary-container" : "text-on-surface hover:text-primary-container"}`}
                    >
                        {l3Item.label}
                    </Link>
                ) : (
                    <span className="flex-1 font-bold text-xs uppercase text-on-surface opacity-50">
                        {l3Item.label}
                    </span>
                )}

                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        className={`p-1 transition-transform ${isOpen ? "rotate-180 text-primary-container" : "text-zinc-500"}`}
                    >
                        <span className="material-symbols-outlined text-xs">expand_more</span>
                    </button>
                )}
            </div>

            {hasChildren && isOpen && (
                <div className="mt-1">
                    {l3Item.children!.map((l4) => (
                        <L4Item key={l4.id} l4Item={l4} onClose={onClose} />
                    ))}
                </div>
            )}
        </div>
    );
}

function L2Item({ l2Item, onClose }: { l2Item: NavItem; onClose: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = l2Item.children && l2Item.children.length > 0;
    const pathname = usePathname();
    const isActive = !l2Item.disabled && l2Item.href && (
        pathname === l2Item.href ||
        (l2Item.href !== "/" && pathname.startsWith(l2Item.href))
    );

    return (
        <div className="mt-2">
            <div className={`w-full flex items-center justify-between pl-12 pr-4 py-3 group`}>
                {l2Item.href && !l2Item.disabled ? (
                    <Link
                        href={l2Item.href || "#"}
                        aria-current={isActive ? "page" : undefined}
                        onClick={onClose}
                        className={`flex-1 font-semibold text-xs tracking-wider uppercase transition-colors ${isActive || isOpen ? "text-primary-container" : "text-zinc-400 opacity-80 group-hover:text-primary-container group-hover:opacity-100"}`}
                    >
                        {l2Item.label}
                    </Link>
                ) : (
                    <span className="flex-1 font-semibold text-xs tracking-wider uppercase text-zinc-500">
                        {l2Item.label}
                    </span>
                )}

                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        className={`p-1 transition-transform ${isOpen ? "rotate-180 text-primary-container" : "text-zinc-500"}`}
                    >
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                )}
            </div>

            {hasChildren && isOpen && (
                <div className="pl-16 space-y-3 mt-2 border-l-2 border-primary-container/20 ml-12">
                    {l2Item.children!.map((l3) => (
                        <L3Item key={l3.id} l3Item={l3} onClose={onClose} />
                    ))}
                </div>
            )}
        </div>
    );
}

function SubMenuPanel({
    item,
    onBack,
    onClose,
    isLoggedIn,
    logout,
}: {
    item: NavItem;
    onBack: () => void;
    onClose: () => void;
    isLoggedIn: boolean;
    logout: () => void;
}) {
    const [signingOut, setSigningOut] = useState(false);
    const pathname = usePathname();

    function navActive(href: string): boolean {
        return pathname === href || (href !== "/" && pathname.startsWith(href));
    }

    return (
        <div className="absolute w-full inset-0 bg-zinc-900 flex flex-col">

            {/* ── Header ── */}
            <div className="flex justify-between items-center py-8 px-6">
                <h2 className="text-xl font-black text-primary-container font-headline tracking-widest uppercase">
                    THE GALLERY
                </h2>
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-surface-container-low transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* ── Scrollable canvas ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-4 space-y-1">

                {/* Elite Performance — above grey card */}
                <Link
                    href="/shop?collection=elite"
                    aria-current={navActive("/shop?collection=elite") ? "page" : undefined}
                    onClick={onClose}
                    className={`flex items-center gap-3 p-4 font-headline font-medium text-sm tracking-tight uppercase hover:pl-6 transition-all duration-300 cursor-pointer ${navActive("/shop?collection=elite") ? "text-primary-container" : "text-zinc-300"}`}
                >
                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                    <span>Elite Performance</span>
                </Link>

                {/* ── Active L1 grey card ── */}
                <div className="bg-surface-container-low rounded-lg">
                    {/* L1 header */}
                    <Link
                        href={item.href || "#"}
                        aria-current={navActive(item.href || "#") ? "page" : undefined}
                        onClick={onClose}
                        className="w-full flex items-center justify-between p-4 text-primary-container font-headline font-bold text-sm tracking-tight uppercase group"
                    >
                        <div className="flex items-center gap-3 group-hover:pl-2 transition-all">
                            <span className="material-symbols-outlined text-lg">sports_soccer</span>
                            <span>{item.label}</span>
                        </div>
                        <span className="material-symbols-outlined -rotate-90 group-hover:translate-x-1 opacity-50 group-hover:opacity-100 transition-all text-xs">
                            arrow_forward
                        </span>
                    </Link>

                    {/* L2 children */}
                    <div className="pb-3 border-t border-primary/5">
                        {(item.children || []).map((l2) => (
                            <L2Item key={l2.id} l2Item={l2} onClose={onClose} />
                        ))}
                    </div>
                </div>

                {/* Training Gear — below grey card */}
                <Link
                    href="/shop?category=training"
                    aria-current={navActive("/shop?category=training") ? "page" : undefined}
                    onClick={onClose}
                    className={`flex items-center gap-3 p-4 font-headline font-medium text-sm tracking-tight uppercase hover:pl-6 transition-all duration-300 cursor-pointer ${navActive("/shop?category=training") ? "text-primary-container" : "text-zinc-300"}`}
                >
                    <span className="material-symbols-outlined text-lg">fitness_center</span>
                    <span>Training Gear</span>
                </Link>

                {/* Fan Zone — below grey card */}
                <Link
                    href="/shop?collection=fan"
                    aria-current={navActive("/shop?collection=fan") ? "page" : undefined}
                    onClick={onClose}
                    className={`flex items-center gap-3 p-4 font-headline font-medium text-sm tracking-tight uppercase hover:pl-6 transition-all duration-300 cursor-pointer ${navActive("/shop?collection=fan") ? "text-primary-container" : "text-zinc-300"}`}
                >
                    <span className="material-symbols-outlined text-lg">groups</span>
                    <span>Fan Zone</span>
                </Link>
            </div>

            {/* ── Sticky footer ── */}
            <div className="absolute bottom-0 left-0 w-full p-6 bg-zinc-900 border-t border-zinc-800 flex gap-4">
                {isLoggedIn ? (
                    <button
                        onClick={async () => { setSigningOut(true); await logout(); onClose(); }}
                        disabled={signingOut}
                        className="flex-1 bg-surface-container-highest text-on-surface h-12 text-[10px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 duration-150 transition-transform disabled:opacity-50"
                    >
                        {signingOut ? "Signing Out..." : "Sign Out"}
                    </button>
                ) : (
                    <Link
                        href="/login"
                        aria-current={navActive("/login") ? "page" : undefined}
                        onClick={onClose}
                        className={`flex-1 h-12 text-[10px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 duration-150 transition-transform ${navActive("/login") ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface"}`}
                    >
                        Sign In
                    </Link>
                )}
                <Link
                    href="/shop"
                    aria-current={navActive("/shop") ? "page" : undefined}
                    onClick={onClose}
                    className={`flex-1 h-12 text-[10px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 duration-150 transition-transform ${navActive("/shop") ? "bg-surface-container-highest text-primary shadow-xl shadow-primary/20" : "bg-primary text-on-primary shadow-xl shadow-primary/20"}`}
                >
                    Shop All
                </Link>
            </div>
        </div>
    );
}

export default function MobileNav({ navigation, isOpen, onClose }: MobileNavProps) {
    const { auth, logout } = useAuth();
    const pathname = usePathname();
    const [activeL1, setActiveL1] = useState<NavItem | null>(null);
    const [signingOut, setSigningOut] = useState(false);
    const allL1Items = navigation.flatMap((group) => group.children || []);

    function handleClose() {
        setActiveL1(null);
        onClose();
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={handleClose}
                    aria-hidden="true"
                />
            )}

            {/* Drawer shell */}
            <aside
                id="mobile-nav-menu"
                className={`fixed top-0 left-0 h-full w-full max-w-[400px] z-50 overflow-hidden shadow-2xl shadow-black/50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* ── SCREEN 1 — Main menu (dark) ── */}
                <div
                    className={`absolute inset-0 bg-[#1a1a1a] flex flex-col py-8 px-4 transition-transform duration-300 ease-in-out ${activeL1 ? "-translate-x-full" : "translate-x-0"
                        }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-10 px-2">
                        <Link href="/" onClick={handleClose}>
                            <span className="text-xl font-black text-white font-headline tracking-widest uppercase">
                                athletica
                            </span>
                        </Link>
                        <button
                            onClick={handleClose}
                            className="p-2 text-white/70 hover:text-white transition-colors text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Level 1 items */}
                    <nav className="flex-1 overflow-y-auto space-y-1 pr-2">
                        {allL1Items.map((l1Item) => (
                            <div key={l1Item.id}>
                                <button
                                    className="w-full flex items-center justify-between py-4 px-2 text-white/90 hover:pl-4 transition-all duration-300 ease-in-out group"
                                    onClick={() => setActiveL1(l1Item)}
                                >
                                    <span className="font-headline font-medium text-sm tracking-tight uppercase">
                                        {l1Item.label}
                                    </span>
                                    <span className="text-white/30 group-hover:text-white text-xl font-light transition-colors">
                                        +
                                    </span>
                                </button>
                                <div className="h-px bg-white/5 mx-2" />
                            </div>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="mt-auto pt-8 flex flex-col gap-3">
                        {auth.isLoggedIn ? (
                            <>
                                <Link
                                    href="/account"
                                    aria-current={pathname === "/account" ? "page" : undefined}
                                    onClick={handleClose}
                                    className={`w-full py-4 font-headline font-bold text-xs tracking-widest uppercase text-center transition-colors ${pathname === "/account" ? "bg-white/20 text-white" : "bg-transparent border border-white/20 text-white hover:bg-white hover:text-black"}`}
                                >
                                    My Account
                                </Link>
                                <button
                                    onClick={async () => { setSigningOut(true); await logout(); handleClose(); }}
                                    disabled={signingOut}
                                    className="w-full py-4 bg-primary text-on-primary font-headline font-bold text-xs tracking-widest uppercase hover:bg-primary disabled:opacity-50 transition-colors text-center"
                                >
                                    {signingOut ? "Signing Out..." : "Sign Out"}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    aria-current={pathname === "/login" ? "page" : undefined}
                                    onClick={handleClose}
                                    className={`w-full py-4 font-headline font-bold text-xs tracking-widest uppercase text-center transition-colors ${pathname === "/login" ? "bg-white/20 text-white" : "bg-transparent border border-white/20 text-white hover:bg-white hover:text-black"}`}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    aria-current={pathname === "/register" ? "page" : undefined}
                                    onClick={handleClose}
                                    className={`w-full py-4 font-headline font-bold text-xs tracking-widest uppercase text-center transition-colors ${pathname === "/register" ? "bg-primary/50 text-black" : "bg-primary text-on-primary hover:bg-primary"}`}
                                >
                                    Create Account
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* ── SCREEN 2 — Submenu (light) ── */}
                <div
                    className={`absolute inset-0 transition-transform duration-300 ease-in-out ${activeL1 ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    {activeL1 && (
                        <SubMenuPanel
                            item={activeL1}
                            onBack={() => setActiveL1(null)}
                            onClose={handleClose}
                            isLoggedIn={auth.isLoggedIn}
                            logout={logout}
                        />
                    )}
                </div>
            </aside>
        </>
    );
}