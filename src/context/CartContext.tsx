"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { CartContextType, CartItem, CartState } from "@/types/cart";
import { Product } from "@/types/product";

const CART_COOKIE_KEY = "athletica_cart";
const COOKIE_EXPIRES_DAYS = 30;

// ── Cookie helpers ────────────────────────────────────────
function setCookie(name: string, value: string, days: number) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
        c = c.trim();
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length));
        }
    }
    return null;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// ── Initial empty cart state ──────────────────────────────
const emptyCart: CartState = {
    items: [],
    totalItems: 0,
    totalPrice: 0,
};

// ── Calculate totals from items ───────────────────────────
function calculateTotals(items: CartItem[]): CartState {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
        (sum, item) => sum + item.product.price.current * item.quantity,
        0
    );
    return {
        items,
        totalItems,
        totalPrice: Math.round(totalPrice * 100) / 100,
    };
}

// ── Load cart from cookie ─────────────────────────────────
function loadCartFromCookie(): CartState {
    try {
        const raw = getCookie(CART_COOKIE_KEY);
        if (!raw) return emptyCart;
        const items: CartItem[] = JSON.parse(raw);
        return calculateTotals(items);
    } catch {
        return emptyCart;
    }
}

// ── Save cart to cookie ───────────────────────────────────
function saveCartToCookie(items: CartItem[]) {
    setCookie(CART_COOKIE_KEY, JSON.stringify(items), COOKIE_EXPIRES_DAYS);
}

// ── Context ───────────────────────────────────────────────
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartState>(emptyCart);

    // Load cart from cookie on mount
    useEffect(() => {
        const savedCart = loadCartFromCookie();
        setCart(savedCart);
    }, []);

    // Add item to cart
    function addToCart(product: Product, selectedSize: string) {
        setCart((prev) => {
            const existingIndex = prev.items.findIndex(
                (item) =>
                    item.product.id === product.id && item.selectedSize === selectedSize
            );

            let newItems: CartItem[];

            if (existingIndex >= 0) {
                // Item already in cart with same size — increase quantity
                newItems = prev.items.map((item, index) =>
                    index === existingIndex
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                // New item — add to cart
                const newItem: CartItem = {
                    product,
                    selectedSize,
                    quantity: 1,
                    addedAt: new Date().toISOString(),
                };
                newItems = [...prev.items, newItem];
            }

            saveCartToCookie(newItems);
            return calculateTotals(newItems);
        });
    }

    // Remove item from cart
    function removeFromCart(productId: string, selectedSize: string) {
        setCart((prev) => {
            const newItems = prev.items.filter(
                (item) =>
                    !(item.product.id === productId && item.selectedSize === selectedSize)
            );
            saveCartToCookie(newItems);
            return calculateTotals(newItems);
        });
    }

    // Update quantity of an item
    function updateQuantity(
        productId: string,
        selectedSize: string,
        quantity: number
    ) {
        setCart((prev) => {
            let newItems: CartItem[];

            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                newItems = prev.items.filter(
                    (item) =>
                        !(
                            item.product.id === productId &&
                            item.selectedSize === selectedSize
                        )
                );
            } else {
                newItems = prev.items.map((item) =>
                    item.product.id === productId && item.selectedSize === selectedSize
                        ? { ...item, quantity }
                        : item
                );
            }

            saveCartToCookie(newItems);
            return calculateTotals(newItems);
        });
    }

    // Clear entire cart
    function clearCart() {
        deleteCookie(CART_COOKIE_KEY);
        setCart(emptyCart);
    }

    // Check if a specific product + size combo is in cart
    function isInCart(productId: string, selectedSize: string): boolean {
        return cart.items.some(
            (item) =>
                item.product.id === productId && item.selectedSize === selectedSize
        );
    }

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                isInCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

// Custom hook for using cart context
export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used inside a CartProvider");
    }
    return context;
}