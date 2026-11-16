# Rollout MVP — Architect Handoff

**Date:** 2026-10-26
**Prepared by:** Product Management
**For:** Architect
**Status:** Recommendation, not a decision. No code, configuration, deployment, or product change has been made.
**Build target:** `athletica/rollout/`
**Primary decision source:** `product-management/ROLLOUT-MVP-SIX-LAYERS.md`
**Repo root:** `/home/lordwhitefire/current-project/athletica`

---

## How to use this handoff

Read in this order:

1. **`product-management/ROLLOUT-MVP-SIX-LAYERS.md`** — the product decisions, the six layers, the launch gate, and the deferred items.
2. **`athletica/openspec/changes/roll-arch/design.md`** — the architecture, schema sketch, RLS, deployment, and isolation.
3. **`athletica/openspec/changes/roll-arch/proposal.md`** — the two-app scope and why `rollout/` is the production app.
4. **This document** — the layer-by-layer file map.
5. The specs and code files below.

**Precedence rule:** where an older OpenSpec spec disagrees with the six-layer plan, the **six-layer plan wins for product behavior**. Where a document disagrees with the code, the **code wins for current implementation facts**. The known conflicts are listed in §9.

---

## 1. Scope boundary

- **Build here:** `athletica/rollout/` — the public production app.
- **Do not build here:** `athletica/frontend/` — the mature/development app; out of scope.
- **Also out:** `athletica/studio-athletica/`, the mature `athletica/supabase/` migrations, and the mature OpenSpec change `athletica-architecture/`.
- **Public loop:** Instagram backlink → product 1 → Amazon; WhatsApp backlink → product 2 → Amazon. Two products on day one.
- **No price on the product page.** No currency display.
- **Plain 404** for `/`, missing product, and unpublished product.
- **No visitor accounts, cart, checkout, payments, search, categories, or blog.** Amazon handles the transaction.
- **Admin:** client only; Supabase invite + `app_metadata` role; server-side `getUser()` on every admin route; admin routes 404 until auth is live.
- **Build can start now.** The Amazon tag + store are deferred; the CTA stays greyed out until they are supplied. Contact the client when building the Amazon link.

---

## 2. Layer 1 — UI

**Decisions to implement:** product page is the only public page; no price; `SHOP PRODUCT` CTA; greyed-out CTA when ASIN/tag is missing; plain 404; root metadata; admin routes 404 until auth; analytics page later.

| File | What it is | What to do |
|---|---|---|
| `athletica/rollout/src/app/product/[slug]/page.tsx` | Server route for the product page. Loads a published product, records a view, calls `notFound()`. | Add `generateMetadata` (title, description, OG image). Read `searchParams` for `utm_source` and pass the source to the view record. Keep `notFound()` for missing/unpublished. |
| `athletica/rollout/src/app/product/[slug]/ProductDetailsClient.tsx` | Client product UI: gallery, price, CTA, story, benefits, specs, box contents. | Remove the `$` price block. Remove mock box/Unsplash fallback. Render the CTA greyed out and disabled when ASIN/tag/store is missing. Change the CTA handoff; see Layer 3. |
| `athletica/rollout/src/app/product/[slug]/not-found.tsx` | Product not-found UI. | Currently shows “PRODUCT NOT FOUND” / “This product is no longer available.” Decision is a **plain 404**. Replace or simplify. |
| `athletica/rollout/src/app/product/[slug]/rollout1-pixel-match.css` | Product page visual system: black/lemon, 1440px cap. | Keep as the visual contract; check the disabled CTA style and mobile states. |
| `athletica/rollout/src/app/layout.tsx` | Root layout and metadata. | Metadata is still “Create Next App.” Replace with Athletica metadata. |
| `athletica/rollout/src/app/page.tsx` | Root page. | Currently the Next.js starter homepage. Decision: `/` returns a plain 404. Remove/replace. |
| `athletica/rollout/src/app/globals.css` | Global CSS and tokens. | Check for leftover default styles; keep the product/admin visual systems scoped. |
| `athletica/rollout/src/app/admin/products/page.tsx` | Admin product database: search, status, sort, pagination, add/edit, publish/unpublish, delete. | No auth gate today. Price column and price sort exist; decide whether to keep as internal-only or remove. |
| `athletica/rollout/src/app/admin/products/product-editor.tsx` | Add/edit form, image upload, autofill, validation. | Price is required (`> 0`) in validation; make it optional or remove. Image upload already exists via the media routes; secure it. |
| `athletica/rollout/src/app/admin/products/[id]/edit/page.tsx` | Edit route wrapper. | No auth gate today. |
| `athletica/rollout/src/app/admin/products/admin.css` | Admin styling. | Reference. |
| `athletica/rollout/src/lib/ui/action-state.ts` | Async state helper (idle/loading/success/error). | Reuse for CTA, forms, admin actions. |
| `athletica/rollout/src/lib/ui/toast.tsx` | Toast system. | Reuse. |
| `athletica/rollout/src/lib/ui/confirm-dialog.tsx` | Confirmation dialog with focus handling. | Reuse for delete. |

**Missing UI:** there is no `admin/layout.tsx`, no login screen, no auth shell, and no `/admin/analytics` page.

---

## 3. Layer 2 — Data model

**Decisions to implement:** keep `rollout.products` self-contained; add `source` and `visitor_hash` to `rollout.analytics`; keep `price` nullable; images are Sanity URLs; RLS enabled.

| File | What it is | What to do |
|---|---|---|
| `athletica/rollout/supabase-rollout-schema.sql` | Creates `rollout.products` and `rollout.analytics`. | `analytics` lacks `source` and `visitor_hash`. Add both. `price` is already nullable. |
| `athletica/rollout/supabase-rollout-schema-updates.sql` | Adds `box_contents`, `sizes`, `sizes_detail`. | Run after the base schema; verify the live database has these columns. |
| `athletica/rollout/supabase-rollout-rls-policies.sql` | RLS policies: anon reads published products; anon inserts analytics; service role full access. | Keep; verify the analytics insert policy still works after adding `source`/`visitor_hash`. |
| `athletica/rollout/src/lib/database.types.ts` | Hand-written database types. | Add `source` and `visitor_hash` to `analytics` Row/Insert/Update. `price` is already `number | null`. |
| `athletica/rollout/src/lib/supabase/server.ts` | Admin and public Supabase clients. | Admin uses the service-role key; public uses the anon key. There is no cookie/session auth client yet. |
| `athletica/openspec/changes/roll-arch/design.md` | Architecture, schema sketch, RLS, deployment. | Schema sketch uses `rollout_products`; the actual SQL uses `rollout.products`. Treat the SQL as truth. |
| `athletica/openspec/changes/roll-arch/specs/rollout-catalog/spec.md` | Catalog requirements: self-contained storage, publish/unpublish, CRUD, ASIN. | Useful detail; price storage exists but the plan removes price display. |
| `athletica/openspec/changes/roll-arch/specs/rollout-analytics/spec.md` | Analytics requirements. | Says “no traffic sources”; the plan adds `source` (instagram/whatsapp) and `visitor_hash`. The plan wins. |
| `athletica/openspec/changes/roll-arch/specs/rollout-amazon-affiliate/spec.md` | Affiliate requirements: derive URL from ASIN + config; never store the URL. | Still valid. Tag/store configuration is deferred. |

**Data rules:** views and clicks are server-recorded; known bots are skipped; the daily visitor hash is built on the server from IP + browser + daily salt and **only the hash is stored**; every event carries the platform source.

---

## 4. Layer 3 — Business logic

**Decisions to implement:** only published products are public; Amazon URL derived from ASIN + tag + store at click time; no stored affiliate URL; server-side counting; admin auth; no price validation; greyed-out CTA when the link is incomplete; deferred tag/store.

| File | What it is | What to do |
|---|---|---|
| `athletica/rollout/src/lib/products/product-service.ts` | Admin CRUD + public `getProductBySlug` (published only). | Keep. Add auth at the API/route layer, not by weakening the service. |
| `athletica/rollout/src/lib/analytics/analytics-service.ts` | Records views/clicks; computes KPIs, top products, chart data. | Add `source` and `visitor_hash`. Add bot skipping. Keep event counts server-side. |
| `athletica/rollout/src/lib/affiliate/affiliate-service.ts` | Derives the Amazon URL from ASIN + config at click time. | Config is hardcoded: tag `athletica-20`, marketplace `amazon.com`. Replace with configuration. If tag/store is missing or placeholder, return no URL so the UI can disable the CTA. |
| `athletica/rollout/src/app/api/admin/products/route.ts` | Admin CRUD API: GET/POST/PATCH/DELETE. | **No auth.** Requires `price > 0` on POST. Add `getUser()`/role checks. Make price optional. |
| `athletica/rollout/src/app/api/admin/products/[id]/route.ts` | Admin GET/PUT for one product. | **No auth.** Add role checks. |
| `athletica/rollout/src/app/api/affiliate/route.ts` | Public endpoint returning the affiliate URL. | Keep public. Return a clear “no destination” result when ASIN/tag/store is missing. |
| `athletica/rollout/src/app/api/analytics/route.ts` | Public endpoint for view/click events. | No rate limiting; no `source`/`visitor_hash`. Add both. Consider a redirect/click route instead of client `window.open`. |
| `athletica/rollout/src/app/api/admin/media/upload/route.ts` | Uploads an image to Sanity (5MB, JPEG/PNG/WebP/AVIF). | **No auth.** Add admin auth. Keep the token server-side. |
| `athletica/rollout/src/app/api/admin/media/assets/route.ts` | Lists Sanity image assets. | **No auth.** Add admin auth. |
| `athletica/rollout/src/lib/admin-sanity.ts` | Sanity write client. | Project ID `cuiis46d` is hardcoded; token is `SANITY_WRITE_TOKEN`. Keep server-only. |
| `athletica/rollout/src/lib/autofill.ts` | CSV/Excel autofill mapping. | Optional; verify it cannot bypass validation or overwrite ASIN silently. |
| `athletica/rollout/src/lib/placeholder.ts` | Mock box contents + Unsplash fallbacks. | Remove usage from the product page; real content only. |
| `athletica/openspec/changes/roll-arch/specs/rollout-admin/spec.md` | Admin requirements. | Says price > 0 validation; the plan makes price optional. The plan wins. |
| `athletica/openspec/changes/roll-arch/specs/rollout-amazon-affiliate/spec.md` | Affiliate requirements. | Backend derivation is correct. Add tag/store config and the greyed-out state. |
| `athletica/openspec/changes/roll-arch/specs/rollout-catalog/spec.md` | Catalog CRUD/publish. | Use as detail; price display is overridden by the plan. |

**Critical security gap:** every `/api/admin/*` route currently uses the service-role key with **no authentication**. On a public domain, anyone can read, edit, publish, or delete products and upload images. Admin routes must 404 until auth is live.

---

## 5. Layer 4 — Functionality

**Build order:** product page first → admin second → analytics page later.

| File | What it is | What to do |
|---|---|---|
| `athletica/rollout/package.json` | Scripts and dependencies: Next 16.3.4, React 19.2.8, Supabase JS, Sanity client, ExcelJS, PapaParse. | No test script, no Sentry. Add only what the plan needs. |
| `athletica/rollout/next.config.ts` | Next config. | Currently empty. Add image domains if switching to `next/image`; add Sentry config if using `@sentry/nextjs`. |
| `athletica/rollout/tsconfig.json` | TypeScript config. | `strict: true`; keep. |
| `athletica/rollout/README.md` | Default create-next-app README. | Replace with the rollout app’s real setup/run/deploy notes. |
| `athletica/rollout/.env.example` | Env template: Supabase URL/anon/service, `NEXT_PUBLIC_SYSTEM_TYPE`, `SANITY_WRITE_TOKEN`. | Add Sentry DSN and affiliate tag/store config. Remove `NEXT_PUBLIC_SYSTEM_TYPE` if the structural isolation decision is followed (design.md says it is no longer needed). |
| `athletica/rollout/AGENTS.md` | Next.js 16 agent rules: breaking changes; read `node_modules/next/dist/docs/`. | Read before writing code. |
| `athletica/rollout/docs/athletica_rollout1_final_interactive_layer_patch.md` | UI/interaction patch spec: states, toasts, no dead clicks. | Reference for the interaction contract. |
| `athletica/rollout/docs/athletica_rollout1_pixel_match_patch.md` | Product page pixel-match spec. | Reference for the visual contract. |
| `athletica/openspec/changes/roll-arch/tasks.md` | Build tasks ROLL-00 → ROLL-11. | Use for build history and surface ownership; check against the current plan. |
| `athletica/openspec/tasks/ROLL-05`, `ROLL-06`, `ROLL-07` | Task-level reports/testing for product page and admin. | Optional history; the code is the current truth. |

**Not built:** `/admin/analytics` (the service exists, the page does not), admin auth/login, Sentry, tests, deployment config.

---

## 6. Layer 5 — UX

**Decisions to implement:** phone-first; in-app browsers; correct link preview; first screen answers the DM questions; no price; greyed CTA; plain 404; real content only.

| File | What it is | What to do |
|---|---|---|
| `athletica/rollout/src/app/product/[slug]/ProductDetailsClient.tsx` | First screen, gallery, CTA, story, benefits, specs, box. | Remove price, mock content, and Unsplash fallback. Make the CTA work in Instagram/WhatsApp in-app browsers. Add the disabled state. |
| `athletica/rollout/src/app/product/[slug]/not-found.tsx` | Not-found UX. | Plain 404. |
| `athletica/rollout/src/app/product/[slug]/rollout1-pixel-match.css` | Visual contract. | Check contrast, focus states, mobile order, and no horizontal overflow. |
| `athletica/rollout/src/app/admin/products/page.tsx` | Admin UX: filters, table, empty/error/loading states. | Keep the states; add auth flow. |
| `athletica/rollout/src/app/admin/products/product-editor.tsx` | Admin form UX: validation, dirty protection, image upload. | Price optional; keep dirty protection; secure upload. |
| `athletica/rollout/src/lib/ui/*` | Toast, confirm, action states. | Reuse; do not build a second system. |
| `product-details-example.md` | Content example for a product record. | Useful for content shape. Note: `GW8470` is not an ASIN; that record’s ASIN is null. Do not seed it as-is. |
| `web-development-areas.md` | Generic 80-area kickoff checklist. | Use the “Kickoff checklist audit” in the six-layer plan: affiliate disclosure, privacy policy, rate limiting, audience geography/store fit, accessibility/performance, tests/handoff. |

**UX risks:** the current link preview says “Create Next App”; the CTA records a click even if the pop-up is blocked; mock box contents/Unsplash undermine trust; no mobile performance check yet.

---

## 7. Layer 6 — System model

**Decisions to implement:** one public Vercel project for `rollout/`; one Supabase project with the `rollout` schema; RLS + grants; Supabase Auth for admin; Sentry; service keys server-side; analytics later.

| File | What it is | What to do |
|---|---|---|
| `athletica/rollout/package.json` | Runtime and dependencies. | Add Sentry (`@sentry/nextjs`) when implementing monitoring; add a test runner only if the plan’s critical-path tests are in scope. |
| `athletica/rollout/next.config.ts` | Next config. | Add Sentry and image config as needed. |
| `athletica/rollout/.env.example` | Environment template. | Add Sentry DSN, affiliate tag/store; confirm Supabase and Sanity vars; remove legacy system type if unused. |
| `athletica/rollout/src/lib/supabase/server.ts` | Supabase clients. | Admin client uses the service key; keep server-only. Add the auth/session client for admin routes. |
| `athletica/rollout/supabase-rollout-schema.sql` | Schema creation. | See Layer 2. |
| `athletica/rollout/supabase-rollout-schema-updates.sql` | Column additions. | See Layer 2. |
| `athletica/rollout/supabase-rollout-rls-policies.sql` | RLS policies. | See Layer 2. |
| `athletica/rollout/src/lib/admin-sanity.ts` | Sanity client. | Keep server-only; token from env. |
| `athletica/openspec/changes/roll-arch/design.md` | Architecture, RLS, deployment, migration. | Primary architecture reference. Note the table-name drift and the “no env switch” decision. |
| `athletica/openspec/changes/roll-arch/proposal.md` | Two-app isolation and deployment. | Primary scope reference. |
| `athletica/openspec/changes/roll-arch/specs/rollout-mature-isolation/spec.md` | Isolation requirements. | **Stale:** still describes `NEXT_PUBLIC_SYSTEM_TYPE` and route blocking. `design.md` says isolation is structural (two separate apps). Follow the design/plan. |
| `athletica/openspec/changes/athletica-architecture/` | Mature app architecture. | Context only. Do not implement here. |
| `web-development-areas.md` | Generic system checklist. | Use the gaps listed in the six-layer plan. |

**Deployment note:** the public app is `rollout/`; `frontend/` is never the public deployment. The Vercel address must be fixed before backlinks are posted. The Amazon tag + store are deferred; the CTA stays greyed out until they are supplied.

---

## 8. Supporting decision and history files

| File | Why read it |
|---|---|
| `product-management/ROLLOUT-MVP-SIX-LAYERS.md` | The current product decisions, six layers, launch gate, open items. **Primary.** |
| `/home/lordwhitefire/Downloads/rollout-decisions.md` | Raw answered questions from the owner. External to the repo; the six-layer plan contains the decisions. |
| `product-management/PLAN-rollout-mvp.md` | Earlier plan; historical. Superseded. |
| `product-management/PLAN-rollout-mvp-v2-six-layers.md` | Earlier six-layer draft; historical. Superseded. |
| `athletica/openspec/changes/roll-arch/proposal.md` | Architecture proposal. |
| `athletica/openspec/changes/roll-arch/design.md` | Architecture design. |
| `athletica/openspec/changes/roll-arch/tasks.md` | Build tasks and benchmarks. |
| `athletica/openspec/tasks/ROLL-00` … `ROLL-07` | Task reports and testing history; optional. |
| `athletica/rollout/docs/*.md` | Historical UI patch specifications; optional visual detail. |

---

## 9. Conflicts to resolve — do not copy blindly

These are places where an older spec or the code disagrees with the six-layer plan. The plan wins for product behavior.

1. **Price.** The plan says no price on the product page and an optional/removed admin price. The code displays `$` on the product page and in the admin table; the admin API requires `price > 0`; `rollout-admin/spec.md` requires price > 0. Remove the product-page price, make the admin field optional, and drop the validation.
2. **404.** The plan says a plain 404 for `/`, missing, and unpublished products. `product/[slug]/not-found.tsx` shows a custom “PRODUCT NOT FOUND” page; `rollout-customer-product/spec.md` requires that state. Replace with the plain 404 decision.
3. **Analytics source.** The plan adds `utm_source` (instagram/whatsapp) and a daily `visitor_hash`. The schema and service do not have either; `rollout-analytics/spec.md` explicitly excludes traffic sources. Add both; the plan wins.
4. **Isolation.** `design.md` says the two apps are structurally isolated and the old `NEXT_PUBLIC_SYSTEM_TYPE` switch is no longer needed. `rollout-mature-isolation/spec.md` still describes the env switch and route blocking. Follow `design.md`/the plan; remove the legacy env var.
5. **Affiliate config.** `affiliate-service.ts` hardcodes `athletica-20` and `amazon.com`. The plan defers the real tag + store and requires the CTA to be greyed out until they exist. Do not ship the placeholder as if it were real.
6. **Admin auth.** No admin route has authentication today; the service-role key is used directly. The plan requires Supabase invite, `app_metadata` role, `getUser()` on every admin page/action, no public sign-ups, and no permanent admin-creation route. Admin routes must 404 until this is live.
7. **Image upload.** The plan says “upload later,” but the code already has a Sanity upload route and editor UI. The real gap is **auth**, not upload. Secure the existing routes; do not rebuild the feature.
8. **Table naming.** `design.md` sketches `rollout_products` / `rollout_analytics`; the actual SQL creates `rollout.products` / `rollout.analytics`. Treat the SQL as the schema truth.

---

## 10. Build order and launch gate

**Build order**

1. Product page (the only visitor surface).
2. Admin (login, product editor, publish/unpublish, image upload).
3. Analytics page (last).

On launch day, the developer can seed the two products directly; the admin can follow.

**Launch gate**

1. Product page with real content, correct metadata/OG, no price, reliable CTA (greyed out when ASIN/tag is missing), plain 404.
2. Views and clicks recorded server-side with `utm_source` and a daily unique ID.
3. Real Amazon Associates tag + store in the config — **deferred until the Amazon link is built; required before launch, not before build.**
4. Vercel address fixed before any backlink is posted.
5. Admin routes 404 until auth is built.
6. Two products seeded with real Sanity images.
7. Sentry live: server + client errors, email alert, PII off.

**Metric:** Amazon CTR — clicks ÷ product page views — split by source (instagram vs whatsapp). Secondary: daily unique visitors per source.

**Measurement caveat:** with Instagram → product 1 and WhatsApp → product 2, the platform and the product are confounded. The test compares the two links, not the platforms cleanly. If platform comparison matters, point both links at the same product or swap products in a second round.

---

## 11. Open technical questions for the architect

These are implementation choices, not product decisions:

1. **Admin auth shape:** use `@supabase/ssr` with cookies, or another server-session approach? How is the `app_metadata` role checked on every page and API route?
2. **CTA handoff:** a server redirect route vs a synchronous `window.open`. The plan recommends a redirect so a blocked pop-up cannot create a false click.
3. **Rate limiting:** how to limit the public analytics/click endpoints (per IP, per session, or a signed token).
4. **Sentry:** `@sentry/nextjs` setup, server/client coverage, alert routing, PII off.
5. **Images:** switch from `<img>` to `next/image` with Sanity domains, or keep `<img>` and optimize manually?
6. **404:** use Next.js `notFound()` for root/missing/unpublished, and remove the custom product not-found page.
7. **Schema migration:** add `source`/`visitor_hash`; confirm RLS/grants and the `rollout` schema exposure.
8. **Deployment:** one Vercel project, Root Directory `rollout`; decide whether to add a preview/staging environment.
9. **Amazon tag/store:** when the client supplies them, wire the store domain + tag; confirm the CTA flips from disabled to active.

---

## 12. What not to do

- Do not build in `athletica/frontend/`.
- Do not add cart, checkout, payments, visitor accounts, search, categories, or blog.
- Do not store a generated Amazon URL on the product record.
- Do not show a price or currency on the product page.
- Do not expose the Supabase service-role key or the Sanity write token to the browser.
- Do not leave `/admin/*` reachable before auth.
- Do not seed mock box contents or Unsplash fallbacks into the real product page.
- Do not treat the older OpenSpec specs as current where they conflict with the six-layer plan.

---

*Prepared as a recommendation. No code, configuration, deployment, or product change was made.*
