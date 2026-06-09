import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Header from "@/components/navigation/Header";
import Footer from "@/components/ui/Footer";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { getNavigation } from "@/lib/getNavigation";
import { getSiteLogoUrl } from "@/lib/sanity";

export const metadata: Metadata = {
    title: {
        default: "Athletica | Football Store",
        template: "%s | Athletica",
    },
    description:
        "The ultimate football store. Shop football boots, goalkeeper gloves, footballs, shin guards, training wear and more.",
    keywords: [
        "football boots",
        "goalkeeper gloves",
        "footballs",
        "shin guards",
        "football store",
        "adidas",
        "nike",
        "puma",
    ],
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [navigationResult, siteLogoUrlResult] = await Promise.all([
        getNavigation(),
        getSiteLogoUrl(),
    ]);

    const navigation = navigationResult.data ?? [];
    const siteLogoUrl = siteLogoUrlResult.data ?? null;

    return (
        <html lang="en">
            <body className="antialiased">
                <AuthProvider>
                    <CartProvider>
                        <ToastProvider>
                            <WishlistProvider>
                                <Header navigation={navigation} siteLogoUrl={siteLogoUrl} />
                                <main>{children}</main>
                                <Footer siteLogoUrl={siteLogoUrl} />
                                <ScrollToTop />
                            </WishlistProvider>
                        </ToastProvider>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
