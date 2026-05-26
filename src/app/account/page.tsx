import type { Metadata } from "next";
import AccountPage from "./AccountPage";

export const metadata: Metadata = {
    title: "My Account",
};

export default function Account() {
    return <AccountPage />;
}
