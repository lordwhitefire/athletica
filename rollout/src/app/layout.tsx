import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "Athletica — football affiliate marketplace",
    template: "%s | Athletica",
  },
  description:
    "Athletica — a football affiliate marketplace. Browse football gear and shop on Amazon.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://athletica.vercel.app",
  ),
  openGraph: {
    title: "Athletica",
    description: "Football affiliate marketplace.",
    siteName: "Athletica",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
