import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
    title: "Terms of Service",
};

export default function Terms() {
    return (
        <PlaceholderPage
            title="Terms of Service"
            description="Our terms and conditions for using the Athletica store."
            icon="description"
        />
    );
}
