import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Montserrat } from "next/font/google";
import { SigninPreviewForm } from "./signin-preview-form";
import { AthleticaMark, GitHubIcon, GoogleIcon } from "./signin-preview-icons";
import "./signin-preview.css";

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
  title: "Sign in preview | Athletica",
  robots: { index: false, follow: false },
};

const HERO_IMAGE =
  "https://unsplash.com/photos/m5pz9D6MfUk/download?force=true&w=1600";

export default function SignInPreviewPage() {
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

            <SigninPreviewForm />

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
              Don’t have an account?{" "}
              <Link href="/admin/signup">Sign Up</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
