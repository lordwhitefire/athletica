# Tasks — Architect's Registry

The Orchestrator does not write here. When a new planning artifact lands (proposal, design, or task bundle), add the individual pieces so the real project can catch up to the architecture. Each row is a short, plain description of what needs to happen.

## ARCH — Development App
Track: `frontend/` | Status: development/private only | Local dev or private URL; never the public customer URL

| # | Task | Status | Notes |
|---|------|--------|-------|
| ARCH-1 | Create `frontend/` directory + scaffold Next.js app | ✅ Done | First commit landed |
| ARCH-2 | Move existing `src/` app into `frontend/` (full content migration) | ✅ Done | 405 commits; all content in `frontend/` |
| ARCH-3 | Move root config files into `frontend/` | ✅ Done | Config, public, scripts, Docker |
| ARCH-4 | Restore root configs from `origin/main` | ✅ Done | `supabase/config.toml`, `vercel.json`, `components.json`, `tailwind.config.ts` |
| ARCH-5 | Fix stale Vercel config (`ignoreCommand`) | ✅ Done | Changed from `"true"` to `"exit 0"` |
| ARCH-6 | Set up Testing Framework (`vitest`) | ✅ Done | Vitest installed; Smoke & Theme tests passing |
| ARCH-7 | Migrate Build Scripts to `frontend/` | ✅ Done | `fetch-*.mjs` + `*.sql` scripts moved |
| ARCH-8 | Migrate Supabase Scripts to `frontend/` | ✅ Done | `scripts/supabase/` moved |
| ARCH-9 | Migrate Legacy SQL to `frontend/` | ✅ Done | 54 `.sql` files moved |
| ARCH-10 | Round 2 RSC Conversion (all pages) | ⬜ Pending | Next after ROLL tracks are stable |
| ARCH-11 | Round 3 Storefront UX Fixes | ⬜ Pending | Depends on ARCH-10 |

---

## ROLL — Production App
Track: `rollout/` | Status: active | Deployed via Vercel (Root Directory `rollout`, public domain)

| # | Task | Status | Notes |
|---|------|--------|-------|
| ROLL-00 | Move git root up to `athletica/` | ✅ Done | Pushed; history preserved. GitHub `main` at `a7d9ae3` |
| ROLL-01 | Rollout schema + types | ✅ Done | Fresh `rollout/` app, `rollout` schema in existing project, schema SQL, hand-written TypeScript types |
| ROLL-02 | Rollout Product Service | ✅ Done | `supabase/server.ts` + `products/product-service.ts`. **Bug: clients do not set `db.schema='rollout'` (defaults to `public`); fix in ROLL-12** |
| ROLL-03 | Rollout Analytics Service | ✅ Done | `analytics/analytics-service.ts` with view/click recording and admin queries. **Source/hash added in ROLL-12/13** |
| ROLL-04 | Rollout Amazon Affiliate Service + RLS Policies | ✅ Done | Affiliate URL derivation + 4 RLS policies; owner must run SQL in dashboard. **Hardcoded tag/store replaced in ROLL-14** |
| ROLL-05 | Customer Product Details page (`/product/:slug`) | ✅ Done | Round 1 + Round 2. 19/19 tests PASS. Commits `8097205` + `6e8d72e`. **Superseded in detail by ROLL-13/14** (no price, plain 404, real content, `/go/:id` CTA, source/hash) |
| ROLL-06 | Admin Product Database (`/admin/products`) + D1–D5 | ✅ Done | 25/25 tests PASS. Commits `213ac08` (docs) + `ea6ecf3` (feature). **Owner action: run `supabase-rollout-schema-updates.sql` in dashboard.** Price validation superseded by ROLL-16; auth by ROLL-15 |
| ROLL-07 | Rollout Product Editor (Add/Edit) | ✅ Done | Code landed in `a7d9ae3`; 30-check bundle. D6–D9 owner-confirmed. **Owner action: add `SANITY_WRITE_TOKEN` to `rollout/.env.local`.** Price validation superseded by ROLL-16; auth by ROLL-15 |
| ROLL-08 | Rollout Analytics page (`/admin/analytics`) | ⬜ Pending | Depends on ROLL-03. Add source split (Instagram/WhatsApp/Direct + daily uniques); only the two platform tags |
| ROLL-09 | One public Vercel project + Production configuration | ⬜ Pending | Depends on core features. One public project; Development local/private; previews: analytics off + admin 404; admin dark until ROLL-15; env/uptime/smoke |
| ROLL-10 | Shared interactive-layer primitives | ⬜ Pending | **Partially absorbed into ROLL-06** (toast/confirm/action-state built there); revisit after ROLL-08 |
| ROLL-11 | Feature graduation path documented | ⬜ Pending | Depends on ROLL-01; Development → Production |
| ROLL-12 | Data foundation: scope clients to `rollout`; add source/hash + helpers | ✅ Done | **Blocks all Production data work.** Fixes the default `public` schema bug; adds `source`/`visitor_hash`, types, hash/bot/rate-limit helpers. Reports archived in `openspec/tasks/ROLL-12/`. |
| ROLL-13 | Production product page + view measurement | ✅ Done | Depends on ROLL-12. No price; plain 404 for `/`/missing/unpublished; metadata/OG; real content; `next/image`; disclosure; server-side view with source/hash. Reports archived in `openspec/tasks/ROLL-13/`. **Superseded by owner-directed redesign inside ROLL-14 (see ROLL-14 deviations #1–4)** |
| DATA-SEED-01 | Ingest ~5 products into rollout.products via Rainforest API | ⛔ Cancelled | Owner chose one product instead. `JI1092` mapped from `public.products` by hand; 39 prior rows deleted on owner instruction (twice). `rollout.products` = 1 row. Bundle left unused. |
| ROLL-14 | Affiliate config + CTA redirect + click measurement | ✅ Done | Benchmarks met: env tag/marketplace, `/go/[id]` with 302 + server-side `recordClick(id, source, visitorHash)`, CTA gated, no `window.open`/hardcoded tag. **302 path not exercised at runtime** (no ASIN, no tag). Owner-directed deviations recorded in `openspec/tasks/ROLL-14/deviations-report.md` |
| ROLL-15 | Admin auth + dark admin | ⬜ Pending | `@supabase/ssr`; invite-only; `app_metadata.role`; `getUser()`; `proxy.ts` 404 until live; protect APIs/media |
| ROLL-16 | Admin price optional | ⬜ Pending | Remove `price > 0`; optional/internal column/sort; never on the customer page |
| ROLL-17 | Sentry + uptime | ⬜ Pending | `@sentry/nextjs`; PII off; email alert; uptime ping on both product URLs |
| ROLL-18 | Critical-path tests + client handoff | ⬜ Pending | Vitest for 404/CTA/`/go`/source+hash/auth; handoff guide; replace starter README |

---

## INV — Evidence / Investigation (pre-architecture probes)

Track: standalone scripts only | Status: owner-run | These probe real-world capabilities FIRST; architecture is written from findings, not guesses.

| # | Task | Status | Notes |
|---|------|--------|-------|
| INV-01 | Rainforest single-ASIN field inventory (probe before ingestion + research-agent architecture) | ✅ Done | Run 2026-09-05 on `B0FN655XF8` (adidas Real Madrid jersey). 1 credit / 99 left. All 5 benchmarks met. Findings: `openspec/tasks/INV-01/inventory.md` + `implementation_report.md`. **17/25 schema fields need the research agent; 8/25 come from one call** |
| INV-02 | Footwear re-probe (optional) | ⬜ Pending decision | Report flags single-product bias — jersey ≠ actual rollout products (footwear). Re-run the same probe on a real shoe ASIN (1 credit) before architecture IF credits allow and owner wants it |

---

## Core Decisions

> **Update log (2026-10-31, ROLL-14 close-out):** owner-directed changes during ROLL-14 altered two
> existing architecture rules. They are recorded rather than silently inherited — a design decision
> that was overruled deliberately should say so in the record, not disappear from it.
>
> | # | Change | Was | Now | Authority |
> |---|--------|-----|-----|-----------|
> | 1 | Product-page visual system | `rollout1-pixel-match.css`, `pixel-*` classes, Sanity-only images via `next/image` | Dark "ATHLETICA" design from `Downloads/athletica-product-page-code.md`, plain `<img>`, DB-driven image slots | owner |
> | 2 | `next/image` requirement | ROLL-13 benchmark + six-layer decision (`cdn.sanity.io`, hero priority) | Dropped for plain `<img>`; no `next.config.ts` edit permitted | owner ("do not touch anything") |
> | 3 | Product count in `rollout` | Planned multi-product catalogue | **One product** (`JI1092`) | owner |
> | 4 | `next.config.ts` `remotePatterns` | To be extended for real image hosts | Frozen — owner forbade touching it | owner |
>
> Consequences to reconcile before launch: no image optimization; Unsplash stock in 4 of 8 slots
> (temporary); ROLL-13's `next/image`/Sanity benchmarks are superseded; ROLL-14's parity claims are
> stale against the new markup; `getClientIp` returns `0.0.0.0` behind the proxy so the missing-IP
> skip never fires.

| Decision | Date | Why |
|----------|------|-----|
| One repo, two apps (`frontend/` Development + `rollout/` Production) | 2026-09-01 | Isolation without duplication; single git history |
| Root directory: `frontend/` = Development app, `rollout/` = Production app | 2026-09-01 | Vercel can deploy the Production app; Development stays local/private |
| No root-level `src/` or `app/` — everything in app directories | 2026-09-01 | Prevents route conflicts; clear boundaries |
| Root `.gitignore`: only `frontend/` and `rollout/` tracked | 2026-09-01 | Everything else (supabase/, openspec/, scripts/) ignored |
| **Database: ONE Supabase project, dedicated `rollout` schema** | 2026-09-02 | `public` = Development app, `rollout` = Production app; no second project. **Every Production client must set `db.schema='rollout'`** |
| Rollout tables named `rollout.products` + `rollout.analytics` | 2026-09-02 | Self-contained; no foreign keys to hierarchy |
| **No Supabase CLI** — types written by hand via REST API | 2026-09-02 | Agent fetches table structure, writes TypeScript types manually |
| Customer page visual system: black `#000000`, lemon `#d1fd40`, white text only, 1440px hard max | 2026-09-04 | Non-negotiable per UI spec (File 3/4); no expansion at 1680/1920/2560px |
| Affiliate URL derived server-side via `/go/:id` (client never sees ASIN) | 2026-09-04 | Protects affiliate tag/linkCode from client tampering; server redirect records the click |
| Client components route through API routes; server components/services use Supabase directly | 2026-09-04 | Server-only env keys must not be imported into `'use client'` code |
| **D1 — Currency: `$` (dollars)** | 2026-09-05 | **Superseded 2026-10-26** — no price/currency on the public page; admin price is optional/internal; no `price > 0` |
| **D2 — No brand, no category pages/filters. Tags are data-only** | 2026-09-05 | Owner decision. Few products; `tags: string[]` already in schema; admin fills tags; categorization comes later |
| **D3 — `box_contents` field added now; real content only** | 2026-09-05 | **Superseded 2026-10-26** — no mock box contents or Unsplash fallback; omit empty sections; use real admin/Sanity data |
| **D4 — Benefit icons standardized to `boot` / `bolt` / `target` / `speed` (no visual change)** | 2026-09-05 | Owner confirmed. TS `BenefitIcon` union now; ROLL-07 editor validation later; SVGs untouched |
| **D5 — UI spec files (File 3/4) moved into `rollout/docs/`** | 2026-09-05 | Done in ROLL-06 Step 1; repo becomes single source of truth |
| **Client components call services via `/api/admin/products` (server-only service_role key)** | 2026-09-05 | ROLL-06 C4 ruling — same boundary as ROLL-14's `/go` and ROLL-15's admin APIs |
| **D6 — Sizes: add `sizes TEXT[]` + `sizes_detail TEXT` columns (SQL file)** | 2026-09-05 | ✅ Owner confirmed 2026-09-05 ("go"). Owner runs the SQL |
| **D7 — SEO: store title/description/keywords in existing `meta` JSONB** | 2026-09-05 | ✅ Owner confirmed 2026-09-05 ("go"). Zero schema change |
| **D8 — Images: Sanity-backed, 3 routes (direct link / upload-to-Sanity / Sanity media browser); links stored in Supabase** | 2026-09-05 | ✅ Owner decision ("go"). Mirrors the Development pattern (`admin-sanity.ts`, media upload/assets routes). Requires `SANITY_WRITE_TOKEN` in rollout env; only `cdn.sanity.io` is allowed on the public page |
| **D9 — Add = modal with CSV/Excel autofill, Edit = `/admin/products/[id]/edit` page** | 2026-09-05 | ✅ Owner confirmed 2026-09-05 ("go"). Autofill fills ONE form, not batch. Parser mirrors the Development app (`papaparse` + `exceljs`, not `xlsx`) |
| **Deps approved: `@sanity/client`, `papaparse`, `@types/papaparse`, `exceljs`** | 2026-09-05 | ✅ Owner approved ("go"). All mirror frontend versions — repo precedent, no new packages |
| **Admin API routes have no auth (no middleware in rollout)** | 2026-09-05 | Flagged — service_role-based routes are open once deployed. **Must fix in ROLL-15**; `/admin/*` + `/api/admin/*` return 404 until then |
| **Probe before architecture — INV-01: pull one real ASIN via Rainforest first, then design ingestion + research agent from findings** | 2026-09-05 | Owner decision. ~100 Rainforest requests available, used sparingly; 1 spent on the probe. No stale-data concern; no scheduled refresh |
| **Research agent = simple autonomous research tool, not a harness** | 2026-09-05 | Owner decision. Boundary: read + web search/fetch + analysis tools (e.g. fp-growth) + produce files. ONLY reads and produces files — never writes DB/site. CSV/Excel default output so files drop into existing autofill; other formats on request. Owner supervises; no formal testing.md |

---

## Six-Layer Plan Decisions (2026-10-26)

These are the architecture decisions from the product-management handoff and six-layer plan. Where an older row above conflicts, this section wins.

| Decision | Why |
|---|---|
| `rollout/` = Production app (public showroom); `frontend/` = Development app (full store + office, not public) | Terminology correction; isolation is structural |
| One Supabase project, two schemas: `public` = Development, `rollout` = Production | Cheaper, one project; schema-level isolation already in SQL |
| Every Production Supabase client sets `db.schema='rollout'` (default is `public`) | Current `server.ts` can hit the Development table; correctness bug |
| No price/currency on the public page; admin price optional/internal; drop `price > 0` | Product decision; price is not part of the MVP story |
| `/`, missing products, unpublished products return a plain 404 | No redirect, no product-specific copy |
| Analytics records `source` (`instagram`/`whatsapp`/NULL) + daily `visitor_hash`; server-side; no raw IP | Split Instagram vs WhatsApp; privacy |
| Bot/preview/uptime user agents skipped; recording rate-limited per hash | Avoid inflated counts; keep the page fast |
| CTA links to `GET /go/:id`; disabled with "Link coming soon" when no ASIN/tag/store | No `window.open`; click recorded before redirect; no broken links |
| Amazon tag/store in server env; no hardcoded `athletica-20` | Real affiliate config is owner-supplied; placeholders must not ship |
| Admin auth: `@supabase/ssr` + `getUser()` + `app_metadata.role='admin'`; invite-only; 404 until live | Office must not be open; no public sign-ups; no admin-creation route |
| Next 16 `proxy.ts` for session refresh/optimistic redirect; real checks in layout/API routes | Middleware is not the authorization boundary |
| Sentry with `sendDefaultPii: false` + email alert + uptime ping | Know when the site breaks |
| `next/image` with `cdn.sanity.io`; hero priority; lazy elsewhere; alt text | Performance + Sanity-only images |
| One public Vercel project for Production; Development local/private; no staging; previews safe (analytics off, admin 404) | Simple launch; previews must not pollute data |
| Affiliate disclosure line | Amazon Associates requirement |
| Vitest critical-path tests + client handoff guide | Prove the MVP; client can operate it |

## Revised ROLL-09 and ROLL-10 (scope)

**ROLL-09 (Deployment + Production configuration)**
- **ONE public Vercel project**: Root `rollout`, fixed public domain, Production env.
- Development app stays local/private (or private/password-protected); never the customer URL.
- Previews: analytics recording off and `/admin/*` 404 (`VERCEL_ENV !== 'production'`).
- **Admin auth is ROLL-15**; `/admin/*` and `/api/admin/*` return 404 until it lands.
- Env: Supabase URL/anon/service, Sanity, Amazon tag/store, analytics salt, Upstash, Sentry, site URL; remove `NEXT_PUBLIC_SYSTEM_TYPE`.
- Uptime ping + smoke test (page, `/go`, dark admin).

**ROLL-10 (Shared UI Primitives — inside the Production app)**
- Build inside `rollout/src/`: action-state handling, ToastViewport, confirmation dialog (focus trap, Escape-when-idle, focus restore), error wrappers.
- **Note: toast/confirm/action-state are built in ROLL-06** — ROLL-10 now only covers what remains (error wrappers, remaining primitives) and should be revisited after ROLL-07/08.