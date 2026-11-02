import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Montserrat } from "next/font/google";
import { AuthShell } from "./auth-view";
import "./signin.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sign in | Athletica",
  description: "Sign in to Athletica — premium football gear for real fans.",
  robots: { index: false, follow: false },
};

// Swap for any Unsplash photo. A plain  is used on purpose so no
// next.config.ts image setup is needed for this preview.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80";

export default function SignInPreviewPage() {
  return (
    <main
      className={`ath-signin-page ${inter.variable} ${montserrat.variable}`}
    >
      <AuthShell heroImage={HERO_IMAGE} />
    </main>
  );
}
