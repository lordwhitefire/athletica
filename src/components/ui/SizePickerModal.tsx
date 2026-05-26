"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

interface SizePickerModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

export default function SizePickerModal({ product, isOpen, onClose }: SizePickerModalProps) {
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();
    const { addToast } = useToast();

    if (!isOpen) return null;

    function handleAddToCart() {
        if (!selectedSize) return;
        addToCart(product, selectedSize);
        setAdded(true);
        addToast(`${product.model} added to cart`);
        setTimeout(() => {
            setAdded(false);
            setSelectedSize(null);
            onClose();
        }, 1000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl w-full max-w-md z-10 overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 py-4 border-b border-surface">
                    <h3 className="font-bold text-on-surface">Select Size</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container transition-colors text-on-surface-variant"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="p-4">
                    <div className="flex gap-3 mb-4">
                        <div className="w-16 h-16 bg-surface-container rounded overflow-hidden flex-shrink-0">
                            <img src={product.thumbnail} alt={product.model} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="font-medium text-on-surface text-sm">{product.model}</p>
                            <p className="text-xs text-on-surface-variant">{product.brand}</p>
                            <p className="text-xs text-on-surface-variant">{product.color}</p>
                            <p className="font-bold text-on-surface mt-1">
                                {product.price.currency} {product.price.current}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                        Available Sizes
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {product.sizes.map((s) => {
                            const isSelected = selectedSize === s.size;
                            const isAvailable = s.available;

                            if (!isAvailable) {
                                return (
                                    <button
                                        key={s.size}
                                        disabled
                                        className="py-3 bg-surface-container text-on-surface-variant/40 font-bold text-sm cursor-not-allowed relative overflow-hidden rounded"
                                    >
                                        {s.size}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full h-[1px] bg-on-surface-variant/20 rotate-45" />
                                        </div>
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={s.size}
                                    onClick={() => setSelectedSize(s.size)}
                                    className={`py-3 font-bold text-sm rounded transition-colors ${isSelected
                                            ? "bg-zinc-900 text-white"
                                            : "border border-surface-container-highest text-on-surface hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    {s.size}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={!selectedSize || added}
                        className={`w-full py-3.5 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2 ${selectedSize && !added
                                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                : added
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
                            }`}
                    >
                        {added ? (
                            <>
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                Added to Cart!
                            </>
                        ) : selectedSize ? (
                            "Add to Cart"
                        ) : (
                            "Select a Size"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
