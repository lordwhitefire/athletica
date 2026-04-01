"use client";

import { useState } from "react";
import Link from "next/link";
import { NavigationData, NavItem } from "@/types/navigation";

interface MobileNavProps {
    navigation: NavigationData[];
    isOpen: boolean;
    onClose: () => void;
}

function L4Item({ l4Item, onClose }: { l4Item: NavItem; onClose: () => void }) {
    return (
        <div className="pl-4 mt-2 space-y-2 border-l border-neutral-300">
            {l4Item.href && !l4Item.disabled ? (
                <Link
                    href={l4Item.href ?? undefined}
                    onClick={onClose}
                    className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest hover:text-primary py-1 transition-colors"
                >
                    {l4Item.label}
                </Link>
            ) : (
                <span className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest py-1">
                    {l4Item.label}
                </span>
            )}
        </div>
    );
}

function L3Item({ l3Item, onClose }: { l3Item: NavItem; onClose: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = l3Item.children && l3Item.children.length > 0;

    return (
        <div className="relative">
            <div className="flex items-center justify-between py-1 group">
                {l3Item.href && !l3Item.disabled ? (
                    <Link
                        href={l3Item.href ?? undefined}
                        onClick={onClose}
                        className={`flex-1 font-bold text-xs uppercase transition-colors ${isOpen ? "text-primary" : "text-on-surface hover:text-primary"}`}
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
                        className={`p-1 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-neutral-400"}`}
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

    return (
        <div className="mt-2">
            <div className={`w-full flex items-center justify-between pl-12 pr-4 py-3 group`}>
                {l2Item.href && !l2Item.disabled ? (
                    <Link
                        href={l2Item.href ?? undefined}
                        onClick={onClose}
                        className={`flex-1 font-semibold text-xs tracking-wider uppercase transition-colors ${isOpen ? "text-on-surface" : "text-neutral-500 opacity-80 group-hover:text-primary group-hover:opacity-100"}`}
                    >
                        {l2Item.label}
                    </Link>
                ) : (
                    <span className="flex-1 font-semibold text-xs tracking-wider uppercase text-neutral-400">
                        {l2Item.label}
                    </span>
                )}

                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-neutral-400"}`}
                    >
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                )}
            </div>

            {hasChildren && isOpen && (
                <div className="pl-16 space-y-3 mt-2 border-l-2 border-primary/20 ml-12">
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
}: {
    item: NavItem;
    onBack: () => void;
    onClose: () => void;
}) {
    return (
        <div className="absolute w-full inset-0 bg-white flex flex-col">

            {/* ── Header ── */}
            <div className="flex justify-between items-center py-8 px-6">
                <h2 className="text-xl font-black text-primary font-headline tracking-widest uppercase">
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
                    onClick={onClose}
                    className="flex items-center gap-3 p-4 text-neutral-700 font-headline font-medium text-sm tracking-tight uppercase hover:pl-6 transition-all duration-300 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                    <span>Elite Performance</span>
                </Link>

                {/* ── Active L1 grey card ── */}
                <div className="bg-surface-container-low rounded-lg">
                    {/* L1 header */}
                    <Link
                        href={item.href ?? undefined}
                        onClick={onClose}
                        className="w-full flex items-center justify-between p-4 text-primary font-headline font-bold text-sm tracking-tight uppercase group"
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
                    onClick={onClose}
                    className="flex items-center gap-3 p-4 text-neutral-700 font-headline font-medium text-sm tracking-tight uppercase hover:pl-6 transition-all duration-300 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">fitness_center</span>
                    <span>Training Gear</span>
                </Link>

                {/* Fan Zone — below grey card */}
                <Link
                    href="/shop?collection=fan"
                    onClick={onClose}
                    className="flex items-center gap-3 p-4 text-neutral-700 font-headline font-medium text-sm tracking-tight uppercase hover:pl-6 transition-all duration-300 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-lg">groups</span>
                    <span>Fan Zone</span>
                </Link>
            </div>

            {/* ── Sticky footer ── */}
            <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-neutral-100 flex gap-4">
                <Link
                    href="/login"
                    onClick={onClose}
                    className="flex-1 bg-surface-container-highest text-on-surface h-12 text-[10px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 duration-150 transition-transform"
                >
                    Sign In
                </Link>
                <Link
                    href="/shop"
                    onClick={onClose}
                    className="flex-1 bg-primary text-white h-12 text-[10px] font-black uppercase tracking-widest flex items-center justify-center active:scale-95 duration-150 transition-transform shadow-xl shadow-primary/20"
                >
                    Shop All
                </Link>
            </div>
        </div>
    );
}

export default function MobileNav({ navigation, isOpen, onClose }: MobileNavProps) {
    const [activeL1, setActiveL1] = useState<NavItem | null>(null);
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
                />
            )}

            {/* Drawer shell */}
            <aside
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
                            <span className="text-xl font-black text-[#e30613] font-headline tracking-widest uppercase">
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
                                    <span className="text-white/30 group-hover:text-[#e30613] text-xl font-light transition-colors">
                                        +
                                    </span>
                                </button>
                                <div className="h-px bg-white/5 mx-2" />
                            </div>
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="mt-auto pt-8 flex flex-col gap-3">
                        <Link
                            href="/login"
                            onClick={handleClose}
                            className="w-full py-4 bg-transparent border border-white/20 text-white font-headline font-bold text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-colors text-center"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            onClick={handleClose}
                            className="w-full py-4 bg-[#e30613] text-white font-headline font-bold text-xs tracking-widest uppercase hover:bg-[#b5000b] transition-colors text-center"
                        >
                            Create Account
                        </Link>
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
                        />
                    )}
                </div>
            </aside>
        </>
    );
}