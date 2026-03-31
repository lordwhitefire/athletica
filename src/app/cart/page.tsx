import CartPage from "@/components/cart/CartPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Your Cart",
};

export default function Cart() {
    return <CartPage />;
}