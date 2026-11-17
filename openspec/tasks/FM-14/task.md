# FM-14 — Live analytics dashboard

**Phase:** 3 | **Spec:** admin | **Supersedes:** ROLL-08 | **Depends on:** FM-05 | **Status:** ⬜ Pending

## What we're building

The `/admin/analytics` dashboard — total views, total clicks, CTR, per product, per source (instagram/whatsapp/direct), per affiliate, 7/30/90 days, payout pipeline status, drop-reason counts — delivered **live** via SSE (with short-polling fallback on flaky connections), with honest empty/loading/error states.

## Why it matters

This is how the owner sees what's working. A stale dashboard (manual refresh) hides today's reality. A fake-zero dashboard lies when there's no data. A live dashboard with honest states tells the owner exactly what happened, when, and where the pipeline is stuck.

## What success looks like (benchmarks)

- After this, when the owner opens `/admin/analytics`, they see live view/click counts updating without a manual refresh (SSE).
- After this, when the owner switches the date range (7/30/90 days), the charts update.
- After this, the dashboard shows CTR (clicks ÷ views) per product + per source.
- After this, the dashboard shows per-affiliate performance (clicks attributed to each tracker).
- After this, the dashboard shows the payout pipeline status (count of payouts in each status: requested/scheduled/paid/rejected).
- After this, the dashboard shows drop-reason counts (bot, spam_referrer, dc_ip, etc. — grouped, from FM-05's telemetry).
- After this, when there's no data for the selected range, the dashboard shows "No data yet" (not zeros, not a blank chart).
- After this, when the SSE connection drops (flaky network), the dashboard falls back to short-polling + a "reconnecting" indicator, then resumes SSE.
- After this, the dashboard is admin-role-checked.

## Context the Builder needs

- FM-05 produces the analytics data (views, clicks, drop-reason telemetry). FM-18 produces the payout pipeline.
- Charts: dynamic-imported (FM-30/area 30 — keep bundle small).
- SSE on a route handler (Vercel Pro for long-lived); short-polling fallback (every 10–15s) when SSE drops.
- Grouped COUNT queries (not N+1).
- Empty state: "No data yet" — no fake zeros.

## Boundaries

- Do not show fake zeros (empty is empty).
- Do not make the dashboard a hard dependency on SSE (polling fallback for flaky networks — Nigerian context).
- Do not use N+1 queries for the charts.
- Do not expose affiliate-level data to a non-admin (role check).
- Do not ship heavy chart libraries in the public bundle (admin is lazy-loaded).
