"use client";

import { useId, useState, type FormEvent } from "react";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  GoogleIcon,
  GitHubIcon,
} from "./signin-icons";

export function SignupForm({ onSwitchToSignin }: { onSwitchToSignin: () => void }) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const termsId = useId();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const terms = formData.get("terms") === "on";

    if (!name || !email || !password || !confirmPassword) {
      setNotice("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }

    if (!terms) {
      setNotice("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setNotice(body.error || "Unable to create account.");
        return;
      }

      setNotice("Account created. You can now sign in.");
      setSubmitting(false);
      setTimeout(() => onSwitchToSignin(), 1500);
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ath-signup-form" onSubmit={handleSubmit} noValidate>
      <div className="ath-signin-field">
        <label className="ath-signin-sr-only" htmlFor={nameId}>
          Full name
        </label>
        <span className="ath-signin-field-icon" aria-hidden="true">
          <UserIcon />
        </span>
        <input
          className="ath-signin-input"
          id={nameId}
          type="text"
          name="name"
          placeholder="Full name"
          autoComplete="name"
        />
      </div>

      <div className="ath-signin-field">
        <label className="ath-signin-sr-only" htmlFor={emailId}>
          Email address
        </label>
        <span className="ath-signin-field-icon" aria-hidden="true">
          <MailIcon />
        </span>
        <input
          className="ath-signin-input"
          id={emailId}
          type="email"
          name="email"
          placeholder="Email address"
          autoComplete="email"
        />
      </div>

      <div className="ath-signin-field">
        <label className="ath-signin-sr-only" htmlFor={passwordId}>
          Password
        </label>
        <span className="ath-signin-field-icon" aria-hidden="true">
          <LockIcon />
        </span>
        <input
          className="ath-signin-input"
          id={passwordId}
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          autoComplete="new-password"
        />
        <button
          className="ath-signin-toggle"
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>

      <div className="ath-signin-field">
        <label className="ath-signin-sr-only" htmlFor={confirmId}>
          Confirm password
        </label>
        <span className="ath-signin-field-icon" aria-hidden="true">
          <LockIcon />
        </span>
        <input
          className="ath-signin-input"
          id={confirmId}
          type={showConfirm ? "text" : "password"}
          name="confirmPassword"
          placeholder="Confirm password"
          autoComplete="new-password"
        />
        <button
          className="ath-signin-toggle"
          type="button"
          onClick={() => setShowConfirm((v) => !v)}
          aria-label={showConfirm ? "Hide password" : "Show password"}
          aria-pressed={showConfirm}
        >
          {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>

      <label className="ath-signup-terms" htmlFor={termsId}>
        <input
          className="ath-signin-checkbox"
          id={termsId}
          type="checkbox"
          name="terms"
        />
        <span>
          I agree to the{" "}
          <button type="button" className="ath-signup-terms-link">
            Terms of Service
          </button>{" "}
          and{" "}
          <button type="button" className="ath-signup-terms-link">
            Privacy Policy
          </button>
        </span>
      </label>

      <button className="ath-signin-submit" type="submit" disabled={submitting}>
        {submitting ? "Creating Account…" : "Create Account"}
      </button>

      <p className="ath-signin-status" role="status" aria-live="polite">
        {notice}
      </p>

      <div className="ath-signin-divider">
        <span>or continue with</span>
      </div>

      <div className="ath-signup-socials">
        <button className="ath-signup-social" type="button">
          <GoogleIcon className="ath-signin-social-icon" />
          Continue with Google
        </button>
        <button className="ath-signup-social" type="button">
          <GitHubIcon className="ath-signin-social-icon" />
          Continue with GitHub
        </button>
      </div>

      <p className="ath-signin-signup">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToSignin}>
          Sign In
        </button>
      </p>
    </form>
  );
}
