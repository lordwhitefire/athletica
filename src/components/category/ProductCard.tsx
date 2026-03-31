"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import SizePickerModal from "@/components/ui/SizePickerModal";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hoverImage = product.image_gallery?.[0] || product.main_image;

    return (
        <>
            <div
                className="group flex flex-col bg-white transition-all duration-200"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Container */}
                <Link
                    href={`/${product.url_slug}`}
                    className="relative aspect-[4/5] overflow-hidden bg-surface-container"
                >
                    <img
                        src={(isHovered ? hoverImage : product.main_image) || ""}
                        alt={product.model}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Quick Add — appears on hover, pinned to bottom */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsModalOpen(true);
                        }}
                        className="absolute bottom-0 left-0 right-0 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                    >
                        Quick Add
                    </button>
                </Link>

                {/* Brand Badge + Divider */}
                <div className="px-1 flex flex-col">
                    <div className="pt-4">
                        <div className="bg-zinc-900 text-white w-fit px-2 py-1 flex items-center justify-center">
                            <span className="text-[10px] font-black italic tracking-tighter leading-none">
                                AT
                            </span>
                        </div>
                    </div>
                    <div className="h-2" />
                    <div className="w-full h-[1px] bg-surface-container-high" />
                    <div className="h-2" />
                </div>

                {/* Product Info */}
                <div className="px-1 pb-4">
                    <Link href={`/${product.url_slug}`}>
                        <h3 className="font-black uppercase text-sm mb-1 truncate hover:text-primary transition-colors">
                            {product.model}
                        </h3>

                        <div className="flex justify-between items-start">
                            {/* Price */}
                            <span className="text-primary font-bold text-sm">
                                {product.price.currency} {product.price.current.toFixed(2)}
                            </span>

                            {/* Member price */}
                            {product.price.discount_percent > 0 && (
                                <div className="flex flex-col items-end text-secondary leading-none gap-0.5">
                                    <span className="text-[10px]">
                                        member {product.price.currency}
                                    </span>
                                    <span className="text-[12px] font-bold">
                                        {(product.price.current * 0.95).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            </div>

            <SizePickerModal
                product={product}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}