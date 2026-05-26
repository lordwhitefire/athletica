"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function CheckoutForm() {
    const { cart } = useCart();
    const router = useRouter();
    const [submitted, setSubmitted] = useState(false);

    if (cart.items.length === 0 && !submitted) {
        return (
            <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4">
                <span className="material-symbols-outlined text-6xl text-surface-container-highest mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shopping_cart
                </span>
                <h1 className="text-2xl font-black text-on-surface mb-2">Your cart is empty</h1>
                <p className="text-on-surface-variant mb-8">Add some products before checking out.</p>
                <Link href="/football-boots" className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors">
                    Shop Football Boots
                </Link>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-[60vh] bg-surface flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <h1 className="text-3xl font-black font-headline text-on-surface mb-2">Order Placed!</h1>
                <p className="text-on-surface-variant mb-8 max-w-md">
                    Thank you for your order. You will receive a confirmation email shortly.
                </p>
                <Link href="/" className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded hover:bg-primary-container hover:text-on-primary-container transition-colors">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitted(true);
    }

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <h1 className="text-3xl font-black font-headline text-on-surface mb-10">Checkout</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                        {/* Shipping form */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface">
                                <h2 className="font-bold text-on-surface text-lg mb-6">Shipping Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-on-surface mb-1">Full name</label>
                                        <input type="text" required className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
                                        <input type="email" required className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-on-surface mb-1">Address</label>
                                        <input type="text" required className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1">City</label>
                                        <input type="text" required className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1">Postal code</label>
                                        <input type="text" required className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1">Country</label>
                                        <input type="text" required defaultValue="United States" className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-on-surface mb-1">Phone</label>
                                        <input type="tel" className="w-full px-4 py-2.5 border border-outline-variant rounded bg-surface focus:outline-none focus:border-primary text-sm transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface">
                                <h2 className="font-bold text-on-surface text-lg mb-6">Payment</h2>
                                <p className="text-sm text-on-surface-variant">Payment integration coming soon. Your card will not be charged yet.</p>
                                <div className="mt-4 p-4 bg-surface-container rounded text-sm text-on-surface-variant flex items-center gap-3">
                                    <span className="material-symbols-outlined">lock</span>
                                    <span>This is a demo — no real payment will be processed.</span>
                                </div>
                            </div>
                        </div>

                        {/* Order summary */}
                        <div className="lg:col-span-2">
                            <div className="bg-surface-container-lowest rounded-lg p-6 border border-surface sticky top-24">
                                <h2 className="font-bold text-on-surface text-lg mb-4">Order Summary</h2>

                                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
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
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-primary text-on-primary font-black rounded hover:bg-primary-container hover:text-on-primary-container transition-colors"
                                >
                                    Place Order
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
