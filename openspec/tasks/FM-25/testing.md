# FM-25 — Testing (Sentry + uptime + monitoring)

**Task:** FM-25 | **Verify behavior, not UI.**

## What behavior to verify

1. Does Sentry capture server + client errors (PII off) + email the owner?
2. Does the uptime ping alert on a down URL (not Sentry)?
3. Are drop-reason counts queryable as a grouped total?
4. Does a stuck payout raise an alert?
5. Does a high Creators API error rate raise an alert?
6. Do the Vercel cron jobs run on schedule?

## How to verify (behavioral)

- **Sentry capture:** trigger a deliberate server error (e.g. a route that throws) → Sentry captures it; confirm `sendDefaultPii: false` in the config; the owner email arrives.
- **Uptime ping:** take a key URL offline (or point the ping at a dead URL) → the uptime service alerts (Sentry does NOT alert for "down").
- **Drop reasons:** query the telemetry → a grouped count per reason (bot/spam_referrer/dc_ip/etc.) is returned in one query.
- **Stuck payout:** create a payout in `requested` state, set its `created_at` to >N days ago → the stuck-request alert fires.
- **Creators API error rate:** simulate a persistent API error rate above threshold → the alert fires (only when the API is enabled).
- **Cron jobs:** inspect Vercel cron config → the salt rotation (90s), dead-link probe (daily), Creators API refresh (TTL-based), payout-term check (daily) are defined. Confirm each has run on schedule (Vercel cron logs).

## What "working" means

- Errors are caught + alerted (Sentry).
- Downtime is caught + alerted (uptime ping).
- Pipeline health is observable (drop reasons, stuck payouts, API error rate).
- Scheduled jobs run.

## What to report

- Whether Sentry captured the deliberate error + the PII-off config value.
- Whether the uptime ping alerted (and Sentry did not) on the down URL.
- The grouped drop-reason counts.
- Whether the stuck-payout alert fired.
- Whether the Creators API error-rate alert fired (when enabled).
- The Vercel cron config + the last-run timestamps for each job.
