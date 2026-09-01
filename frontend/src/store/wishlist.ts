import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

interface WishlistStore {
    items: Product[];
    isInWishlist: (productId: string) => boolean;
    toggleWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],
            isInWishlist: (productId) =>
                get().items.some((p) => p.id === productId),
            toggleWishlist: (product) =>
                set((state) =>
                    state.items.some((p) => p.id === product.id)
                        ? { items: state.items.filter((p) => p.id !== product.id) }
                        : { items: [...state.items, product] }
                ),
            removeFromWishlist: (productId) =>
                set((state) => ({
                    items: state.items.filter((p) => p.id !== productId),
                })),
        }),
        { name: "athletica_wishlist" }
    )
);
