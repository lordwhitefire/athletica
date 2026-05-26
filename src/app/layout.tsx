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
    const navigation = await getNavigation();

    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased">
                <AuthProvider>
                    <CartProvider>
                        <ToastProvider>
                            <WishlistProvider>
                                <Header navigation={navigation} />
                                <main>{children}</main>
                                <Footer />
                                <ScrollToTop />
                            </WishlistProvider>
                        </ToastProvider>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
