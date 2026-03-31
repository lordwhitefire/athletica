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
        <div className="flex flex-col gap-5">
            <div>
                <p className="text-sm font-bold text-green-500 uppercase tracking-wider mb-1">
                    {product.brand}
                </p>
                <h1 className="text-2xl font-black text-gray-900 leading-tight">
                    {product.model}
                </h1>
                <p className="text-gray-500 text-sm mt-1">{product.description.subtitle}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {product.traction && (
                    <span className="px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded">
                        {product.traction}
                    </span>
                )}
                {product.category && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        {product.category}
                    </span>
                )}
                {product.description.collection && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                        {product.description.collection}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-3">
                {hasDiscount ? (
                    <>
                        <span className="text-3xl font-black text-gray-900">
                            {product.price.currency} {product.price.current}
                        </span>
                        <span className="text-lg text-gray-400 line-through">
                            {product.price.currency} {product.price.original}
                        </span>
                        <span className="px-2 py-1 bg-red-500 text-white text-sm font-bold rounded">
                            -{product.price.discount_percent.toFixed(0)}%
                        </span>
                    </>
                ) : (
                    <span className="text-3xl font-black text-gray-900">
                        {product.price.currency} {product.price.current}
                    </span>
                )}
            </div>

            {product.color_variants.length > 0 && (
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Color: <span className="text-gray-700 normal-case font-medium">{product.color}</span>
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-8 h-8 rounded border-2 border-green-500 overflow-hidden bg-gray-50" title={product.color}>
                            <img src={product.thumbnail} alt={product.color} className="w-full h-full object-contain p-0.5" />
                        </div>
                        {product.color_variants.map((variant) => (
                            <Link key={variant.product_id} href={`/${variant.product_id}`}>
                                <div className="w-8 h-8 rounded border-2 border-gray-200 hover:border-green-500 transition-colors overflow-hidden bg-gray-50" title={variant.color}>
                                    <img src={variant.thumbnail} alt={variant.color} className="w-full h-full object-contain p-0.5" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Size: {selectedSize && (
                            <span className="text-gray-700 normal-case font-medium">{selectedSize}</span>
                        )}
                    </p>
                    {availableSizes.length === 0 && (
                        <span className="text-xs text-red-500 font-medium">Out of Stock</span>
                    )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {product.sizes.map((s) => {
                        const isSelected = selectedSize === s.size;
                        const isAvailable = s.available;
                        let cls = "py-2 text-xs rounded border transition-colors text-center ";
                        if (!isAvailable) {
                            cls += "border-gray-100 text-gray-300 cursor-not-allowed line-through";
                        } else if (isSelected) {
                            cls += "border-green-500 bg-green-500 text-white font-bold cursor-pointer";
                        } else {
                            cls += "border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-500 cursor-pointer";
                        }
                        return (
                            <button
                                key={s.size}
                                disabled={!isAvailable}
                                onClick={() => setSelectedSize(s.size)}
                                className={cls}
                            >
                                {s.size}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <button
                    onClick={handleAddToCart}
                    className={`w-full py-3 rounded font-bold text-sm transition-colors ${addedToCart ? "bg-green-700 text-white" : "bg-gray-900 text-white hover:bg-gray-700"}`}
                >
                    {addedToCart ? "Added to Cart!" : selectedSize ? "Add to Cart" : "Select Size to Add to Cart"}
                </button>

                <button
                    onClick={handleBuyNow}
                    disabled={!amazonLink}
                    className={`w-full py-3 rounded font-bold text-sm transition-colors border ${amazonLink ? "border-green-500 text-green-600 hover:bg-green-500 hover:text-white" : "border-gray-200 text-gray-300 cursor-not-allowed"}`}
                >
                    {amazonLink ? "Buy Now on Amazon" : "Amazon Link Coming Soon"}
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