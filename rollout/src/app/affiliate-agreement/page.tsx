export default function AffiliateAgreementPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-invert">
      <h1>Affiliate Agreement</h1>
      <h2>Commissions</h2>
      <p>Commission rates, types (percentage or fixed), and recurring terms are defined per campaign. Your tracker's assigned campaign determines your rate.</p>
      <h2>Payouts</h2>
      <p>Payouts are initiated by you and reviewed by the admin. A minimum balance (per campaign) is required to request a payout. Payout terms (e.g. net-30) delay eligibility to protect against refund-driven clawbacks.</p>
      <h2>Reversals</h2>
      <p>If Amazon claws back a commission (e.g. a returned order), a reversal row is inserted into your balance ledger. The ledger is append-only — reversals are negative rows, never deletions.</p>
      <h2>Trackers</h2>
      <p>Your tracker links go to <code>/go/[tracker-id]</code>. Clicks are attributed to your tracker. Bots are filtered; duplicate clicks within an hour are deduplicated.</p>
    </article>
  );
}
