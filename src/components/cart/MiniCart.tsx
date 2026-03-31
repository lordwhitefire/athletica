"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface MiniCartProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
    const { cart, removeFromCart, updateQuantity } = useCart();

    const overlayClass = isOpen ? "fixed inset-0 bg-black bg-opacity-50 z-40" : "hidden";
    const drawerClass = `fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`;

    return (
        <div>
            <div className={overlayClass} onClick={onClose} />
            <div className={drawerClass}>
                <div className="flex items-center justify-between px-4 py-4 border-b">
                    <h2 className="text-lg font-bold">
                        Your Cart
                        {cart.totalItems > 0 && (
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({cart.totalItems} {cart.totalItems === 1 ? "item" : "items"})
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
                        <span className="text-xl">x</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {cart.items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">🛒</span>
                            </div>
                            <p className="text-gray-500 font-medium">Your cart is empty</p>
                            <p className="text-gray-400 text-sm mt-1">Add some products to get started</p>
                            <button onClick={onClose} className="mt-6 px-6 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 transition-colors">
                                Continue Shopping
                            </button>
                        </div>
                    )}

                    {cart.items.length > 0 && (
                        <ul className="space-y-4">
                            {cart.items.map((item) => {
                                const key = `${item.product.id}-${item.selectedSize}`;
                                const total = (item.product.price.current * item.quantity).toFixed(2);
                                return (
                                    <li key={key} className="flex gap-3">
                                        <div className="w-20 h-20 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                                            <img src={item.product.thumbnail} alt={item.product.model} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.product.model}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.product.brand}</p>
                                            <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                                            <p className="text-xs text-gray-500">Color: {item.product.color}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border rounded">
                                                    <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-sm">-</button>
                                                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 text-sm">+</button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold">{item.product.price.currency} {total}</p>
                                                    <button onClick={() => removeFromCart(item.product.id, item.selectedSize)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {cart.items.length > 0 && (
                    <div className="px-4 py-4 border-t bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-lg font-bold">EUR {cart.totalPrice.toFixed(2)}</span>
                        </div>
                        <Link href="/cart" onClick={onClose} className="block w-full py-3 bg-green-500 text-white text-center font-bold rounded hover:bg-green-600 transition-colors">
                            View Cart
                        </Link>
                        <p className="text-xs text-gray-400 text-center mt-2">Shipping calculated at checkout</p>
                    </div>
                )}
            </div>
        </div>
    );
}