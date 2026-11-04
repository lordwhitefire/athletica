import Link from "next/link";
import {
  AthleticaMark,
  BoltIcon,
  TagIcon,
  TrophyIcon,
  GoogleIcon,
  GitHubIcon,
} from "./signin-icons";
import { SigninForm } from "./signin-form";
import { SignupForm } from "./signup-form";

type View = "signin" | "signup";

export function AuthShell({
  heroImage,
  view = "signin",
  signupCode,
}: {
  heroImage: string;
  view?: View;
  signupCode?: string;
}) {
  return (
    <div className="ath-signin-shell">
      {/* Left visual panel — same photo, same diagonal, same treatment.
          Only the overlaid content changes between views. */}
      <section
        className="ath-signin-visual"
        aria-label="Athletica football campaign"
      >
        <img
          className="ath-signin-photo"
          src={heroImage}
          alt="Football campaign visual"
        />

        <div className="ath-signin-brand">
          <AthleticaMark className="ath-signin-brand-mark" />
          <span className="ath-signin-brand-name">ATHLETICA</span>
        </div>

        {view === "signin" ? (
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
        ) : (
          <div className="ath-signup-campaign">
            <p className="ath-signup-headline">
              Join the{" "}
              <span className="ath-signup-headline-accent">Athletica</span>{" "}
              Family
            </p>
            <p className="ath-signup-subhead">
              Get exclusive updates, early access to drops, and more.
            </p>

            <div className="ath-signup-features">
              <div className="ath-signup-feature">
                <span className="ath-signup-feature-icon" aria-hidden="true">
                  <BoltIcon />
                </span>
                <span className="ath-signup-feature-label">Fast Access</span>
              </div>
              <div className="ath-signup-feature">
                <span className="ath-signup-feature-icon" aria-hidden="true">
                  <TagIcon />
                </span>
                <span className="ath-signup-feature-label">Exclusive Offers</span>
              </div>
              <div className="ath-signup-feature">
                <span className="ath-signup-feature-icon" aria-hidden="true">
                  <TrophyIcon />
                </span>
                <span className="ath-signup-feature-label">Football Culture</span>
              </div>
            </div>

            {/* CSS-drawn lime diagonal stripes at the bottom-left */}
            <div className="ath-signup-stripes" aria-hidden="true" />
          </div>
        )}
      </section>

      {/* Right form panel — heading + description + form changes per view */}
      <section className="ath-signin-panel" aria-labelledby="ath-signin-title">
        <div className="ath-signin-content">
          <div className="ath-signin-heading-rule" />

          <h1 className="ath-signin-heading" id="ath-signin-title">
            {view === "signin" ? "Welcome Back" : "Create Account"}
          </h1>

          <p className="ath-signin-description">
            {view === "signin"
              ? "Sign in to access your account and continue your football journey."
              : "Join thousands of fans already part of the Athletica community."}
          </p>

          {view === "signin" ? (
            <>
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
            </>
          ) : (
            <SignupForm inviteCode={signupCode} />
          )}
        </div>
      </section>
    </div>
  );
}
