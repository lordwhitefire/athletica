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
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🛒</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link href="/football-boots" className="px-8 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors">
                    Shop Football Boots
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-black text-gray-900">
                        Your Cart
                        <span className="ml-2 text-base font-normal text-gray-500">
                            ({cart.totalItems} {cart.totalItems === 1 ? "item" : "items"})
                        </span>
                    </h1>
                    <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                        Clear cart
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map((item) => (
                            <div key={`${item.product.id}-${item.selectedSize}`} className="bg-white rounded-lg p-4 flex gap-4 shadow-sm">
                                <div className="w-24 h-24 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                                    <img src={item.product.thumbnail || undefined} alt={item.product.model} className="w-full h-full object-contain p-1" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">{item.product.brand}</p>
                                            <Link href={`/${item.product.url_slug}`} className="font-bold text-gray-900 hover:text-green-500 transition-colors line-clamp-2">
                                                {item.product.model}
                                            </Link>
                                            <p className="text-xs text-gray-500 mt-0.5">Color: {item.product.color}</p>
                                            <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>
                                        </div>
                                        <button onClick={() => removeFromCart(item.product.id, item.selectedSize)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 text-lg">
                                            ×
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center border border-gray-200 rounded">
                                            <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors">
                                                −
                                            </button>
                                            <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors">
                                                +
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900">
                                                {item.product.price.currency} {(item.product.price.current * item.quantity).toFixed(2)}
                                            </p>
                                            {item.quantity > 1 && (
                                                <p className="text-xs text-gray-400">
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
                        <div className="bg-white rounded-lg p-6 shadow-sm sticky top-24">
                            <h2 className="font-black text-gray-900 text-lg mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-4">
                                {cart.items.map((item) => (
                                    <div key={`${item.product.id}-${item.selectedSize}`} className="flex justify-between text-sm">
                                        <span className="text-gray-500 truncate mr-2">
                                            {item.product.model} x{item.quantity}
                                        </span>
                                        <span className="text-gray-900 flex-shrink-0">
                                            {item.product.price.currency} {(item.product.price.current * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-4 mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-bold text-gray-900">EUR {cart.totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="text-gray-500">Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="font-black text-gray-900">Total</span>
                                    <span className="font-black text-xl text-gray-900">EUR {cart.totalPrice.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Tax included where applicable</p>
                            </div>

                            <button className="w-full py-3 bg-green-500 text-white font-black rounded hover:bg-green-600 transition-colors mb-3">
                                Proceed to Checkout
                            </button>
                            <Link href="/football-boots" className="block w-full py-3 border border-gray-200 text-gray-600 font-bold rounded hover:border-green-500 hover:text-green-500 transition-colors text-center text-sm">
                                Continue Shopping
                            </Link>

                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                                <span>🔒 Secure checkout</span>
                                <span>📦 Free returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}