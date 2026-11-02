import { notFound } from 'next/navigation';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { hashToken } from '@/lib/auth/door-key';

type InviteRow = {
  id: string;
  user_id: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign up',
  description: 'Admin sign-up',
};

function BrandMark() {
  return (
    <svg
      className="brand-mark"
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

function UserIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7.5" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4.5" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="m3 6 9 7 9-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="10" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3 3 18 18M10.6 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.1 3.8M6.2 6.2C3.5 8.1 2 12 2 12s3.6 7 10 7c1.2 0 2.3-.3 3.3-.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z" />
      <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4A20 20 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 2.1 3.5 1.5.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4.3-2.6 5.2-5.1 5.5.4.3.8 1 .8 2v3c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M18.5 2 6 18h8l-1 12L26 13h-8l.5-11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function OfferIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m16 2 14 14-14 14L2 16 16 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m12 20 8-8M12.2 12h.1M19.7 20h.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M9 4h14v7c0 5-3 8-7 8s-7-3-7-8V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7H4v3c0 4 2 6 6 6M23 7h5v3c0 4-2 6-6 6M16 19v6m-6 3h12m-10-3h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  if (!code) {
    notFound();
  }

  const tokenHash = hashToken(code);
  const cookieStore = await cookies();

  // admin_access_keys isn't in the generated DB types yet — cast through any.
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => AnyChain;
  };

  type AnyChain = {
    select: (cols: string) => AnyChain;
    eq: (col: string, val: string | number | null) => AnyChain;
    is: (col: string, val: null) => AnyChain;
    gt: (col: string, val: string) => AnyChain;
    maybeSingle: () => Promise<{ data: InviteRow | null; error: unknown }>;
    update: (vals: Record<string, unknown>) => AnyUpdateChain;
  };

  type AnyUpdateChain = {
    eq: (col: string, val: string | number) => Promise<{ error: unknown }>;
  };

  const { data: invite, error: findError } = await supabase
    .from('admin_access_keys')
    .select('id, user_id, expires_at, used_at, revoked_at')
    .eq('token_hash', tokenHash)
    .eq('kind', 'invite')
    .is('used_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (findError || !invite) {
    notFound();
  }

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Join the Athletica community">
        <img
          className="auth-visual-image"
          src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=90"
          alt="Football stadium under dramatic floodlights"
          fetchPriority="high"
        />

        <div className="auth-brand" aria-label="Athletica">
          <BrandMark />
          <span className="brand-name">ATHLETICA</span>
        </div>

        <div className="auth-campaign">
          <h2 className="campaign-title">
            Join the
            <br />
            <span className="lime">Athletica</span> Family
          </h2>

          <p className="campaign-copy">
            Get exclusive updates, early access
            <br />
            to drops, and more.
          </p>

          <div className="signup-benefits" aria-label="Membership benefits">
            <div className="signup-benefit">
              <BoltIcon />
              <span>Fast Access</span>
            </div>
            <div className="signup-benefit">
              <OfferIcon />
              <span>Exclusive Offers</span>
            </div>
            <div className="signup-benefit">
              <TrophyIcon />
              <span>Football Culture</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="signup-title">
        <div className="auth-content">
          <div className="auth-heading-rule" />

          <h1 className="auth-title" id="signup-title">
            Create Account
          </h1>

          <p className="auth-description">
            Join Athletica and be part of something bigger.
          </p>

          <form className="auth-form" action="/api/admin/auth/signup" method="POST">
            <input type="hidden" name="code" value={code} />

            <label className="auth-input-wrap">
              <span className="auth-input-icon">
                <UserIcon />
              </span>
              <span className="sr-only">Full Name</span>
              <input
                className="auth-input"
                type="text"
                name="name"
                placeholder="Full Name"
                autoComplete="name"
                required
              />
            </label>

            <label className="auth-input-wrap">
              <span className="auth-input-icon">
                <MailIcon />
              </span>
              <span className="sr-only">Email Address</span>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Email Address"
                autoComplete="email"
                required
              />
            </label>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <LockIcon />
              </span>
              <label className="sr-only" htmlFor="signup-password">
                Password
              </label>
              <input
                className="auth-input"
                id="signup-password"
                type="password"
                name="password"
                placeholder="Password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                className="password-toggle"
                type="button"
                aria-label="Show password"
                aria-pressed={false}
              >
                <EyeIcon visible={false} />
              </button>
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <LockIcon />
              </span>
              <label className="sr-only" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                className="auth-input"
                id="confirm-password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                className="password-toggle"
                type="button"
                aria-label="Show confirm password"
                aria-pressed={false}
              >
                <EyeIcon visible={false} />
              </button>
            </div>

            <label className="auth-terms">
              <input
                className="auth-terms-checkbox"
                type="checkbox"
                name="acceptedTerms"
                required
              />
              <span>
                I agree to the{' '}
                <a className="auth-link" href="/terms">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a className="auth-link" href="/privacy">
                  Privacy Policy
                </a>.
              </span>
            </label>

            <button
              className="signup-submit"
              type="submit"
            >
              <span>Create Account</span>
              <ArrowRightIcon />
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button
              className="social-button"
              type="button"
              disabled
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <button
              className="social-button"
              type="button"
              disabled
            >
              <GithubIcon />
              <span>Continue with GitHub</span>
            </button>
          </div>

          <p className="auth-login">
            Already have an account?{' '}
            <a className="auth-link" href="/admin/login">
              Sign in
            </a>
          </p>

          {error && (
            <p
              className="auth-feedback"
              data-error="true"
              role="status"
              aria-live="polite"
            >
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
