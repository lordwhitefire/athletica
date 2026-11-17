export default function CookieNoticePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-invert">
      <h1>Cookie Notice</h1>
      <p>The public storefront does NOT set any cookies.</p>
      <p>The admin workspace and affiliate dashboard set a session cookie (HttpOnly, SameSite=Lax) required for sign-in. The admin door-key cookie is scoped to <code>/admin</code> and expires after 30 days of inactivity.</p>
      <p>We do not use third-party advertising cookies.</p>
    </article>
  );
}
