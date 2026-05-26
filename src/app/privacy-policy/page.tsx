import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
    title: "Privacy Policy",
};

export default function PrivacyPolicy() {
    return (
        <PlaceholderPage
            title="Privacy Policy"
            description="How we handle your data and protect your privacy."
            icon="shield"
        />
    );
}
