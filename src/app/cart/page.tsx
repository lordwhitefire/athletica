import CartPage from "@/components/cart/CartPage";
import { getMainCategoryHref } from "@/lib/getNavigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Your Cart",
};

export default async function Cart() {
    const mainCategoryHref = await getMainCategoryHref();
    return <CartPage mainCategoryHref={mainCategoryHref} />;
}