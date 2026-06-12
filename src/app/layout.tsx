import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PageTransition } from "@/components/PageTransition";
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
            <body className="antialiased bg-black text-zinc-300">
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded">
                    Skip to main content
                </a>
                <Providers>
                    <Header navigation={navigation} siteLogoUrl={siteLogoUrl} />
                    <PageTransition>
                        <main id="main-content">{children}</main>
                    </PageTransition>
                    <Footer siteLogoUrl={siteLogoUrl} />
                    <ScrollToTop />
                </Providers>
            </body>
        </html>
    );
}
