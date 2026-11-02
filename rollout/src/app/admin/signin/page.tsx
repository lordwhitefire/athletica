import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { SigninForm } from "./signin-form";
import { validateDoorKey } from "@/lib/auth/door-key-validate";
import {
  AthleticaMark,
  GitHubIcon,
  GoogleIcon,
} from "./signin-icons";
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

export default async function SignInPreviewPage() {
  const valid = await validateDoorKey();
  if (!valid.ok) {
    notFound();
  }

  return (
    <main
      className={`ath-signin-page ${inter.variable} ${montserrat.variable}`}
    >
      <div className="ath-signin-shell">
        <section
          className="ath-signin-visual"
          aria-label="Athletica football campaign"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ath-signin-photo"
            src={HERO_IMAGE}
            alt="Football campaign visual"
          />

          <div className="ath-signin-brand">
            <AthleticaMark className="ath-signin-brand-mark" />
            <span className="ath-signin-brand-name">ATHLETICA</span>
          </div>

          <div className="ath-signin-campaign">
            <p className="ath-signin-play">PLAY</p>
            <p className="ath-signin-bigger">BIGGER</p>
            <p className="ath-signin-caption">
              PREMIUM FOOTBALL GEAR.
              <br />
              FOR REAL FANS.
            </p>
            <div className="ath-signin-rule" />
          </div>
        </section>

        <section
          className="ath-signin-panel"
          aria-labelledby="ath-signin-title"
        >
          <div className="ath-signin-content">
            <div className="ath-signin-heading-rule" />

            <h1 className="ath-signin-heading" id="ath-signin-title">
              Welcome Back
            </h1>

            <p className="ath-signin-description">
              Sign in to access your account and continue your football journey.
            </p>

            <SigninForm />

            <div className="ath-signin-divider">
              <span>or continue with</span>
            </div>

            <div className="ath-signin-socials">
              <button className="ath-signin-social" type="button">
                <GoogleIcon className="ath-signin-social-icon" />
                Google
              </button>
              <button className="ath-signin-social" type="button">
                <GitHubIcon className="ath-signin-social-icon" />
                GitHub
              </button>
            </div>

            <p className="ath-signin-signup">
              Don&apos;t have an account?{" "}
              <Link href="/admin/signup" className="ath-signin-signup-link">
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
