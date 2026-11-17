// FM-24: Privacy policy page. Accurately describes what the system does.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-invert">
      <h1>Privacy Policy</h1>
      <p>Athletica is a football affiliate marketplace. This page describes what we do with your data.</p>
      <h2>Analytics</h2>
      <p>We record page views and clicks server-side. We do NOT store your raw IP address. We compute a daily visitor hash from your user agent, IP, and our domain using SipHash64 with a rotating salt. The hash cannot be reversed to identify you and is unlinkable across sites.</p>
      <h2>EU visitors</h2>
      <p>If you are visiting from an EU/EEA country, we redact your IP address (set it to empty) before any storage. We do not set cookies on the public storefront.</p>
      <h2>Error monitoring</h2>
      <p>We use Sentry to capture server and client errors. Personally Identifiable Information (PII) is disabled in our Sentry configuration.</p>
      <h2>Affiliate accounts</h2>
      <p>If you sign up as an affiliate, we store your email, payout details, and the clicks/commissions attributed to your trackers. You can request deletion or export of your data — contact us.</p>
      <h2>Contact</h2>
      <p>To exercise GDPR rights (erasure, export) or ask questions, contact the owner.</p>
    </article>
  );
}
