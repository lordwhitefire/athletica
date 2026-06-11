"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

    const handleScrollKeyDown = (
        e: React.KeyboardEvent<HTMLDivElement>,
    ) => {
        if (!scrollRef.current) return;

        if (e.key === "ArrowLeft") {
            scrollRef.current.scrollBy({ left: -660, behavior: "smooth" });
            e.preventDefault();
        } else if (e.key === "ArrowRight") {
            scrollRef.current.scrollBy({ left: 660, behavior: "smooth" });
            e.preventDefault();
        }
    };

    return (
        <motion.div
            role="region"
            aria-label={`${title} carousel`}
            className="py-8 md:py-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="w-full">
                <div className="flex justify-between items-end mb-4 md:mb-10">
                    <div>
                        <h2 className="text-lg md:text-3xl font-black font-headline uppercase tracking-tighter">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-secondary text-xs md:text-sm mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        {link && (
                            <Link
                                href={link}
                                className="text-xs font-bold uppercase tracking-widest text-primary-container flex items-center hover:translate-x-1 transition-transform"
                            >
                                <span className="hidden sm:inline">{linkLabel || "View All"}</span>
                                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                            </Link>
                        )}
                        <button
                            onClick={scrollLeft}
                            aria-label="Previous products"
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-surface-container-highest hover:border-primary-container hover:text-primary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">chevron_left</span>
                        </button>
                        <button
                            onClick={scrollRight}
                            aria-label="Next products"
                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-surface-container-highest hover:border-primary-container hover:text-primary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px] md:text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-3 md:gap-6 overflow-x-auto pb-4"
                    tabIndex={0}
                    onKeyDown={handleScrollKeyDown}
                    aria-label="Scrollable products"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {products.map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-40 md:w-72">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}