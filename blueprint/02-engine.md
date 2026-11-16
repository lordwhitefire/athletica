# 02 — Engine (10 Parts)

**Blueprint:** Athletica (FULL MARKETPLACE)
**Mode:** Plan

The Engine sits under the Build Layers. UX Thread for the whole Engine: *when something goes wrong or is slow, what does the user see?* — plain 404 for missing/unpublished/auth-failure; greyed CTA for dead/incomplete Amazon links; Sentry captures errors silently; the redirect never fails on a stats-write outage; dashboards degrade from SSE to polling on flaky connections.

---

## 1. Architecture

- **Big parts:** Next.js 16.3.4 App Router (Vercel) — storefront + admin + affiliate dashboards + route handlers; Supabase (Postgres + Auth + RLS); Sanity CMS (images); Upstash Redis (rate limit + dedup + cache + salt); Sentry (errors); Amazon (Creators API optional + Associates redirect, 22 marketplaces); email (SMTP/Resend).
- **Stack (02, Decided):** Next.js 16.3.4, React 19.2.8, Tailwind v4, Supabase JS, `@supabase/ssr`, Sanity client, `@upstash/ratelimit`, `ua-parser-js`, `@sentry/nextjs`, Creators API client (optional), `next-intl` (i18n), `zod` (validation).
- **Frontend organisation (05, Decided):** App Router. Server Components for data (storefront, product, admin/affiliate lists). Client components for interactivity (gallery, carousel, CTA, editors, live dashboards). Route handlers for `/api/*`. `src/proxy.ts` fast-path gate. Layered action-client: `actionClient → authActionClient → adminActionClient / affiliateActionClient`.
- **Platforms (65, Decided):** Web only. Phone + PC. No mobile app.
- **Landing page vs app shell (78, Decided):** Storefront homepage at `/`; admin shell `/admin/*`; affiliate shell `/affiliate/*`. Separate layouts.

## 2. Integration

- **Outside services (80, Decided):** Supabase, Sanity, Amazon (Creators API optional + Associates, 22 marketplaces), Upstash Redis, Sentry, Vercel (edge + cron), email (SMTP/Resend), MaxMind GeoIP2 (offline geo).
- **Own API (57, Decided):** REST `/api/admin/*`, `/api/affiliate/*`, `/api/analytics`, `/api/affiliate/postback` (S2S bearer token), `/api/affiliate/dashboard`, `/go/[id]` (redirect). Server Components for initial data.
- **Outgoing webhooks (61, Skip):** None. Creators API (when enabled) polled via cron.
- **For each service:** account + keys + test mode before build. Supabase project (configured). Sanity project `cuiis46d` (configured). Upstash (in deps). Sentry (add DSN). Amazon Associates tags (the admin's own, per-marketplace; owner supplies) + Creators API credential ID + secret (only once the owner is eligible). Email (configure SMTP/Resend).

## 3. Communication between parts

- **C1 (Decided):** Direct calls (Server Component → service → Supabase). Click pipeline via `waitUntil`. Creators API (when enabled) via scheduled fetch. Live dashboards via SSE (degrade to short-polling). No message queue.
- **Background jobs (58, Decided):** `waitUntil` for click recording. Vercel cron jobs: salt rotation (90s), dead-link HEAD probe (daily), Creators API refresh (only when enabled; offers ≤ 1 hour, other fields ≤ 1 day), payout-term eligibility check (daily). SSE for live dashboards.
- **C2 (Decided):** Click writes best-effort (`Promise.allSettled`). Redirect survives stats outage. Dedup cache absorbs replays. SSE reconnects on drop.
- **C3 (Decided):** Identity-hash dedup (1h). Postback UNIQUE(`account_id`,`trace`). Idempotent SSE (event IDs).

## 4. Runtime environment (R1–R5)

- **R1 (Decided):** Server: Vercel (Node.js, Next.js 16.3.4). Browser: client components. SSE on route handlers (Vercel Pro for long-lived).
- **R2 (Decided):** Node 20+, Next.js 16.3.4, React 19.2.8, Postgres 15, `@supabase/ssr`, `@upstash/ratelimit`, `ua-parser-js`, `@sentry/nextjs`, Creators API client (optional), `next-intl`, `zod`.
- **R3 (Decided):** Vercel default (10s serverless, 60s Pro). Click write < 50ms or backgrounded. Creators API (optional) 1 TPS / 8,640 per day at start. SSE long-lived (Pro).
- **R4 (Decided):** Slow mobile (Nigeria), in-app browsers, power cuts. Mobile LCP target. SSE degrades to polling on flaky connections.
- **R5 (Decided):** Dev (local), Preview (Vercel preview), Production (`*.vercel.app` or custom domain). Same Supabase project, schema-isolated (`rollout` + `affiliate`).

## 5. Deployment

- **Deployment (18, Decided):** One public Vercel project. Preview per PR. Rollback = redeploy. Add `vercel.json` with cron definitions (salt rotation, dead-link probe, Creators API refresh, payout-term check).
- **App store (66, Skip):** No mobile app.
- **App updates (70, Skip):** No mobile app.

## 6. Configuration

- **Configuration (14, Decided):** `.env.local`/Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server), `SANITY_WRITE_TOKEN` (server), `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`, `AMAZON_ASSOCIATES_TAGS` (JSON, the admin's tags, per-marketplace, when supplied), `CREATORS_API_CREDENTIAL_ID` + `CREATORS_API_CREDENTIAL_SECRET` + `CREATORS_API_CREDENTIAL_VERSION` (3.1/3.2/3.3; optional until eligible), `EMAIL_*` (SMTP/Resend). Remove legacy `NEXT_PUBLIC_SYSTEM_TYPE`. Leak plan: rotate Supabase service key + Sanity token; revoke door-keys/invites on compromise.

## 7. Security

- **Auth (43, Decided):** Admins: three locks (invite → door-key → JWT role, `getClaims()`, fail-silent 404). Affiliates: email/password + email verify + admin approval (JWT, ownership-scoped). Layered action-client. Ownership RLS for affiliate tables; role-based for admin tables.
- **Cookies/sessions (28, Decided):** Door-key (HttpOnly, SameSite=Lax, Path=/admin, 30d, Secure). Admin JWT. Affiliate JWT. No visitor cookies. Visitor identity hashed server-side.
- **Rate limiting (63, Decided):** Upstash sliding window, per-endpoint policies, fail-open 1s. Explicit `redirect` policy. Click dedup (1h). Signin + signup + postback rate limits. Bot filter on click path.
- **Security (77, Decided):** HTTPS. SHA-256 tokens. Service-role isolated. RLS + `FORCE` + `(select auth.jwt())` / `(select auth.uid())` wrappers. EU IP redaction. `rel="nofollow noopener"` on Amazon CTA. `SECURITY DEFINER` for affiliate membership. `zod` validation.

## 8. Reliability

- **Error handling (13, Decided):** Neutral auth errors. Plain 404. Sentry (server + client). Error-tolerant click writes. Transactional payout flow (no partial state). Branded not-found.
- **Monitoring (19, Decided):** Sentry (server + client, email, PII off). Uptime ping on key URLs. Drop-reason telemetry (grouped count). Payout-pipeline stuck-request alerts. Creators API error-rate alert (when enabled).
- **Offline/PWA (27, Skip):** No PWA. Dashboards degrade to polling.
- **Backup (31, Decided):** Supabase daily + PITR (Pro). Sanity CDN (versioned). Git. Rollback = redeploy.
- **Offline mobile (69, Skip):** No mobile app.

## 9. Scalability

- **Scalability (76, Decided):** Single Supabase Pro. `analytics` partitioned by month. Upstash for hot dedup/cache. Vercel edge + Sanity CDN. Upgrade path: Supabase read replicas + ClickHouse at >5M clicks/month. Affiliate ledger scales with Postgres (append-only, indexed).

## 10. Resource management

- **Performance (08, Decided):** Mobile LCP. `next/image` with Sanity domains. `getClaims()` not `getUser()`. `waitUntil` for click writes. Upstash cache for hot link + product records. `<Suspense>` for gallery/carousel. SSE over polling (fewer requests).
- **Code splitting (30, Decided):** Auto-splitting. Admin + affiliate dashboards lazy-loaded. Gallery/carousel in `<Suspense>`. Charts dynamic-imported.
- **Mobile perf (72, Skip):** No mobile app. Covered by 08.

---

## Engine summary

19 Decided, 6 Skip (all mobile-app or no-webhook surfaces). No Engine gap is left Pending.
