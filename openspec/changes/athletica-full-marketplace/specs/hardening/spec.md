# Spec — Hardening

**Change:** athletica-full-marketplace | **Phase:** 6 | **Tasks:** FM-23…FM-26
**Sources:** `blueprint/02-engine.md` (Reliability), `blueprint/03-project-ring.md`, RE-03 §2.1 (locales), RE-06 §2.4 (telemetry).

## Intent

Hardening is what makes the marketplace shippable and operable: it speaks the visitor's locale, it satisfies Amazon + GDPR + the affiliate agreement, it tells the owner when it breaks, and it's documented well enough for the owner and the next developer to run it. Nothing new is built here — everything is the closing-out of the previous five phases.

## Requirements

**i18n (FM-23):** 22 Amazon marketplace locales supported on the storefront + affiliate dashboard. UI strings localized (JSON catalog per locale). Locale resolved from URL param (`?locale=fr`) → visitor IP → affiliate preference → default English. Falls back to English if a locale is missing. `next-intl` (or equivalent). English base; other locales may need human translation (flagged).

**Legal (FM-24):** `/privacy` (privacy policy — analytics hashing, Sentry PII-off, affiliate data, admin email). `/terms` (terms of service). `/cookie-notice` (admin/affiliate session cookies; no visitor cookies). `/affiliate-agreement` (commission terms, payout terms, reversal policy). Amazon Associates disclosure ("I earn from qualifying purchases") on every product page. GDPR: EU IP redaction (already implemented in the click pipeline) + affiliate data deletion on request + right to export. Payout tax docs per jurisdiction (e.g. 1099 for US affiliates, where applicable). All legal pages linked in the footer + affiliate signup.

**Sentry + uptime + monitoring (FM-25):** `@sentry/nextjs` — server + client errors, email alert, `sendDefaultPii: false`. Uptime ping on key URLs (Sentry catches errors, not "the site is down"). Drop-reason telemetry (named enum, grouped count — already in the analytics pipeline). Payout-pipeline stuck-request alerts (a payout in `requested` for >N days). Creators API error-rate alert (when enabled). Vercel cron jobs for: salt rotation (90s), dead-link HEAD probe (daily), Creators API refresh (TTL-based, when enabled), payout-term eligibility check (daily).

**Documentation + handoff (FM-26):** `rollout/README.md` (real setup/run/deploy — replace the default create-next-app). `.env.example` (kept current: Supabase, Sanity, Upstash, Sentry, Amazon tags per-marketplace, Creators API creds, email). Changelog per release. API docs (route handler comments + an `api/` note). Admin guide (one-pager: sign in, products, variants, bulk, CSV import, media, analytics, payouts, affiliates). Affiliate guide (signup, trackers, balance, payout request). Architect handoff (layer-by-layer file map — produced from `blueprint/`). Smoke + critical-path test notes per phase (owner ruling: no full suite).

## Behavior boundaries

- i18n falls back to English — never a broken page because a string is missing.
- Legal pages are plain HTML/markdown, fast, linked from the footer.
- Sentry PII is off. The visitor IP is never sent to Sentry (only the hash exists).
- Monitoring catches both "errors" (Sentry) and "down" (uptime ping) — they are different failures.
- Documentation is written for a smart person who just joined the project — complicated wording hides mistakes.
- No full test suite (owner ruling). The critical-path smoke tests are named per phase.

## What success looks like (phase gate — final)

- A visitor with `?locale=fr` sees French UI strings; a missing string falls back to English, not a broken page.
- Every product page carries the Amazon Associates disclosure.
- `/privacy`, `/terms`, `/cookie-notice`, `/affiliate-agreement` exist, are linked in the footer + affiliate signup, and accurately describe what the system does (hashing, Sentry PII-off, EU redaction, affiliate data).
- When a server error occurs, Sentry captures it (PII off) and the owner gets an email.
- When a product URL is down, the uptime ping alerts the owner (Sentry would not).
- A payout stuck in `requested` for >N days raises an alert.
- A new developer can clone the repo, read the README + `.env.example` + this blueprint + the architect handoff, and run the app locally without asking a question.
- The owner can operate the admin workspace + read analytics + review payouts using only the admin guide.
