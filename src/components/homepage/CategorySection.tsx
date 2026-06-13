"use client";

import Link from "next/link";
import { CategoryGridItem, CategorySectionVariant } from "@/types/homepage";
import Grid4Equal from "./variants/Grid4Equal";
import ScrollBrands from "./variants/ScrollBrands";
import GridTilesDark from "./variants/GridTilesDark";
import Grid3Bordered from "./variants/Grid3Bordered";
import ScrollCategories from "./variants/ScrollCategories";
import Asymmetric32 from "./variants/Asymmetric32";
import Split12 from "./variants/Split12";
import Asymmetric2Split from "./variants/Asymmetric2Split";
import StackedBanners from "./variants/StackedBanners";

const variantMap: Record<CategorySectionVariant, React.ComponentType<{ items: CategoryGridItem[] }>> = {
    "grid-4-equal": Grid4Equal,
    "scroll-brands": ScrollBrands,
    "grid-tiles-dark": GridTilesDark,
    "grid-3-bordered": Grid3Bordered,
    "scroll-categories": ScrollCategories,
    "asymmetric-3-2": Asymmetric32,
    "split-1-2": Split12,
    "asymmetric-2-split": Asymmetric2Split,
    "stacked-banners": StackedBanners,
};

interface CategoryGridSectionProps {
    title: string;
    items: CategoryGridItem[];
    variant: CategorySectionVariant;
    viewAllHref?: string;
    viewAllLabel?: string;
    bg?: string;
}

export default function CategoryGridSection({
    title,
    items,
    variant,
    viewAllHref,
    viewAllLabel = "View All",
    bg = "bg-surface",
}: CategoryGridSectionProps) {
    const Component = variantMap[variant];
    if (!Component) return null;

    return (
        <section className={`px-4 py-8 md:px-12 md:py-20 ${bg}`}>
            <div className="flex justify-between items-end mb-6 md:mb-12">
                <h2 className={`font-headline text-2xl md:text-4xl font-black uppercase italic tracking-tighter ${bg === "bg-primary" || bg === "bg-primary-container" ? "text-black" : "text-on-surface"}`}>
                    {title}
                </h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="text-primary-container font-bold text-xs md:text-sm uppercase tracking-widest hover:underline underline-offset-4 flex items-center gap-1 transition-transform hover:translate-x-1"
                    >
                        {viewAllLabel}
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                )}
            </div>

            <Component items={items} />
        </section>
    );
}
