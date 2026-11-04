import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { AuthShell } from "./auth-view";
import { validateDoorKey } from "@/lib/auth/door-key-validate";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in | Athletica",
  description: "Sign in to Athletica — premium football gear for real fans.",
  robots: { index: false, follow: false },
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80";

export default async function SignInPage() {
  // Lock #2: the door-key cookie. Checked on the server, before the page is
  // sent. No cookie / wrong / expired / revoked → 404. The cookie does not
  // authenticate anyone — it only lets this page load.
  const valid = await validateDoorKey();
  if (!valid.ok) {
    notFound();
  }

  return (
    <main
      className={`ath-signin-page ${inter.variable} ${montserrat.variable}`}
    >
      <AuthShell heroImage={HERO_IMAGE} view="signin" />
    </main>
  );
}
