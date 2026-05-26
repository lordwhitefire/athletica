import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
    title: "Order Status",
};

export default function Orders() {
    return (
        <PlaceholderPage
            title="Order Status"
            description="Track your orders and view order history."
            icon="local_shipping"
        />
    );
}
