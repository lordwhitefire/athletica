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

    if (products.length === 0) return null;

    function scrollLeft() {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: -660, behavior: "smooth" });
    }

    function scrollRight() {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: 660, behavior: "smooth" });
    }

    return (
        <div className="py-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-black text-gray-900 ">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {link && (
                        <Link href={link} className="text-sm text-green-500 hover:text-green-600 transition-colors mr-2">
                            {linkLabel || "View all"}
                        </Link>
                    )}
                    <button onClick={scrollLeft} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:border-green-500 hover:text-green-500 transition-colors">
                        ‹
                    </button>
                    <button onClick={scrollRight} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:border-green-500 hover:text-green-500 transition-colors">
                        ›
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {products.map((product) => (
                    <div key={product.id} className="flex-shrink-0" style={{ width: "240px" }}>
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
}