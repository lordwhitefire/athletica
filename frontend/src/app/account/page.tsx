import type { Metadata } from "next";
import { getMainCategoryHref } from "@/lib/content/content-service";
import AccountPage from "./AccountPage";

export const metadata: Metadata = {
    title: "My Account",
};

export default async function Account() {
    const mainCategoryHref = await getMainCategoryHref();
    return <AccountPage mainCategoryHref={mainCategoryHref} />;
}
