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

function AccordionItem({
    item,
    onClose,
    depth,
}: {
    item: NavItem;
    onClose: () => void;
    depth: number;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const pathname = usePathname();
    const isActive =
        !item.disabled &&
        item.href &&
        (pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href)));

    const indentClass =
        depth === 0
            ? "px-4 py-4"
            : depth === 1
            ? "pl-12 pr-4 py-3"
            : depth === 2
            ? "pl-16 pr-4 py-2"
            : "pl-20 pr-4 py-2";

    const textClass =
        depth === 0
            ? "font-headline font-medium text-sm tracking-tight uppercase"
            : depth === 1
            ? "font-semibold text-xs tracking-wider uppercase"
            : depth === 2
            ? "font-bold text-xs uppercase"
            : "text-[10px] font-medium uppercase tracking-widest";

    return (
        <div>
            <div
                className={`w-full flex items-center justify-between ${indentClass} group`}
            >
                {item.href && !item.disabled ? (
                    <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={onClose}
                        className={`flex-1 transition-colors ${
                            isActive || isOpen
                                ? "text-primary-container"
                                : depth === 0
                                ? "text-white/90"
                                : "text-zinc-400 opacity-80 group-hover:text-primary-container group-hover:opacity-100"
                        } ${textClass}`}
                    >
                        {item.label}
                    </Link>
                ) : (
                    <span
                        className={`flex-1 ${textClass} ${
                            depth === 0 ? "text-white/90" : "text-zinc-500"
                        }`}
                    >
                        {item.label}
                    </span>
                )}

                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        className={`p-1 transition-transform ${
                            isOpen
                                ? "rotate-180 text-primary-container"
                                : "text-zinc-500"
                        }`}
                    >
                        <span
                            className={`material-symbols-outlined ${
                                depth === 0 ? "text-sm" : "text-xs"
                            }`}
                        >
                            expand_more
                        </span>
                    </button>
                )}
            </div>

            {hasChildren && isOpen && (
                <div
                    className={
                        depth < 2
                            ? "border-l-2 border-primary-container/20 ml-12 space-y-1"
                            : "space-y-1"
                    }
                >
                    {item.children!.map((child) => (
                        <AccordionItem
                            key={child.id}
                            item={child}
                            onClose={onClose}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MobileNav({
    navigation,
    isOpen,
    onClose,
}: MobileNavProps) {
    const { auth, logout } = useAuth();
    const pathname = usePathname();
    const [signingOut, setSigningOut] = useState(false);

    const allL1Items = navigation.map((group) => ({
        id: group.id,
        label: group.label,
        href: group.href,
        children: group.children,
        level: group.level,
    } as NavItem));

    function handleClose() {
        onClose();
    }

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={handleClose}
                    aria-hidden="true"
                />
            )}

            <aside
                id="mobile-nav-menu"
                className={`fixed top-0 left-0 h-full w-full max-w-[400px] z-50 overflow-hidden shadow-2xl shadow-black/50 transition-transform duration-300 ease-in-out bg-[#1a1a1a] flex flex-col ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between mb-10 px-6 pt-8">
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

                <nav className="flex-1 overflow-y-auto space-y-1 px-2">
                    {allL1Items.map((l1Item) => (
                        <AccordionItem
                            key={l1Item.id}
                            item={l1Item}
                            onClose={handleClose}
                            depth={0}
                        />
                    ))}
                </nav>

                <div className="mt-auto pt-8 px-6 pb-8 flex flex-col gap-3">
                    {auth.isLoggedIn ? (
                        <>
                            <Link
                                href="/account"
                                aria-current={
                                    pathname === "/account" ? "page" : undefined
                                }
                                onClick={handleClose}
                                className={`w-full py-4 font-headline font-bold text-xs tracking-widest uppercase text-center transition-colors ${
                                    pathname === "/account"
                                        ? "bg-white/20 text-white"
                                        : "bg-transparent border border-white/20 text-white hover:bg-white hover:text-black"
                                }`}
                            >
                                My Account
                            </Link>
                            <button
                                onClick={async () => {
                                    setSigningOut(true);
                                    await logout();
                                    handleClose();
                                }}
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
                                aria-current={
                                    pathname === "/login" ? "page" : undefined
                                }
                                onClick={handleClose}
                                className={`w-full py-4 font-headline font-bold text-xs tracking-widest uppercase text-center transition-colors ${
                                    pathname === "/login"
                                        ? "bg-white/20 text-white"
                                        : "bg-transparent border border-white/20 text-white hover:bg-white hover:text-black"
                                }`}
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                aria-current={
                                    pathname === "/register" ? "page" : undefined
                                }
                                onClick={handleClose}
                                className={`w-full py-4 font-headline font-bold text-xs tracking-widest uppercase text-center transition-colors ${
                                    pathname === "/register"
                                        ? "bg-primary/50 text-black"
                                        : "bg-primary text-on-primary hover:bg-primary"
                                }`}
                            >
                                Create Account
                            </Link>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}
