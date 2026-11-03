import type { Metadata } from "next";
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

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const view = (Array.isArray(params.view) ? params.view[0] : params.view) || "signin";
  const initialView = view === "signup" ? "signup" : "signin";

  return (
    <main
      className={`ath-signin-page ${inter.variable} ${montserrat.variable}`}
    >
      <AuthShell heroImage={HERO_IMAGE} initialView={initialView} />
    </main>
  );
}
