import { Product } from "./product";

export interface CartItem {
    product: Product;
    selectedSize: string;
    quantity: number;
    addedAt: string;
}

export interface CartState {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
}

export interface CartContextType {
    cart: CartState;
    addToCart: (product: Product, selectedSize: string) => void;
    removeFromCart: (productId: string, selectedSize: string) => void;
    updateQuantity: (
        productId: string,
        selectedSize: string,
        quantity: number
    ) => void;
    clearCart: () => void;
    isInCart: (productId: string, selectedSize: string) => boolean;
}