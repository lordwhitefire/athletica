# Rollout 1 (ROLL-ARCH) Tasks

> Updated 2026-10-26 from the six-layer plan. `rollout/` is the Production app (the public showroom); `frontend/` is the Development app (the full football store + its office, not public). Where an older benchmark conflicts with the six-layer plan, these updated benchmarks and ROLL-12..18 win. The registry (`openspec/tasks-registry.md`) is the status record.

## Repository Foundation

### ROLL-00: Move git root to repository root; prepare `rollout/` directory
Move the git repository root from `frontend/` up to the `athletica/` root so the repo hosts both apps (`frontend/` = Development app, `rollout/` = Production app) in one git history. Only `frontend/` and `rollout/` are tracked; add a root `.gitignore` that ignores everything else. Re-point the index for already-tracked files (`git ls-files` loop: stage `frontend/<path>`, drop old `<path>`) — do NOT use `git mv` (after the `.git` move the old paths no longer resolve, so `git mv` silently fails). Commit ONLY the already-tracked file moves (one record commit); never commit uncommitted/untracked files; do not push (owner pushes after review).

**Benchmark:** After this change, `git rev-parse --show-toplevel` from the repository root prints the `athletica/` path; `git log` contains the full prior history PLUS ONE record commit; all tracked paths are under `frontend/`; `supabase/`, `studio-athletica/`, `data/`, `scripts/`, `openspec/`, `node_modules/`, etc. are ignored; and the pre-existing untracked files remain untracked.

## Rollout Database

### ROLL-01: Set up Rollout schema + types
Create the `rollout` schema in the EXISTING Supabase project (one project, two schemas: `public` = Development app, `rollout` = Production app). Create `rollout.products` (self-contained product fields) and `rollout.analytics` (views/clicks) per the schema in design.md. Create the `rollout/` Next.js app directory. Since there is no Supabase CLI, fetch the table structure via the REST API and write TypeScript types by hand.

**Benchmark:** After this change, the existing Supabase project has a `rollout` schema with `rollout.products` and `rollout.analytics`, a fresh `rollout/` Next.js app exists, and hand-written TypeScript types under `Database.rollout` reflect both tables.

## Rollout Services

### ROLL-02: Rollout Product Service
Create a `RolloutProductService` that queries only the `rollout` schema: getBySlug, getById, listProducts (search/status/sort/page/pageSize), createProduct, updateProduct, deleteProduct, publishProduct, unpublishProduct.

**Benchmark:** After this change, when a service function is called against the `rollout` schema, it returns/creates/updates/deletes products without touching the Development `public` schema.

### ROLL-03: Rollout Analytics Service
Create a `RolloutAnalyticsService` that records product view and Amazon click events and computes the Production metrics (total views, total clicks, CTR, per-product views/clicks, source split) for a date range, all scoped to the `rollout` schema.

**Benchmark:** After this change, recording a view/click and querying analytics for a date range returns the Production metrics from the `rollout` schema, including the Instagram/WhatsApp/Direct split.

### ROLL-04: Rollout Amazon Affiliate Service
Create the backend Amazon Affiliate Service that derives the affiliate URL from a product's ASIN plus server-side affiliate configuration at click time. Read the tag/store from env, store configuration separately, and do not store generated URLs.

**Benchmark:** After this change, given a product with an ASIN and a real tag/store, the service derives the affiliate destination; with no ASIN or a missing/placeholder tag/store it reports no destination.

## Rollout Customer Experience

### ROLL-05: Customer Product Details page (`/product/:slug`)
Build the customer Product Details page with the black/lemon/white-text visual system, hard 1440px cap, minimal header (ATHLETICA only, no footer), interactive image gallery (thumbnails + keyboard), editorial sections, loading/error states, and the Shop Product CTA. The page must show no price, use real content only, set product metadata/OG, use `next/image`, return a plain 404 for `/`, missing products, and unpublished products, and record a server-side view with `source` + daily `visitor_hash`.

**Benchmark:** After this change, when a user opens `/product/:slug` for a published product, they see the full editorial product page with no price and real content; a view is stored with source + hash; clicking Shop Product runs the affiliate flow; the page stays at 1440px max with no white surfaces; `/`, missing products, and unpublished products return a plain 404. **Superseded in detail by ROLL-13.**

## Rollout Admin

### ROLL-06: Rollout Admin Product Database (`/admin/products`)
Build the Production Product Database with Add Product, Search, Status filter, Sort, Pagination (page size 8), Edit, Publish/Unpublish, and Delete-with-confirmation, plus loading/error/empty states and retry. The admin routes stay dark until ROLL-15.

**Benchmark:** After this change, an admin can search, filter, sort, paginate, add, edit, publish/unpublish, and delete (with confirmation) products, with success/error toasts and no fake rows. **Auth and price validation are superseded by ROLL-15 and ROLL-16.**

### ROLL-07: Rollout Product Editor (Add/Edit)
Build the full Add/Edit Product form (Identity, Description, Key Benefits, Technical Details, Attributes, Sizes, Images, SEO, Tags) with slug auto-generation, SKU auto-generation, ASIN preservation, validation (name/slug required; price optional), busy/success/error save states, dirty-form protection, benefits/sizes editors, and Sanity image management.

**Benchmark:** After this change, an admin can create/edit a complete product with all sections, auto-slug/SKU, ASIN preserved on unrelated saves, validation that keeps the modal open, and dirty-close protection, with no data silently discarded. **Auth and price validation are superseded by ROLL-15 and ROLL-16.**

### ROLL-08: Rollout Analytics page (`/admin/analytics`)
Build the Production Analytics page with the Production metrics, date range presets (7/30/90), chart with metric tabs, top products ranking, source split (Instagram/WhatsApp/Direct + daily uniques), and loading/error/empty states. Only the two platform tags are recognized; do not add other traffic sources/funnels/etc.

**Benchmark:** After this change, an admin can see Views/Clicks/CTR, per-product metrics, and the two-tag source split for a chosen range, switch chart series, open a product from the ranking, and sees real data (never fabricated zeros on error).

## Deployment

### ROLL-09: One public Vercel project + Production configuration
Create ONE public Vercel project against the `lordwhitefire/athletica` repo with Root Directory `rollout`, a fixed public domain, and Production environment variables (Supabase URL/anon/service-role, Sanity, Amazon tag/store, analytics salt, Upstash, Sentry, site URL). The Development app stays local/private (or private/password-protected); it is never the customer URL. Remove `NEXT_PUBLIC_SYSTEM_TYPE`. Vercel previews are code-review only: analytics recording off and `/admin/*` 404. Keep the admin dark until ROLL-15. Add the uptime ping and smoke test.

**Benchmark:** After this change, there is ONE public Vercel project; the public domain serves only Production pages; `/` returns a plain 404; previews do not record analytics and return 404 for admin; the Development app is never publicly reachable; `NEXT_PUBLIC_SYSTEM_TYPE` is absent; the smoke test proves the page, the `/go` redirect, and the dark admin.

## Shared UI Foundations

### ROLL-10: Shared interactive-layer primitives (inside the Production app)
Build the primitives the Production UI depends on, INSIDE the `rollout/` app: action-state handling (idle/loading/success/error), ToastViewport, confirmation dialog (focus trap, Escape-when-idle, focus restore), and no-dead-click / no-silent-failure / no-fake-data conventions.

**Benchmark:** After this change, the Production UI can render toasts, confirmations, and async states consistently, with every control having a visible outcome and every failure recoverable.

## Graduation

### ROLL-11: Feature graduation path documented
Document and support the Development → Production graduation path (schema adaptation, data copy, component swap, route/service update, testing, deploy) so finished Development features can move to Production without exposing in-development work.

**Benchmark:** After this change, there is a clear, followed path for graduating a feature from the Development app to the Production app.

## Data Foundation

### ROLL-12: Scope Supabase to `rollout`; add source/hash columns and helpers
Fix both Supabase clients to select the `rollout` schema (`db: { schema: 'rollout' }` or `.schema('rollout')`); add `source` and `visitor_hash` to `rollout.analytics` plus indexes; update the hand-written types; add source normalization (`instagram`/`whatsapp`/NULL), daily `visitor_hash` (IP + UA + UTC date + salt), bot detection, and Upstash rate-limit helpers; remove the legacy `NEXT_PUBLIC_SYSTEM_TYPE` from `.env.example`.

**Benchmark:** After this change, every Production query sends the `rollout` schema; a view/click row can carry `source` and `visitor_hash`; the same visitor on the same UTC day gets the same hash and the next day a different one; a crawler UA is rejected; an over-limit event is not counted; no raw IP is stored.

## Customer Path

### ROLL-13: Production product page + view measurement
Build the customer product page with no price, plain 404 for `/`/missing/unpublished, product metadata and OG image, real content only (no mock box contents or Unsplash), `next/image` with the `cdn.sanity.io` remote pattern, a visible Amazon Associates disclosure, server-side view recording with `source` + daily `visitor_hash`, bot skipping, and per-request rendering.

**Benchmark:** After this change, when a customer opens `/product/:slug?utm_source=instagram` for a published product, the page renders with no price, product metadata, real content, optimized images, and a visible disclosure; a view is stored with `source='instagram'` and a daily `visitor_hash`; `/`, missing, and unpublished products return a plain 404; a crawler does not create a view; the page stays at 1440px.

### ROLL-14: Affiliate configuration + CTA redirect + click measurement
Move the Amazon tag/store to server-side env; build `GET /go/:id?source=...`; pass the page an `affiliateAvailable` flag (not the ASIN); show a greyed/disabled "Link coming soon" CTA when availability is false; record the click in `/go/:id` before the 302; remove `window.open` and the hardcoded `athletica-20`; ensure an analytics failure still redirects.

**Benchmark:** After this change, when the ASIN + real tag/store are present, SHOP PRODUCT navigates to `/go/:id`, a click is stored, and the browser lands on Amazon with the configured tag; when the ASIN/tag/store is missing or a placeholder, the CTA is greyed/disabled and no click is stored; an analytics failure still redirects; no hardcoded tag remains.

## Office

### ROLL-15: Admin authentication + dark admin
Add `@supabase/ssr`; make the office invite-only (public sign-ups off, `app_metadata.role='admin'`); call `getUser()` in every admin page/action/API; use Next 16 `proxy.ts` for session refresh and an optimistic redirect; keep `/admin/*` and `/api/admin/*` at 404 until auth is live; add `/admin/login`; protect `/api/admin/products`, `/api/admin/products/[id]`, and `/api/admin/media/*`; no route/UI creates admins; service-role key server-only.

**Benchmark:** After this change, before auth is live `/admin/*` and `/api/admin/*` return 404; after an invited admin signs in, the office loads; an anonymous API request returns 401; a non-admin gets 404; no sign-up/admin-creation route exists; the service-role key is absent from client bundles.

### ROLL-16: Admin price optional
Remove the `price > 0` validation; allow an empty price; keep the price column and price sort optional/internal; never render price on the customer page.

**Benchmark:** After this change, an admin can save and publish a product with an empty price; the customer page shows no price; a price sort puts empty prices last.

## Monitoring and Verification

### ROLL-17: Sentry + uptime
Add `@sentry/nextjs` for server, client, and edge errors with `sendDefaultPii: false`; scrub cookies, auth headers, email, and IP; add an email alert on new issues/error rate and an uptime ping for the two product URLs.

**Benchmark:** After this change, a thrown server error appears in Sentry with no cookies/auth headers/email/IP; an alert email is sent; the uptime monitor pings both product URLs; a Sentry DSN is required in Production.

### ROLL-18: Critical-path tests + client handoff
Add Vitest and critical-path tests for the plain 404, disabled CTA, `/go` redirect/click, source/hash recording, and admin 401/404; write the client handoff guide (admin URL, invite, product/ASIN, Instagram/WhatsApp links, what is measured); replace the starter `rollout/README.md`.

**Benchmark:** After this change, `npm test` in `rollout/` passes tests covering the five critical paths; the handoff guide exists and contains no secrets; the README describes the Production app and local setup.
