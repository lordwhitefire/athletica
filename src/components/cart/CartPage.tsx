"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const router = useRouter();

    if (cart.items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40" style={{ fontVariationSettings: "'FILL' 1" }}>
                        shopping_cart
                    </span>
                </div>
                <h1 className="text-2xl font-black text-on-surface mb-2">Your cart is empty</h1>
                <p className="text-on-surface-variant mb-8">Looks like you haven&apos;t added anything yet.</p>
                <Link
                    href="/football-boots"
                    className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                >
                    Shop Football Boots
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-black text-on-surface">
                        Your Cart
                        <span className="ml-2 text-base font-normal text-on-surface-variant">
                            ({cart.totalItems} {cart.totalItems === 1 ? "item" : "items"})
                        </span>
                    </h1>
                    <button
                        onClick={clearCart}
                        className="text-sm text-on-surface-variant/60 hover:text-error transition-colors flex items-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        Clear cart
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map((item) => (
                            <div key={`${item.product.id}-${item.selectedSize}`} className="bg-surface-container-lowest rounded-lg p-4 flex gap-4 shadow-sm border border-surface">
                                <div className="w-24 h-24 bg-surface-container rounded overflow-hidden flex-shrink-0">
                                    {item.product.thumbnail ? (
                                        <Image
                                            src={item.product.thumbnail}
                                            alt={item.product.model}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-contain p-1"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                                            <span className="material-symbols-outlined text-2xl">image</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs text-on-surface-variant uppercase tracking-wider">{item.product.brand}</p>
                                            <Link
                                                href={`/${item.product.url_slug}`}
                                                className="font-bold text-on-surface hover:text-primary-container transition-colors line-clamp-2"
                                            >
                                                {item.product.model}
                                            </Link>
                                            <p className="text-xs text-on-surface-variant/70 mt-0.5">Color: {item.product.color}</p>
                                            <p className="text-xs text-on-surface-variant/70">Size: {item.selectedSize}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                                            className="text-on-surface-variant/30 hover:text-error transition-colors flex-shrink-0"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center border border-outline-variant rounded">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">remove</span>
                                            </button>
                                            <span className="w-10 text-center text-sm font-bold text-on-surface">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-on-surface">
                                                {item.product.price.currency} {(item.product.price.current * item.quantity).toFixed(2)}
                                            </p>
                                            {item.quantity > 1 && (
                                                <p className="text-xs text-on-surface-variant/60">
                                                    {item.product.price.currency} {item.product.price.current} each
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm border border-surface sticky top-24">
                            <h2 className="font-black text-on-surface text-lg mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                {cart.items.map((item) => (
                                    <div key={`${item.product.id}-${item.selectedSize}`} className="flex justify-between text-sm">
                                        <span className="text-on-surface-variant truncate mr-2">
                                            {item.product.model} x{item.quantity}
                                        </span>
                                        <span className="text-on-surface flex-shrink-0">
                                            {item.product.price.currency} {(item.product.price.current * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-surface pt-4 mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-on-surface-variant">Subtotal</span>
                                    <span className="font-bold text-on-surface">EUR {cart.totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-on-surface-variant">Shipping</span>
                                    <span className="text-on-surface-variant">Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="border-t border-surface pt-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="font-black text-on-surface">Total</span>
                                    <span className="font-black text-xl text-on-surface">EUR {cart.totalPrice.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-on-surface-variant/60 mt-1">Tax included where applicable</p>
                            </div>

                            <button className="w-full py-3.5 bg-primary text-on-primary font-black rounded hover:bg-primary-container hover:text-on-primary-container transition-colors mb-3">
                                Proceed to Checkout
                            </button>
                            <Link
                                href="/football-boots"
                                className="block w-full py-3.5 border border-outline-variant text-on-surface-variant font-bold rounded hover:border-primary-container hover:text-primary-container transition-colors text-center text-sm"
                            >
                                Continue Shopping
                            </Link>

                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-on-surface-variant/60">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">lock</span>
                                    Secure checkout
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                                    Free returns
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
