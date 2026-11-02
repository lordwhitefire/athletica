"use client";

import { useId, useState, type FormEvent } from "react";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "./signin-icons";

export function SigninForm() {
  const emailId = useId();
  const passwordId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setNotice("Please enter your email address and password.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setNotice(body.error || "Invalid email or password.");
        return;
      }

      window.location.href = "/admin/products";
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ath-signin-form" onSubmit={handleSubmit} noValidate>
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
          autoComplete="current-password"
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

      <div className="ath-signin-options">
        <label className="ath-signin-check">
          <input
            className="ath-signin-checkbox"
            type="checkbox"
            name="rememberMe"
          />
          <span>Remember me</span>
        </label>
        <button className="ath-signin-link" type="button">
          Forgot password?
        </button>
      </div>

      <button className="ath-signin-submit" type="submit" disabled={submitting}>
        {submitting ? "Signing In…" : "Sign In"}
      </button>

      <p className="ath-signin-status" role="status" aria-live="polite">
        {notice}
      </p>
    </form>
  );
}
