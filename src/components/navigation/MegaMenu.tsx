"use client";

import Link from "next/link";
import { NavItem } from "@/types/navigation";
import { Truck, ShieldCheck, Headset } from 'lucide-react';



interface MegaMenuProps {
    item: NavItem;
    onClose: () => void;
}

interface Column {
    parentLabel: string;
    parentHref?: string;
    items: {
        label: string;
        href?: string;
        level: 2 | 3 | 4;
        disabled?: boolean;
    }[];
}

function buildColumns(item: NavItem): Column[] {
    const columns: Column[] = [];
    let currentColumn: Column | null = null;

    function startNewColumn(parentLabel: string, parentHref?: string) {
        currentColumn = { parentLabel, parentHref, items: [] };
        columns.push(currentColumn);
    }

    function slotsUsed(): number {
        if (!currentColumn) return 5;
        return 1 + currentColumn.items.length;
    }

    function fits(count: number): boolean {
        return slotsUsed() + count <= 5;
    }

    const children = item.children || [];

    for (const l2 of children) {
        const l2Children = l2.children || [];
        const l2HasChildren = l2Children.length > 0;

        if (!l2HasChildren) {
            // Rule 1 — no children, add as normal item
            if (!currentColumn || slotsUsed() >= 5) {
                startNewColumn(item.label, item.href);
            }
            currentColumn!.items.push({
                label: l2.label,
                href: l2.href,
                level: 2,
                disabled: l2.disabled,
            });
        } else {
            // Rule 2 — has children
            // Always start new column if children exceed 3
            // Or if it won't fit in current column
            const totalNeeded = 1 + l2Children.length; // l2 label + its children
            const childrenExceedThree = l2Children.length > 3;

            if (childrenExceedThree || !currentColumn || !fits(totalNeeded)) {
                startNewColumn(item.label, item.href);
            }

            currentColumn!.items.push({
                label: l2.label,
                href: l2.href,
                level: 2,
                disabled: l2.disabled,
            });

            // Now add Level 3 children
            for (const l3 of l2Children) {
                const l3Children = l3.children || [];
                const l3HasChildren = l3Children.length > 0;

                if (!l3HasChildren) {
                    // Simple Level 3 — check if fits
                    if (slotsUsed() >= 5) {
                        startNewColumn(item.label, item.href);
                        currentColumn!.items.push({
                            label: l2.label,
                            href: l2.href,
                            level: 2,
                            disabled: l2.disabled,
                        });
                    }
                    currentColumn!.items.push({
                        label: l3.label,
                        href: l3.href,
                        level: 3,
                        disabled: l3.disabled,
                    });
                } else {
                    // Level 3 has Level 4 children
                    const l3ChildrenExceedThree = l3Children.length > 3;
                    const totalNeededForL3 = 1 + l3Children.length;

                    if (l3ChildrenExceedThree || !fits(totalNeededForL3)) {
                        startNewColumn(item.label, item.href);
                        currentColumn!.items.push({
                            label: l2.label,
                            href: l2.href,
                            level: 2,
                            disabled: l2.disabled,
                        });
                    }

                    currentColumn!.items.push({
                        label: l3.label,
                        href: l3.href,
                        level: 3,
                        disabled: l3.disabled,
                    });

                    // Add Level 4 children
                    let l4Batch = [...l3Children];
                    while (l4Batch.length > 0) {
                        const remaining = 5 - slotsUsed();
                        const batch = l4Batch.slice(0, remaining);
                        l4Batch = l4Batch.slice(remaining);

                        for (const l4 of batch) {
                            currentColumn!.items.push({
                                label: l4.label,
                                href: l4.href,
                                level: 4,
                                disabled: l4.disabled,
                            });
                        }

                        if (l4Batch.length > 0) {
                            startNewColumn(item.label, item.href);
                            currentColumn!.items.push({
                                label: l2.label,
                                href: l2.href,
                                level: 2,
                                disabled: l2.disabled,
                            });
                            currentColumn!.items.push({
                                label: l3.label,
                                href: l3.href,
                                level: 3,
                                disabled: l3.disabled,
                            });
                        }
                    }
                }
            }
        }
    }

    return columns;
}

export default function MegaMenu({ item, onClose }: MegaMenuProps) {
    const columns = buildColumns(item);
    const sizeLinks = item.sizeLinks || [];
    const quickLins = [...(item.customLinks || []), ...(item.bottomLinks || [])];
    const featuredImage = (item as any).featuredImage || null;
    const quickLinks = [
        { name: 'Track Order', icon: <Truck size={18} /> },
        { name: 'Authenticity Guarantee', icon: <ShieldCheck size={18} /> },
        { name: 'Pro Support', icon: <Headset size={18} /> },
    ];

    return (
        <div className="absolute left-0 w-screen flex justify-center bg-black shadow-2xl z-50 border-t border-gray-800 overflow-y-auto max-h-screen">
            <div className="max-w-[1400px]  px-6 py-6 flex gap-6 mb-[50px]">

                {/* ── MAIN COLUMNS AREA ── */}
                <div className="flex-1 flex flex-wrap gap-x-6 gap-y-6 content-start">
                    {columns.map((col, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-1" style={{ minWidth: "140px" }}>
                            {/* Column header — the repeating parent label */}
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 pb-1 border-b border-gray-800">
                                {col.parentHref ? (
                                    <Link href={col.parentHref} onClick={onClose} className="hover:text-red-500 transition-colors">
                                        {col.parentLabel}
                                    </Link>
                                ) : col.parentLabel}
                            </p>

                            {/* Items */}
                            {col.items.map((colItem, itemIndex) => {
                                if (colItem.level === 2) {
                                    return (
                                        <div key={itemIndex} className="flex items-center gap-2 mt-1">
                                            <div className="w-0.5 h-4 bg-red-600 flex-shrink-0" />
                                            {colItem.disabled || !colItem.href ? (
                                                <span className="text-sm font-black text-white uppercase tracking-wide cursor-default">
                                                    {colItem.label}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={colItem.href}
                                                    onClick={onClose}
                                                    className="text-sm font-black text-white uppercase tracking-wide hover:text-red-500 transition-colors"
                                                >
                                                    {colItem.label}
                                                </Link>
                                            )}
                                        </div>
                                    );
                                }

                                if (colItem.level === 3) {
                                    return (
                                        <div key={itemIndex} className="pl-3">
                                            {colItem.disabled || !colItem.href ? (
                                                <span className="text-sm font-bold text-gray-200 cursor-default">
                                                    {colItem.label}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={colItem.href}
                                                    onClick={onClose}
                                                    className="text-sm font-bold text-gray-200 hover:text-red-500 transition-colors"
                                                >
                                                    {colItem.label}
                                                </Link>
                                            )}
                                        </div>
                                    );
                                }

                                if (colItem.level === 4) {
                                    return (
                                        <div key={itemIndex} className="pl-5">
                                            {colItem.disabled || !colItem.href ? (
                                                <span className="text-xs text-gray-500 cursor-default">
                                                    {colItem.label}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={colItem.href}
                                                    onClick={onClose}
                                                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                                                >
                                                    {colItem.label}
                                                </Link>
                                            )}
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    ))}
                </div>

                {/* ── FEATURED BANNER ── */}
                <div className="flex-shrink-0 w-40 self-start">
                    {featuredImage ? (
                        <Link href={item.href || "/"} onClick={onClose} className="block rounded overflow-hidden">
                            <img src={featuredImage} alt={item.label} className="w-full h-48 object-cover" />
                        </Link>
                    ) : (
                        <Link
                            href={item.href || "/"}
                            onClick={onClose}
                            className="block rounded overflow-hidden relative"
                            style={{ height: "180px" }}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-red-900 via-gray-900 to-black flex flex-col items-start justify-end p-3">
                                <div className="absolute inset-0 opacity-20 flex items-center justify-center text-6xl select-none">
                                    ⚽
                                </div>
                                <p className="relative z-10 text-xs font-black text-white leading-tight mb-1">
                                    {item.label}
                                </p>
                                <p className="relative z-10 text-xs text-gray-400 mb-2">
                                    Shop the collection
                                </p>
                                <span className="relative z-10 text-xs bg-red-600 text-white px-2 py-1 rounded font-bold">
                                    Shop Now
                                </span>
                            </div>
                        </Link>
                    )}
                </div>

                {/* ── RIGHT SIDEBAR ── */}

                {(sizeLinks.length > 0 || quickLinks.length > 0) && (

                    <div className="self-start bg-[#0a0b0d] w-[400px] flex flex-col text-white p-8 font-sans">

                        {/* Shop By Size */}
                        {sizeLinks.length > 0 && (
                            <section className="w-[300px] mb-12 mt-[30px]">
                                <h2 className="text-xl italic font-black tracking-tighter uppercase mb-6">
                                    Shop by Size
                                </h2>
                                <div className="grid grid-cols-3 gap-4 max-w-xs ">
                                    {sizeLinks.map((sizeLink, i) => (
                                        <Link
                                            key={i}
                                            href={sizeLink.href || "#"}
                                            onClick={onClose}
                                            className="border border-zinc-800 py-4 px-12 text-sm h-[40px] w-[80px] font-bold hover:bg-zinc-800 transition-colors duration-200 flex items-center justify-center"
                                        >
                                            {sizeLink.label}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Quick Links */}
                        <section className=" w-[300px]">
                            <h2 className="text-xl font-black tracking-tighter uppercase mb-6">
                                Quick Links
                            </h2>
                            <ul className="flex flex-col gap-4 ">
                                {quickLinks.map((link) => (
                                    <li key={link.name}>
                                        <a
                                            href="#"
                                            className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <span className="text-zinc-500">{link.icon}</span>
                                            <span className="text-sm font-medium">{link.name}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                )}
            </div>
        </div>
    );
}