import CartPage from "@/components/cart/CartPage";
import { getMainCategoryHref, getMainCategoryLabel } from "@/lib/getNavigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Your Cart",
};

export default async function Cart() {
    const mainCategoryHref = await getMainCategoryHref();
    const mainCategoryLabel = await getMainCategoryLabel();
    return <CartPage mainCategoryHref={mainCategoryHref} mainCategoryLabel={mainCategoryLabel} />;
}