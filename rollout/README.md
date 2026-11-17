# Athletica — football affiliate marketplace

A Next.js 16 app: a public storefront (homepage + catalog + product detail), a private admin workspace (products + analytics + payouts), and an affiliate dashboard. Redirects visitors to Amazon with the affiliate tag; records clicks honestly (bots filtered, duplicates deduped, EU IPs redacted, identity hashed not stored).

## Setup

```bash
cd rollout
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

## Environment variables (`.env.example`)

See `.env.example` for the full list. Essentials:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (never in the browser).
- `SANITY_WRITE_TOKEN` — server-only (Sanity image uploads).
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limiting + click dedup + salt cache.
- `SENTRY_DSN` — error monitoring (PII off).
- `AMAZON_ASSOCIATES_TAG` — your Associates tag (per-marketplace in the `marketplaces` table).
- `AMAZON_CREATORS_CREDENTIAL_ID`, `AMAZON_CREATORS_CREDENTIAL_SECRET` — the Creators API (optional booster; only when eligible).
- `AFFILIATE_POSTBACK_TOKEN` — shared bearer for the S2S conversion postback.
- `CRON_SECRET` — protects the `/api/cron` endpoint (Vercel sets this).

## Architecture

See `blueprint/` (the Plan-mode blueprint) + `openspec/changes/athletica-full-marketplace/` (the architecture change with specs + task registry). The architect handoff maps each blueprint decision to the implementing files.

## Running the SQL migrations

Run `rollout/supabase-rollout-*.sql` files in the Supabase SQL Editor in order:
1. `supabase-rollout-schema.sql` (base — existing)
2. `supabase-rollout-admin-keys.sql` (existing)
3. `supabase-rollout-schema-updates.sql` (existing)
4. `supabase-rollout-rls-policies.sql` (existing — then the FM-02 file rewrites policies with the wrapper)
5. `supabase-rollout-fm02-full-marketplace.sql` (FM-02 — the full-marketplace schema + RLS rewrite)
6. The RPCs + `dead_link` column (see `rollout/supabase-rollout-fm02-rpcs.sql` — integration step).

## Admin guide (one-pager)

1. **Sign in:** redeem an invite code at `/admin/signup?code=...` (generate one with `node scripts/issue-invite.mjs <auth-user-id>`). Then sign in at `/admin/signin`.
2. **Products:** `/admin/products` — create, edit, set status (draft/active/archived), bulk-select + bulk-archive, CSV import (two-phase: map → process).
3. **Media:** `/admin/media` — upload (JPEG/PNG/WebP/AVIF ≤5MB), browse, delete.
4. **Analytics:** `/admin/analytics` — live view/click/CTR, source split, payout pipeline.
5. **Affiliates + payouts:** approve pending affiliates; review payout requests (schedule / reject / mark paid).

## Affiliate guide (one-pager)

1. **Sign up:** `/affiliate/signup` — multi-step (profile → payout details → terms). Verify your email. Wait for admin approval.
2. **Trackers:** `/affiliate/trackers` — create a tracker, copy its `/go/[tracker-id]` link, share it.
3. **Balance:** `/affiliate/balance` — your commission balance (live). Clicks attributed to your trackers.
4. **Payouts:** `/affiliate/payouts` — request a payout when above the minimum. The admin reviews + schedules.

## Tech

Next.js 16.3.4 (App Router) · React 19 · Tailwind v4 · Supabase (Postgres + Auth + RLS) · Sanity CMS · Upstash Redis · Sentry · `ua-parser-js` · `@upstash/ratelimit`.
