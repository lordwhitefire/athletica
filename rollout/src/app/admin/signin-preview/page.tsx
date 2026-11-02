import "./signin-preview.css";

function BrandMark() {
  return (
    <svg
      className="ath-signin-brand-mark"
      viewBox="0 0 64 40"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 34.5 29.5 3H48L21.5 34.5H3Z" fill="#D1FD40" />
      <path d="M36 3 61 34.5H43L29.5 17.5 36 3Z" fill="#D1FD40" />
      <path d="M28 22.5h18l-5.2-6.4H33.4L28 22.5Z" fill="#050505" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="4.5"
        width="20"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m3 6 9 7 9-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="10"
        width="18"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 10V7a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 3 18 18M10.6 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.8M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7c1.2 0 2.3-.3 3.3-.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 2.1 3.5 1.5.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4.3-2.6 5.2-5.1 5.5.4.3.8 1 .8 2v3c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9Z"
      />
    </svg>
  );
}

export default function SignInPreviewPage() {
  return (
    <main className="ath-signin-page">
      <div className="ath-signin-shell">
        <section
          className="ath-signin-visual"
          aria-label="Athletica football campaign"
        >
          <img
            className="ath-signin-photo"
            src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=90"
            alt="Football campaign visual"
            fetchPriority="high"
          />

          <div className="ath-signin-brand" aria-label="Athletica">
            <BrandMark />
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

            <form className="ath-signin-form">
              <label className="ath-signin-field">
                <span className="ath-signin-field-icon" aria-hidden="true">
                  <MailIcon />
                </span>
                <span className="ath-signin-sr-only">Email address</span>
                <input
                  className="ath-signin-input"
                  type="email"
                  name="email"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="ath-signin-field">
                <span className="ath-signin-field-icon" aria-hidden="true">
                  <LockIcon />
                </span>
                <span className="ath-signin-sr-only">Password</span>
                <input
                  className="ath-signin-input"
                  type="password"
                  name="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="ath-signin-options">
                <label>
                  <input type="checkbox" name="rememberMe" />
                  <span>Remember me</span>
                </label>
                <button type="button">Forgot password?</button>
              </div>

              <button className="ath-signin-submit" type="button">
                Sign In
              </button>
            </form>

            <div className="ath-signin-divider">
              <span>or continue with</span>
            </div>

            <div className="ath-signin-socials">
              <button className="ath-signin-social" type="button">
                Google
              </button>
              <button className="ath-signin-social" type="button">
                GitHub
              </button>
            </div>

            <p className="ath-signin-signup">
              Don&rsquo;t have an account?{" "}
              <a href="/admin/signup">Sign Up</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
