import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = {
    title: "Returns",
};

export default function Returns() {
    return (
        <PlaceholderPage
            title="Returns"
            description="Start a return or check our return policy."
            icon="assignment_return"
        />
    );
}
