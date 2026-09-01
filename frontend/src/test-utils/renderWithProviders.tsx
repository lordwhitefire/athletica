import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export function renderWithProviders(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, "wrapper">
) {
    function AllProviders({ children }: { children: React.ReactNode }) {
        return (
            <AuthProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </AuthProvider>
        );
    }

    return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
