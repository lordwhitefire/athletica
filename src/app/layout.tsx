import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/navigation/Header";
import Footer from "@/components/ui/Footer";
import { getNavigation } from "@/lib/getNavigation";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navigation = getNavigation();

    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    rel="stylesheet"
                />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthProvider>
                    <CartProvider>
                        <Header navigation={navigation} />
                        <main>{children}</main>
                        <Footer />
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}