"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import SizePickerModal from "@/components/ui/SizePickerModal";

interface ProductInfoProps {
    product: Product;
    amazonLink: string | null;
}

export default function ProductInfo({ product, amazonLink }: ProductInfoProps) {
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addToCart } = useCart();

    const hasDiscount = product.price.discount_percent > 0;
    const availableSizes = product.sizes.filter((s) => s.available);

    function handleAddToCart() {
        if (!selectedSize) {
            setIsModalOpen(true);
            return;
        }
        addToCart(product, selectedSize);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    }

    function handleBuyNow() {
        if (!amazonLink) return;
        window.open(amazonLink, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Brand + Title + Subtitle */}
            <div>
                <p className="text-sm font-bold font-headline text-[#008a00] uppercase tracking-tighter mb-1">
                    {product.brand} Performance
                </p>
                <h1 className="text-5xl font-black font-headline tracking-tighter uppercase leading-none mb-2">
                    {product.model}
                </h1>
                <p className="text-secondary font-body text-lg">
                    {product.description.subtitle}
                </p>
            </div>

            {/* Tags / Badges */}
            {(product.traction || product.category || product.description.collection) && (
                <div className="flex flex-wrap gap-2">
                    {product.traction && (
                        <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase px-2 py-1">
                            {product.traction}
                        </span>
                    )}
                    {product.category && (
                        <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase px-2 py-1">
                            {product.category}
                        </span>
                    )}
                    {product.description.collection && (
                        <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase px-2 py-1">
                            {product.description.collection}
                        </span>
                    )}
                </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4">
                <span className="text-3xl font-black font-headline text-primary">
                    {product.price.currency} {product.price.current}
                </span>
                {hasDiscount && (
                    <>
                        <span className="text-xl text-secondary line-through">
                            {product.price.currency} {product.price.original}
                        </span>
                        <span className="bg-primary-container text-on-primary-container text-[12px] font-black px-2 py-0.5">
                            -{product.price.discount_percent.toFixed(0)}% OFF
                        </span>
                    </>
                )}
            </div>

            {/* Color variants */}
            {product.color_variants.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">
                        Color: {product.color}
                    </p>
                    <div className="flex gap-3">
                        {/* Current product color swatch */}
                        <button
                            className="w-10 h-10 border-2 border-primary ring-2 ring-offset-2 ring-transparent overflow-hidden bg-surface-container-low"
                            title={product.color}
                        >
                            <img
                                src={product.thumbnail}
                                alt={product.color}
                                className="w-full h-full object-contain p-0.5"
                            />
                        </button>
                        {product.color_variants.map((variant) => (
                            <Link key={variant.product_id} href={`/${variant.product_id}`}>
                                <button
                                    className="w-10 h-10 border border-surface-container-highest hover:border-primary transition-all overflow-hidden bg-surface-container-low"
                                    title={variant.color}
                                >
                                    <img
                                        src={variant.thumbnail}
                                        alt={variant.color}
                                        className="w-full h-full object-contain p-0.5"
                                    />
                                </button>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Size picker */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                        Select Size (EU)
                        {selectedSize && (
                            <span className="text-on-surface normal-case font-medium ml-2">
                                — {selectedSize}
                            </span>
                        )}
                    </p>
                    {availableSizes.length === 0 ? (
                        <span className="text-[10px] font-bold uppercase text-primary">
                            Out of Stock
                        </span>
                    ) : (
                        <button className="text-[10px] font-bold uppercase text-primary underline underline-offset-4">
                            Size Guide
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((s) => {
                        const isSelected = selectedSize === s.size;
                        const isAvailable = s.available;

                        if (!isAvailable) {
                            return (
                                <button
                                    key={s.size}
                                    disabled
                                    className="py-3 bg-surface-container text-zinc-400 font-bold text-sm cursor-not-allowed relative overflow-hidden"
                                >
                                    {s.size}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-[1px] bg-zinc-300 rotate-45" />
                                    </div>
                                </button>
                            );
                        }

                        return (
                            <button
                                key={s.size}
                                onClick={() => setSelectedSize(s.size)}
                                className={`py-3 font-bold text-sm transition-colors ${isSelected
                                        ? "bg-zinc-900 text-white"
                                        : "border border-surface-container-highest hover:border-primary"
                                    }`}
                            >
                                {s.size}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleAddToCart}
                    className={`w-full py-5 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors duration-300 ${addedToCart
                            ? "bg-[#008a00] text-white"
                            : "bg-zinc-900 text-white hover:bg-zinc-700"
                        }`}
                >
                    <span>{addedToCart ? "Added to Cart!" : "Add to Cart"}</span>
                </button>

                <button
                    onClick={handleBuyNow}
                    disabled={!amazonLink}
                    className={`w-full border-2 py-5 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors ${amazonLink
                            ? "border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white"
                            : "border-surface-container-highest text-zinc-300 cursor-not-allowed"
                        }`}
                >
                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    <span>{amazonLink ? "Buy Now on Amazon" : "Amazon Link Coming Soon"}</span>
                </button>
            </div>

            <SizePickerModal
                product={product}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}