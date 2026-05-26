"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types/product";

interface WishlistContextType {
    items: Product[];
    isInWishlist: (productId: string) => boolean;
    toggleWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const STORAGE_KEY = "athletica_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<Product[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setItems(JSON.parse(stored));
        } catch {}
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (loaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
    }, [items, loaded]);

    function isInWishlist(productId: string) {
        return items.some((p) => p.id === productId);
    }

    function toggleWishlist(product: Product) {
        setItems((prev) =>
            prev.some((p) => p.id === product.id)
                ? prev.filter((p) => p.id !== product.id)
                : [...prev, product]
        );
    }

    function removeFromWishlist(productId: string) {
        setItems((prev) => prev.filter((p) => p.id !== productId));
    }

    return (
        <WishlistContext.Provider value={{ items, isInWishlist, toggleWishlist, removeFromWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
    return ctx;
}
