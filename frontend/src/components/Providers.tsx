"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ToastContainer } from "@/components/ToastContainer";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <CartProvider>
                {children}
                <ToastContainer />
            </CartProvider>
        </AuthProvider>
    );
}
