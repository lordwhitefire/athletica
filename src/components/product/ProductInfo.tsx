"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import SizePickerModal from "@/components/ui/SizePickerModal";

interface ProductInfoProps {
    product: Product;
    amazonLink: string | null;
}

export default function ProductInfo({ product, amazonLink }: ProductInfoProps) {
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    const hasDiscount = product.price.discount_percent > 0;
    const availableSizes = product.sizes.filter((s) => s.available);

    function handleAddToCart() {
        if (!selectedSize) {
            setIsModalOpen(true);
            return;
        }
        setAddingToCart(true);
        addToCart(product, selectedSize);
        setAddedToCart(true);
        addToast(`${product.model} added to cart`);
        setTimeout(() => { setAddedToCart(false); setAddingToCart(false); }, 2000);
    }

    function handleBuyNow() {
        if (!amazonLink) return;
        window.open(amazonLink, "_blank", "noopener,noreferrer");
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Brand + Title + Subtitle */}
            <div>
                <p className="text-sm font-bold font-headline text-primary-container uppercase tracking-tighter mb-1">
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
                <span data-testid="product-price" className="text-3xl font-black font-headline text-primary">
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
            {(product.color_variants?.length ?? 0) > 0 && (
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">
                        Color: {product.color}
                    </p>
                    <div className="flex gap-3">
                        {/* Current product color swatch */}
                        <button
                            className="relative w-10 h-10 border-2 border-primary-container ring-2 ring-offset-2 ring-transparent overflow-hidden bg-surface-container-low"
                            title={product.color}
                        >
                            <Image
                                src={product.thumbnail}
                                alt={product.color}
                                fill
                                className="object-contain p-0.5"
                                sizes="40px"
                            />
                        </button>
                        {product.color_variants?.map((variant) => (
                            <Link key={variant.product_id} href={`/${variant.product_id}`}>
                                <button
                                    className="relative w-10 h-10 border border-surface-container-highest hover:border-primary-container transition-all overflow-hidden bg-surface-container-low"
                                    title={variant.color}
                                >
                                    <Image
                                        src={variant.thumbnail}
                                        alt={variant.color}
                                        fill
                                        className="object-contain p-0.5"
                                        sizes="40px"
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
                        <span className="text-[10px] font-bold uppercase text-primary-container">
                            Out of Stock
                        </span>
                    ) : (
                        <button
                            onClick={() => setIsSizeGuideOpen(true)}
                            className="text-[10px] font-bold uppercase text-primary-container underline underline-offset-4 hover:text-primary transition-colors"
                        >
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
                                        data-testid="size-option"
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
                                    data-testid="size-option"
                                    className={`py-3 font-bold text-sm transition-colors relative ${isSelected
                                        ? "bg-zinc-900 text-white"
                                        : "border border-surface-container-highest hover:border-primary-container"
                                    }`}
                                >
                                {s.size}
                                {s.stock !== undefined && s.stock <= 3 && s.stock > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                                        {s.stock}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className={`w-full py-5 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors duration-300 ${addedToCart
                            ? "bg-primary text-on-primary"
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

            {isSizeGuideOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSizeGuideOpen(false)} />
                    <div className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl w-full max-w-md z-10 overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between px-4 py-4 border-b border-surface">
                            <h3 className="font-bold text-on-surface">Size Guide</h3>
                            <button
                                onClick={() => setIsSizeGuideOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container transition-colors text-on-surface-variant"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">EU to US/UK Conversion</p>
                            <div className="space-y-2">
                                {[
                                    { eu: "36", uk: "3.5", us: "4" },
                                    { eu: "37", uk: "4", us: "4.5" },
                                    { eu: "38", uk: "5", us: "5.5" },
                                    { eu: "39", uk: "5.5", us: "6.5" },
                                    { eu: "40", uk: "6.5", us: "7" },
                                    { eu: "41", uk: "7", us: "8" },
                                    { eu: "42", uk: "8", us: "8.5" },
                                    { eu: "43", uk: "8.5", us: "9.5" },
                                    { eu: "44", uk: "9.5", us: "10" },
                                    { eu: "45", uk: "10.5", us: "11" },
                                    { eu: "46", uk: "11", us: "12" },
                                    { eu: "47", uk: "12", us: "13" },
                                ].map((row) => (
                                    <div key={row.eu} className="grid grid-cols-3 gap-4 py-2 border-b border-surface text-sm">
                                        <span className="font-bold text-on-surface">EU {row.eu}</span>
                                        <span className="text-on-surface-variant">UK {row.uk}</span>
                                        <span className="text-on-surface-variant">US {row.us}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-on-surface-variant/60 mt-4">This is a general guide. Sizes may vary by brand.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}