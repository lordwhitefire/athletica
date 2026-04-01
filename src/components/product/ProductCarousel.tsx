"use client";

import { useRef } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import ProductCard from "@/components/category/ProductCard";

interface ProductCarouselProps {
    title: string;
    subtitle?: string;
    products: Product[];
    link?: string;
    linkLabel?: string;
}

export default function ProductCarousel({
    title,
    subtitle,
    products,
    link,
    linkLabel,
}: ProductCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!products || products.length === 0) return null;

    function scrollLeft() {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: -660, behavior: "smooth" });
    }

    function scrollRight() {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: 660, behavior: "smooth" });
    }

    return (
        <div className="py-20">
            <div className="max-w-[1400px] w-full mx-auto ">

                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-black font-headline uppercase tracking-tighter">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-secondary text-sm mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {link && (
                            <Link
                                href={link}
                                className="text-xs font-bold uppercase tracking-widest text-primary flex items-center hover:translate-x-1 transition-transform"
                            >
                                {linkLabel || "View All"}
                                <span className="material-symbols-outlined text-[16px] ml-1">
                                    arrow_forward
                                </span>
                            </Link>
                        )}
                        <button
                            onClick={scrollLeft}
                            className="w-8 h-8 flex items-center justify-center border border-surface-container-highest hover:border-primary hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button
                            onClick={scrollRight}
                            className="w-8 h-8 flex items-center justify-center border border-surface-container-highest hover:border-primary hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable cards */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto pb-4"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {products.map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-72">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}