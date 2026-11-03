import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { AuthShell } from "../signin/auth-view";
import "../signin/signin.css";

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
  title: "Sign up | Athletica",
  description: "Join the Athletica family — premium football gear for real fans.",
  robots: { index: false, follow: false },
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80";

export default function SignUpPage() {
  return (
    <main
      className={`ath-signin-page ${inter.variable} ${montserrat.variable}`}
    >
      <AuthShell heroImage={HERO_IMAGE} initialView="signup" />
    </main>
  );
}
