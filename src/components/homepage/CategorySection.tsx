"use client";

import Link from "next/link";

import { CategoryGridItem, CategorySectionVariant } from "@/types/homepage";

// ─── Component ─────────────────────────────────────────────────────────────────

interface CategoryGridSectionProps {
    title: string;
    items: CategoryGridItem[];
    variant: CategorySectionVariant;
    viewAllHref?: string;
    viewAllLabel?: string;
    bg?: string; // section background
}

export default function CategoryGridSection({
    title,
    items,
    variant,
    viewAllHref,
    viewAllLabel = "View All",
    bg = "bg-surface",
}: CategoryGridSectionProps) {
    return (
        <section className={`px-12 py-20 ${bg}`}>
            {/* Section header */}
            <div className="flex justify-between items-end mb-12">
                <h2 className="font-headline text-4xl font-black uppercase italic tracking-tighter">
                    {title}
                </h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="text-primary font-bold text-sm uppercase tracking-widest hover:underline underline-offset-4 flex items-center gap-1 transition-transform hover:translate-x-1"
                    >
                        {viewAllLabel}
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                )}
            </div>

            {/* Variant layouts */}
            {variant === "grid-4-equal" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Link key={item.label} href={item.href}>
                            <div className="relative h-96 group overflow-hidden cursor-pointer">
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                )}
                                <div className={`absolute inset-0 ${item.image ? "bg-black/20" : item.bg || "bg-surface-container"} flex items-center justify-center`}>
                                    <h3 className={`font-headline text-2xl font-black ${item.textColor || "text-white"}`}>
                                        {item.label}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {variant === "scroll-brands" && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {items.map((item) => (
                        <Link key={item.label} href={item.href}>
                            <div className={`min-w-[400px] h-64 ${item.bg || "bg-zinc-800"} flex items-center justify-center group cursor-pointer relative overflow-hidden`}>
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform"
                                    />
                                )}
                                <span className={`relative font-headline text-5xl font-black italic ${item.textColor || "text-white"}`}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {variant === "grid-tiles-dark" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Link key={item.label} href={item.href}>
                            <div className={`relative aspect-square ${item.bg || "bg-neutral-800"} flex items-center justify-center font-black text-3xl italic hover:bg-primary cursor-pointer transition-colors group overflow-hidden`}>
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform"
                                    />
                                )}
                                <span className={`relative z-10 ${item.textColor || "text-white"}`}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {variant === "grid-3-bordered" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {items.map((item) => (
                        <Link key={item.label} href={item.href}>
                            <div className={`relative h-64 ${item.bg || "bg-surface-container-low"} flex items-center justify-center ${item.accent || "border-l-8 border-primary"} cursor-pointer hover:opacity-90 transition-opacity group overflow-hidden`}>
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform"
                                    />
                                )}
                                <span className={`relative z-10 font-black text-2xl uppercase ${item.textColor || "text-on-surface"}`}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {variant === "scroll-categories" && (
                <div className="flex gap-6 overflow-x-auto no-scrollbar">
                    {items.map((item) => (
                        <Link key={item.label} href={item.href}>
                            <div className={`relative min-w-[200px] aspect-video border-4 ${item.accent || "border-white"} flex items-center justify-center font-bold uppercase cursor-pointer hover:bg-white/10 transition-colors group overflow-hidden`}>
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform"
                                    />
                                )}
                                <span className={`relative z-10 ${item.textColor || "text-white"}`}>
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {variant === "asymmetric-3-2" && items.length >= 2 && (
                <div className="grid grid-cols-3 gap-4 h-[600px]">
                    {/* First item spans 2 cols */}
                    <Link href={items[0].href} className="col-span-2 relative group overflow-hidden">
                        {items[0].image && (
                            <img
                                src={items[0].image}
                                alt={items[0].label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        )}
                        <div className="absolute bottom-10 left-10 bg-white p-8">
                            <h3 className="text-4xl font-black italic">{items[0].label}</h3>
                        </div>
                    </Link>
                    {/* Second item spans 1 col */}
                    <Link href={items[1].href} className="relative group overflow-hidden">
                        {items[1].image && (
                            <img
                                src={items[1].image}
                                alt={items[1].label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        )}
                        <div className={`absolute bottom-10 left-10 ${items[1].bg || "bg-primary"} p-8 text-white`}>
                            <h3 className="text-3xl font-black italic">{items[1].label}</h3>
                        </div>
                    </Link>
                </div>
            )}

            {variant === "split-1-2" && items.length >= 2 && (
                <div className="flex flex-col md:flex-row gap-4 h-[500px]">
                    {/* 1/3 */}
                    <Link href={items[0].href} className="md:w-1/3 relative group overflow-hidden flex items-center justify-center">
                        {items[0].image && (
                            <img
                                src={items[0].image}
                                alt={items[0].label}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                            />
                        )}
                        <div className={`absolute inset-0 ${items[0].bg || "bg-black"}`} style={{ opacity: items[0].image ? 0.4 : 1 }} />
                        <h3 className={`relative font-headline text-3xl font-black italic ${items[0].textColor || "text-white"}`}>
                            {items[0].label}
                        </h3>
                    </Link>
                    {/* 2/3 */}
                    <Link href={items[1].href} className="md:w-2/3 relative group overflow-hidden flex items-center justify-center">
                        {items[1].image && (
                            <img
                                src={items[1].image}
                                alt={items[1].label}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                            />
                        )}
                        <div className={`absolute inset-0 ${items[1].bg || "bg-primary"}`} style={{ opacity: items[1].image ? 0.4 : 1 }} />
                        <h3 className={`relative font-headline text-5xl font-black italic ${items[1].textColor || "text-white"}`}>
                            {items[1].label}
                        </h3>
                    </Link>
                </div>
            )}

            {variant === "asymmetric-2-split" && items.length >= 2 && (
                <div className="grid grid-cols-2 gap-8 h-[500px]">
                    <Link href={items[0].href} className={`relative overflow-hidden group ${items[0].accent || "border-r-[24px] border-primary"}`}>
                        {items[0].image && (
                            <img
                                src={items[0].image}
                                alt={items[0].label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        )}
                        <div className={`absolute inset-0 bg-black/30 flex items-center p-12 ${items[0].textColor || "text-white"} font-headline text-6xl font-black italic uppercase`}>
                            {items[0].label}
                        </div>
                    </Link>
                    <Link href={items[1].href} className={`relative overflow-hidden group ${items[1].accent || "border-l-[24px] border-black"}`}>
                        {items[1].image && (
                            <img
                                src={items[1].image}
                                alt={items[1].label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        )}
                        <div className={`absolute inset-0 ${items[1].bg || "bg-primary/30"} flex items-center p-12 ${items[1].textColor || "text-white"} font-headline text-6xl font-black italic uppercase`}>
                            {items[1].label}
                        </div>
                    </Link>
                </div>
            )}

            {variant === "stacked-banners" && (
                <div className="flex flex-col gap-4">
                    {items.map((item, i) => (
                        <Link key={item.label} href={item.href}>
                            <div className={`${item.height || (i === 0 ? "h-48" : "h-80")} ${item.bg || "bg-black"} ${item.textColor || "text-white"} flex items-center justify-between px-20 group cursor-pointer overflow-hidden relative`}>
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform"
                                    />
                                )}
                                <h3 className={`font-headline font-black italic relative uppercase ${i === 0 ? "text-5xl" : "text-7xl"}`}>
                                    {item.label}
                                </h3>
                                <span className={`material-symbols-outlined relative group-hover:translate-x-4 transition-transform ${i === 0 ? "text-6xl" : "text-8xl"}`}>
                                    {i === 0 ? "chevron_right" : "trending_flat"}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}