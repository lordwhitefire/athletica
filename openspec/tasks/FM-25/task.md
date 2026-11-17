# FM-25 — Sentry + uptime + monitoring

**Phase:** 6 | **Spec:** hardening | **Supersedes:** ROLL-17 | **Depends on:** FM-05, FM-18, FM-21 | **Status:** ⬜ Pending

## What we're building

The monitoring stack: Sentry (server + client errors, email alert, `sendDefaultPii: false`), an uptime ping on key URLs, drop-reason telemetry (from FM-05), payout-pipeline stuck-request alerts (from FM-18), Creators API error-rate alerts (from FM-20), and Vercel cron jobs (salt rotation, dead-link probe, Creators API refresh, payout-term eligibility check).

## Why it matters

Sentry catches errors; it does NOT catch "the site is down" — that's the uptime ping's job. Drop-reason telemetry tells you why events disappear. Payout stuck-request alerts catch a payout that's been `requested` for 30 days with no admin action. Creators API error-rate alerts catch a silently-failing API booster. Without these, the owner learns about breakage from silence.

## What success looks like (benchmarks)

- After this, when a server error occurs, Sentry captures it (server + client) with PII off, and the owner receives an email alert.
- After this, when a key URL (homepage, a product page, `/go/[id]`) is down, an uptime ping alerts the owner (Sentry would not).
- After this, drop-reason counts (bot, spam_referrer, dc_ip, etc.) are queryable as a grouped total for observability.
- After this, a payout stuck in `requested` for >N days (configurable, e.g. 7) raises a stuck-request alert.
- After this, a high Creators API error rate (when enabled) raises an alert.
- After this, Vercel cron runs the scheduled jobs: salt rotation (90s), dead-link probe (daily), Creators API refresh (TTL-based, when enabled), payout-term eligibility check (daily).
- After this, Sentry's `sendDefaultPii` is `false` — no visitor IP, no PII, reaches Sentry.

## Context the Builder needs

- `@sentry/nextjs` for Next.js integration.
- Uptime ping: a free external service (e.g. UptimeRobot, BetterStack) hitting key URLs.
- Drop-reason telemetry from FM-05's named enum.
- Payout-pipeline state from FM-18.
- Creators API client from FM-20.
- Vercel cron: defined in `vercel.json`.

## Boundaries

- Do not send PII to Sentry (`sendDefaultPii: false`).
- Do not rely on Sentry for "down" detection (use an uptime ping).
- Do not let cron jobs flood (throttle the dead-link probe; rate-limit the Creators API refresh).
- Do not alert on every transient error (configure thresholds).
