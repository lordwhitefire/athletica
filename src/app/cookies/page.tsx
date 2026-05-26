import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
    title: "Cookie Settings",
};

export default function Cookies() {
    return (
        <PlaceholderPage
            title="Cookie Settings"
            description="Manage your cookie preferences."
            icon="cookie"
        />
    );
}
