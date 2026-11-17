# FM-24 — Legal pages

**Phase:** 6 | **Spec:** hardening | **Depends on:** — | **Status:** ⬜ Pending

## What we're building

The legal surface: `/privacy` (privacy policy), `/terms` (terms of service), `/cookie-notice`, `/affiliate-agreement` (commission terms, payout terms, reversal policy). Amazon Associates disclosure ("I earn from qualifying purchases") on every product page. GDPR: EU IP redaction (already in the click pipeline) + affiliate data deletion-on-request + right to export. Payout tax docs per jurisdiction.

## Why it matters

Amazon Associates requires the disclosure. GDPR requires honest privacy + deletion/export. The affiliate agreement defines the commercial relationship (commission, payout terms, reversals). Without these, the marketplace is not shippable legally.

## What success looks like (benchmarks)

- After this, every product page carries the Amazon Associates disclosure ("I earn from qualifying purchases").
- After this, `/privacy` exists + accurately describes: analytics IP+UA hashing, Sentry (PII off), affiliate data, admin email; no raw IP stored.
- After this, `/terms` exists + covers the storefront terms.
- After this, `/cookie-notice` exists + describes the admin/affiliate session cookies (and the absence of visitor cookies).
- After this, `/affiliate-agreement` exists + covers commission terms, payout terms (net-30 etc.), reversal policy (Amazon clawbacks).
- After this, all legal pages are linked in the storefront footer + the affiliate signup flow.
- After this, on request, an affiliate's data can be deleted + their data exported (GDPR right to erasure + portability).
- After this, payout tax docs (e.g. 1099 for US affiliates where applicable) are produced/facilitated per jurisdiction.

## Context the Builder needs

- The locked constraints (Amazon disclosure, GDPR, privacy, terms).
- The click pipeline (FM-04/FM-05) already redacts EU IPs — the privacy policy describes this honestly.
- The affiliate agreement ties to the campaign config (FM-16: commission_type, payout_term) + reversal support (FM-17).
- Legal pages are plain HTML/markdown, fast, linked from the footer.

## Boundaries

- Do not describe data practices inaccurately (the privacy policy must match what the system actually does — hashing, PII-off Sentry, EU redaction).
- Do not omit the Amazon disclosure (Associates requirement).
- Do not leave legal pages unlinked (footer + affiliate signup).
- Do not skip the GDPR erasure/export path.
- Payout tax docs depend on jurisdiction — facilitate, don't fabricate.
