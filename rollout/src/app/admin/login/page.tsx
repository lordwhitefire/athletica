import { notFound } from 'next/navigation';
import { validateDoorKey } from '@/lib/auth/door-key-validate';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sign in',
  description: 'Admin sign-in',
};

export default async function LoginPage() {
  // Door-key check happens on the server, before the page is sent.
  // No cookie → 404. The cookie authenticates nobody; it only lets this page load.
  const valid = await validateDoorKey();
  if (!valid.ok) {
    notFound();
  }

  return (
    <main className="login-page">
      <form className="login-form" action="/api/admin/auth/signin" method="POST">
        <h1>Admin sign in</h1>
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />

        <button type="submit" className="login-btn">
          Sign in
        </button>
      </form>
      <p className="login-hint">
        Don't have a link? Ask the admin to issue one.
      </p>
    </main>
  );
}
