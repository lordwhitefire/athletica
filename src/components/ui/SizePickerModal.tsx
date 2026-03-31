"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

interface SizePickerModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

export default function SizePickerModal({ product, isOpen, onClose }: SizePickerModalProps) {
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();

    if (!isOpen) return null;

    function handleAddToCart() {
        if (!selectedSize) return;
        addToCart(product, selectedSize);
        setAdded(true);
        setTimeout(() => {
            setAdded(false);
            setSelectedSize(null);
            onClose();
        }, 1000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-4 border-b">
                    <h3 className="font-bold text-gray-900">Select Size</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
                        <span className="text-lg">x</span>
                    </button>
                </div>

                <div className="p-4">
                    <div className="flex gap-3 mb-4">
                        <div className="w-16 h-16 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                            <img src={product.thumbnail} alt={product.model} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{product.model}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                            <p className="text-xs text-gray-500">{product.color}</p>
                            <p className="font-bold text-gray-900 mt-1">
                                {product.price.currency} {product.price.current}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Available Sizes
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {product.sizes.map((s) => {
                            const isSelected = selectedSize === s.size;
                            const isAvailable = s.available;
                            let sizeClass = "border rounded p-2 text-xs text-center transition-colors ";
                            if (!isAvailable) {
                                sizeClass += "border-gray-100 text-gray-300 cursor-not-allowed line-through";
                            } else if (isSelected) {
                                sizeClass += "border-green-500 bg-green-500 text-white font-bold cursor-pointer";
                            } else {
                                sizeClass += "border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-500 cursor-pointer";
                            }
                            return (
                                <button key={s.size} disabled={!isAvailable} onClick={() => setSelectedSize(s.size)} className={sizeClass}>
                                    {s.size}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={!selectedSize || added}
                        className={`w-full py-3 rounded font-bold text-sm transition-colors ${selectedSize && !added ? "bg-green-500 text-white hover:bg-green-600" : added ? "bg-green-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                    >
                        {added ? "Added to Cart!" : selectedSize ? "Add to Cart" : "Select a Size"}
                    </button>
                </div>
            </div>
        </div>
    );
}