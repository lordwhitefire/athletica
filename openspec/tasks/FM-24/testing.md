# FM-24 — Testing (legal pages)

**Task:** FM-24 | **Verify behavior, not UI.**

## What behavior to verify

1. Is the Amazon disclosure on every product page?
2. Do `/privacy`, `/terms`, `/cookie-notice`, `/affiliate-agreement` exist + describe real practices?
3. Are they linked in the footer + affiliate signup?
4. Does GDPR erasure work (an affiliate's data deleted on request)?
5. Does GDPR export work (an affiliate's data exported)?
6. Are payout tax docs facilitated?

## How to verify (behavioral)

- **Disclosure:** open any product page → the "I earn from qualifying purchases" line is present (search the HTML).
- **Pages exist:** fetch `/privacy`, `/terms`, `/cookie-notice`, `/affiliate-agreement` → each returns 200 with real content.
- **Accuracy:** read `/privacy` → it mentions analytics IP+UA hashing, Sentry PII-off, no raw IP stored, EU redaction. It matches what the system actually does.
- **Links:** inspect the storefront footer + the affiliate signup flow → all four legal pages are linked.
- **GDPR erasure:** request deletion for a test affiliate → their `accounts/trackers/balance/payouts` rows are deleted (or anonymized); confirm via query.
- **GDPR export:** request export for a test affiliate → a JSON/CSV of their data is produced.
- **Tax docs:** (if jurisdiction-applicable) confirm the system facilitates producing a 1099 (or equivalent) — e.g. an admin action that generates a payout summary for a tax year.

## What "working" means

- The legal surface is complete + accurate + linked.
- GDPR rights are real (erasure + export).
- Tax docs are facilitated.

## What to report

- Whether the disclosure was on every product page.
- The HTTP status for each legal page.
- Whether `/privacy` matches the actual data practices (list any inaccuracy).
- Where the legal links appear (footer + signup).
- Whether erasure deleted/anonymized the affiliate's rows.
- Whether export produced a file + its format.
- Whether tax-doc facilitation exists.
