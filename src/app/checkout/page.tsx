import type { Metadata } from "next";
import { getMainCategoryHref, getMainCategoryLabel } from "@/lib/getNavigation";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
    title: "Checkout",
};

export default async function CheckoutPage() {
    const mainCategoryHref = await getMainCategoryHref();
    const mainCategoryLabel = await getMainCategoryLabel();
    return <CheckoutForm mainCategoryHref={mainCategoryHref} mainCategoryLabel={mainCategoryLabel} />;
}
