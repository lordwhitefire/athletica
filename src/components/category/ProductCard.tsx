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
                {/* Image Container: Clean white/gray background with no border */}
                <Link href={`/${product.url_slug}`} className="relative aspect-square overflow-hidden bg-white">
                    <img
                        src={(isHovered ? hoverImage : product.main_image) || ""}
                        alt={product.model}
                        className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Quick Add Button - Appears on Hover */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsModalOpen(true);
                        }}
                        className="absolute inset-0 m-auto h-10 w-32 bg-black text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl"
                    >
                        Quick Add
                    </button>
                </Link>

                {/* Brand Badge Section */}
                <div className="px-1 flex flex-col">
                    {/* 1. Wrapper for the Badge with Top Padding */}
                    <div className="pt-6">
                        <div className="bg-black text-white w-fit min-w-8 min-h-4 px-2 py-1 flex items-center justify-center">
                            <span className="text-[10px] font-black italic tracking-tighter leading-none">
                                AT
                            </span>
                        </div>
                    </div>

                    {/* 2. This is the "Breathing Room" - An empty div with a set height */}
                    <div className="h-2" />

                    {/* 3. The Divider Line */}
                    <div className="w-full h-[1px] bg-gray-200" />

                    {/* 4. Space between line and the Product Title below */}
                    <div className="h-2" />
                </div>

                {/* Product Info */}
                <div className="px-1 pb-4">
                    <Link href={`/${product.url_slug}`}>
                        {/* Product Title: Single line with ellipsis */}
                        <h3 className="text-[15px] font-sm text-black truncate mb-2">
                            {product.model}
                        </h3>

                        {/* Price Section: Flex layout for side-by-side positioning */}
                        <div className="flex justify-between  ">
                            {/* Main Price */}
                            <span className="text-[13px] font-sm text-black leading-none">
                                {product.price.currency} {product.price.current.toFixed(2)}
                            </span>

                            {/* Member Pricing: Stacked on the right */}
                            {product.price.discount_percent > 0 && (
                                <div className="flex flex-col items-end text-gray-400 leading-none gap-1">
                                    <span className="text-[10px]">
                                        member {product.price.currency}
                                    </span>
                                    <span className="text-[13px]">
                                        {((product.price.current) * 0.95).toFixed(2)}
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