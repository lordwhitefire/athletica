"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";

interface MiniCartProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
    const { cart, removeFromCart, updateQuantity } = useCart();

    const overlayClass = isOpen
        ? "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        : "hidden";
    const drawerClass = `fixed top-0 right-0 h-full w-full max-w-sm bg-surface-container-lowest z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`;

    return (
        <div>
            <div className={overlayClass} onClick={onClose} />
            <div id="mini-cart" data-testid="mini-cart" className={drawerClass}>
                <div className="flex items-center justify-between px-4 py-4 border-b border-surface">
                    <h2 className="text-lg font-bold text-on-surface">
                        Your Cart
                        {cart.totalItems > 0 && (
                            <span className="ml-2 text-sm font-normal text-on-surface-variant">
                                ({cart.totalItems} {cart.totalItems === 1 ? "item" : "items"})
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container transition-colors text-on-surface-variant"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {cart.items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-2xl text-on-surface-variant/40" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    shopping_cart
                                </span>
                            </div>
                            <p className="text-on-surface-variant font-medium">Your cart is empty</p>
                            <p className="text-on-surface-variant/60 text-sm mt-1">Add some products to get started</p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors"
                            >
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
                                    <li key={key} data-testid="cart-item" className="flex gap-3">
                                        <div className="w-20 h-20 bg-surface-container rounded overflow-hidden flex-shrink-0">
                                            {item.product.thumbnail ? (
                                                <Image
                                                    src={item.product.thumbnail}
                                                    alt={item.product.model}
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                                                    <span className="material-symbols-outlined">image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-on-surface truncate">{item.product.model}</p>
                                            <p className="text-xs text-on-surface-variant mt-0.5">{item.product.brand}</p>
                                            <p className="text-xs text-on-surface-variant">Size: {item.selectedSize}</p>
                                            <p className="text-xs text-on-surface-variant">Color: {item.product.color}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border border-outline-variant rounded">
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                                                        className="w-6 h-6 flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">remove</span>
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium text-on-surface">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                                                        className="w-6 h-6 flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-on-surface">{item.product.price.currency} {total}</p>
                                                    <button
                                                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                                                        className="text-xs text-on-surface-variant/60 hover:text-error transition-colors flex items-center gap-0.5"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                                        Remove
                                                    </button>
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
                    <div className="px-4 py-4 border-t border-surface bg-surface-container-lowest">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-on-surface-variant">Subtotal</span>
                            <span className="text-lg font-bold text-on-surface">EUR {cart.totalPrice.toFixed(2)}</span>
                        </div>
                        <Link
                            href="/cart"
                            onClick={onClose}
                            className="block w-full py-3.5 bg-primary text-on-primary text-center font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                        >
                            View Cart
                        </Link>
                        <p className="text-xs text-on-surface-variant/60 text-center mt-2">Shipping calculated at checkout</p>
                    </div>
                )}
            </div>
        </div>
    );
}
