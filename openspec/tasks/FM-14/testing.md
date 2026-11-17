# FM-14 — Testing (live analytics dashboard)

**Task:** FM-14 | **Verify behavior, not UI.**

## What behavior to verify

1. Are the counts live (update without manual refresh)?
2. Does the date-range switch work?
3. Are CTR + per-source + per-affiliate + payout-pipeline + drop-reason views present?
4. Does empty show "No data yet" (not zeros)?
5. Does SSE fall back to polling on a dropped connection?
6. Is the dashboard admin-role-checked?

## How to verify (behavioral)

- **Live:** open the dashboard, note the view count; in another tab, open a product page; the dashboard's view count increments within seconds (SSE).
- **Date range:** switch from 7 days to 30 days → the charts re-query + update.
- **CTR:** confirm a product's CTR = its clicks ÷ its views (math checks out).
- **Per-source:** the source split shows instagram/whatsapp/direct with correct counts.
- **Per-affiliate:** each tracker's click count matches the balance ledger's attributed clicks.
- **Payout pipeline:** the payout view shows counts per status (requested/scheduled/paid/rejected).
- **Drop reasons:** the drop-reason panel shows grouped counts (bot, spam_referrer, dc_ip, etc.).
- **Empty:** select a date range with no traffic → "No data yet" (not zero bars).
- **SSE drop:** throttle the network / kill the SSE connection → a "reconnecting" indicator appears; the dashboard continues updating via short-polling; on recovery, SSE resumes.
- **Role check:** with no admin session, open `/admin/analytics` → 404.

## What "working" means

- The dashboard reflects reality in near-real-time.
- The numbers are honest (CTR math works, empty is empty).
- The pipeline is observable (payout status, drop reasons).
- It survives a flaky connection.

## What to report

- The time between a product view and the dashboard count increment.
- The CTR math for a sample product.
- The source split + per-affiliate counts.
- The payout-pipeline status counts.
- The drop-reason grouped counts.
- The empty-state copy.
- The SSE-drop → polling → SSE-resume behavior.
- The HTTP status for an unauthenticated dashboard request.
