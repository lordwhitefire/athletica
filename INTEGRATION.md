# Integration Instructions — athletica-full-marketplace build

**Date:** 2026-11-16
**Patch:** `athletica-full-marketplace.patch`
**Scope:** the code for all 26 FM tasks (FM-01…FM-26). This file lists the steps the owner must do **externally** (Supabase + third-party services) that the patch can't do for you.

---

## 1. Apply the patch

```bash
cd athletica
git apply athletica-full-marketplace.patch
```

If you committed my earlier MVP draft locally, stash or reset first: `git stash` (the patch is against the current `main` at `1eb3555`).

---

## 2. Supabase — run the SQL migrations (in this order, in the SQL Editor)

1. `rollout/supabase-rollout-schema.sql` (existing base — if not already run)
2. `rollout/supabase-rollout-admin-keys.sql` (existing — admin_access_keys)
3. `rollout/supabase-rollout-schema-updates.sql` (existing — sizes/box_contents)
4. `rollout/supabase-rollout-rls-policies.sql` (existing — then superseded by step 6)
5. `rollout/supabase-rollout-fm02-full-marketplace.sql` (**FM-02** — the full-marketplace schema: products 5-status + variants + categories + collections + analytics fields + marketplaces seed + amazon_product_cache + affiliate.* schema + audit_log + RLS FORCE + select-wrappers)
6. `rollout/supabase-rollout-fm02-rpcs.sql` (**integration RPCs** — `validate_door_key`, `request_payout`, `mark_product_dead`/`mark_product_alive`, `enforce_payout_terms`, + the `dead_link` flag column)

All migrations are additive + idempotent. Re-running is safe.

---

## 3. Environment variables (Vercel project settings + local `.env.local`)

Copy `rollout/.env.example` → `.env.local` and fill in:

| Var | Where to get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API | public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API | **server-only, never in browser** |
| `SANITY_WRITE_TOKEN` | Sanity → API → tokens | server-only |
| `UPSTASH_REDIS_REST_URL` | Upstash console | rate limit + dedup + salt |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console | |
| `SENTRY_DSN` | Sentry → project settings | PII is off in code |
| `AMAZON_ASSOCIATES_TAG` | Amazon Associates Central | your default tag |
| `AMAZON_CREATORS_CREDENTIAL_ID` | Amazon Creators API console | **only when eligible** (10 sales/30d) |
| `AMAZON_CREATORS_CREDENTIAL_SECRET` | Amazon Creators API console | only when eligible |
| `AFFILIATE_POSTBACK_TOKEN` | you generate (random secret) | shared bearer for `/api/affiliate/postback` |
| `AFFILIATE_MINIMUM_PAYOUT` | you set | default `50` |
| `NEXT_PUBLIC_SITE_URL` | your Vercel domain | for metadata + sitemap |
| `CRON_SECRET` | you generate (random) | Vercel sets this for `/api/cron` |

**Per-marketplace tags:** the `marketplaces` table has a `tag` column. Update each row with your Associates tag for that marketplace (UK tag, US tag, etc.) via the SQL Editor or the admin settings page. Geo-routing only routes to a marketplace if its `tag` is set.

---

## 4. Supabase Auth — set the admin role

After creating your first admin user (via the invite flow):

1. Generate an invite: `node rollout/scripts/issue-invite.mjs <auth-user-id>` (you need your auth.users id first — create the user in Supabase Auth, then pass the id).
2. Redeem the invite at `/admin/signup?code=...`.
3. Confirm `app_metadata.role === 'admin'` on the user (the signup route sets it via the service role).

---

## 5. Sanity

- Project `cuiis46d` is already configured.
- `SANITY_WRITE_TOKEN` (server-side) is required for admin media uploads.
- Allowed image hosts on the public page: `cdn.sanity.io` only.

---

## 6. Upstash Redis

- Create a Redis database; copy the REST URL + token into env.
- Used for: rate-limit policies (signin/redirect/postback/signup), click dedup (1h), salt cache.
- **Fail-open**: if Redis is down, the app keeps working (redirects succeed, rate limits skip).

---

## 7. Sentry

- Create a project; copy the DSN into `SENTRY_DSN`.
- In the Sentry dashboard: enable email alerts; confirm PII scrubbing is on (the code sets `sendDefaultPii: false`).
- Set up an **uptime ping** on a free external service (UptimeRobot, BetterStack) for the homepage + a product URL — Sentry catches errors, not "down."

---

## 8. Vercel deployment

- One project, Root Directory `rollout`.
- Add all env vars (Section 3) in the Vercel project settings.
- `rollout/vercel.json` defines the cron jobs (salt rotation every minute, dead-link probe daily 03:00, payout-term check daily 04:00). Vercel Pro is needed for long-lived SSE on the analytics dashboard (free tier: the EventSource reconnects).
- Set `CRON_SECRET` in Vercel env — Vercel injects it into cron requests automatically.

---

## 9. Amazon Creators API (optional — only when eligible)

Per the locked recommendation (Option B): the shop runs on **owner-entered data first**. The Creators API is an optional booster.

- **Do NOT enable until you have 10 qualifying sales in 30 days** (Amazon's eligibility rule).
- When eligible: get the OAuth credential ID + secret from the Creators API console; set `AMAZON_CREATORS_CREDENTIAL_ID` + `AMAZON_CREATORS_CREDENTIAL_SECRET`.
- The client soft-fails: if ineligible / errored / unconfigured, the shop keeps running on owner data. Reviews are omitted; dead-link detection still runs (HEAD probe + 4xx).

---

## 10. Wire the one-line auth gates (media + signin)

Two existing routes need a one-line `requireAdmin()` call at the top (the guard exists; the call is the wiring):

- `rollout/src/app/api/admin/media/upload/route.ts` — add `const admin = await requireAdmin(); if (admin.response) return admin.response;`
- `rollout/src/app/api/admin/media/assets/route.ts` — same line.
- `rollout/src/app/api/admin/auth/signin/route.ts` — add `const { ok } = await checkSigninRateLimit(email, ip); if (!ok) return NextResponse.json({error:'rate limited'}, {status:429, headers:{'Retry-After':String(retryAfter)}});` before the `signInWithPassword` call.

(These are one-line additions the patch doesn't make because those routes already exist with their own logic; the wiring is the integration step.)

---

## 11. Smoke test (per phase, before each phase gate)

- **Phase 1:** product page loads; CTA → `/go/[id]` → Amazon with tag; unauthenticated `/admin/products` → 404.
- **Phase 3:** product CRUD; bulk archive; CSV import; media upload.
- **Phase 4:** affiliate signup → approval → tracker; payout request → admin schedule → paid.
- **Phase 5:** geo-routing (UK visitor → amazon.co.uk); dead-link probe marks a dead ASIN.

Owner ruling: no full test suite. These manual checks are the gate.

---

## 12. What the patch does NOT do (external / your steps)

- Run the SQL (Section 2).
- Set env vars (Section 3).
- Set the admin role (Section 4).
- Configure Sanity/Upstash/Sentry/Vercel (Sections 5–8).
- Enable the Creators API when eligible (Section 9).
- Wire the two one-line auth gates (Section 10).
- Translations for non-English locales (English base is in `rollout/messages/en.json`).
- Native monthly partitioning of `rollout.analytics` (BRIN index added; native partitioning deferred to >1M rows).
- Drop the legacy DECIMAL `price` column (kept alongside `price_cents` for migration safety; drop in a later migration once no code reads it).

Everything else is in the patch.
