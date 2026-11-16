# Rollout MVP — Six-Layer Plan

**Date:** 2026-10-26
**Status:** Updated to match `rollout-decisions.md` and the follow-up answers. **Build can start now.** The Amazon tag + store are deferred: contact the client when building the Amazon link; until then the CTA stays greyed out. Non-blocking: admin timing, image-upload method, deploy owner.
**Scope:** `athletica/rollout/` as the public MVP. `athletica/frontend/` is the mature/development app and is out of scope.
**Sources:** repo inspection; `rollout-decisions.md`; `web-development-areas.md`; Amazon Associates help.

---

## The one loop (decided)

```
Instagram link → /product/product-1?utm_source=instagram ─┐
                                                          ├→ SHOP PRODUCT → Amazon
WhatsApp link  → /product/product-2?utm_source=whatsapp ─┘
```

- Two backlinks, two different products.
- Each backlink goes straight to a product page, never the home page.
- `utm_source` is `instagram` or `whatsapp` — lowercase, one spelling, no spaces.
- Two products live on day one.
- Phone is the priority; PC must also work.
- Visitors already saw the marketer's post. The page answers the questions people used to send in DMs — sizes, details, how to buy — not "who is Athletica." Price is on Amazon, not here.
- The app is a management tool for the client and marketer, not a brand-building site.

---

## Decisions locked

| Decision | What it means |
|---|---|
| No price on the page | Visitors see the live price on Amazon. Remove the price display and the hardcoded `$`. Make the admin price field optional or remove it; drop the "price must be > 0" rule. No currency question. |
| CTA wording | **SHOP PRODUCT**. No price is shown, so "Check price on Amazon" would promise something the page does not show. |
| Missing ASIN or tag = greyed-out CTA | A product can be published without an ASIN or a tag. The page still loads; the Amazon CTA stays visible but greyed out and disabled; no click is counted. The same applies if the built URL is incomplete. The tag + store are collected when the Amazon link is built; this does not block the rest of the build. |
| Monitoring | **Sentry** on the rollout app: server and client errors, email alert, PII off. Sentry catches errors, not "the site is down" — a free uptime ping on the two product URLs is still recommended. |
| Root and missing products = 404 | Bare address, nonexistent product, and unpublished product all return a plain 404. No redirect, no landing page, no separate "no longer available" copy for now. |
| Images live in Sanity | Supabase stores only the image link. Admin uploads to Sanity later; on launch day the developer seeds the links directly. The Sanity write token stays server-side. |
| Admin is for the client only | One admin: the client. It must be simple and quick. |
| Supabase invite login | Public sign-ups off. The client is invited by email; he sets a password. The admin role lives in `app_metadata`, which only the server can change. Every admin page and action checks the role server-side with `getUser()` — not `getSession()`. The service key stays server-side. No permanent route that can create admins. |
| Admin routes 404 until auth exists | Until the login is built, `/admin/*` must not be reachable on the public address. |
| Server-side counting | Views and clicks are recorded on the server. A view is every page load with known bots skipped. A daily unique ID is stored, built from IP + browser + a daily salt; only the code is saved, never the IP. Clicks follow the same rules. Each view and click carries the platform tag. |
| Build order | Product page first → admin second → analytics page later. On launch day the developer seeds the two products directly. |
| Public domain | A free Vercel address (`something.vercel.app`). Choose it before any backlink is posted. |
| Amazon link | Built from the product's ASIN plus the client's Associates tag on the right Amazon store. The generated URL is not stored. The client is an Amazon affiliate; contact him for the tag + store when building this link. Deferred, not a build blocker. |
| Out of scope | Visitor accounts, cart, checkout, payments, search, categories, blog. Amazon provides the account, cart, and payment. |

---

## What already exists (verified in the repo)

- `rollout/` — separate Next.js 16 app, intended as the public/production app.
- `/product/[slug]` — customer product page: black/lemon visual system, 1440px cap, image gallery with keyboard controls, editorial sections, CTA states, not-found state.
- `/admin/products` — product database: search, status filter, sort, pagination (8/page), add/edit, publish/unpublish, delete with confirmation.
- `/admin/products/[id]/edit` — product editor page.
- Product service — admin CRUD + public `getProductBySlug` (published only).
- Analytics service — records views/clicks, computes KPIs, top products, chart data.
- Affiliate service — derives an Amazon URL from the product ASIN at click time.
- API routes — `/api/admin/products`, `/api/admin/products/[id]`, `/api/affiliate`, `/api/analytics`.
- Supabase `rollout` schema — `products` and `analytics` tables, plus schema-update SQL and RLS policy SQL.
- UI primitives — toast, confirmation dialog, action-state helper.

**Not present:** admin authentication, analytics page UI, a real homepage, per-product metadata/OG tags, tests, monitoring, deployment config.

---

## Kickoff checklist audit — `web-development-areas.md`

That file is a generic 80-area kickoff checklist, not a rollout-specific requirements doc. Most of it does not apply. The audit:

### Covered by this plan

Routes/404, OG metadata (partly), phone-first responsive, Sanity assets, Sentry (partly), env vars (partly), Vercel/rollback, monitoring, product catalog, CMS, admin auth, admin panel, RLS/security (partly).

### Gaps worth adding (not build blockers)

1. **Amazon affiliate disclosure** — Amazon's Associates agreement requires a clear "I earn from qualifying purchases" statement. A line on the product page.
2. **Privacy policy** — analytics hashes IP/browser; Sentry captures errors; admin email exists. A simple page, especially if the audience is EU/UK.
3. **Rate limiting** — the public view/click endpoints can be spammed; without it the counts can lie.
4. **Audience geography + store fit** — the checklist asks Nigeria/international; this plan does not pin it. If buyers are in Nigeria and the store is US, check shipping and availability.
5. **Accessibility + performance** — contrast, focus, alt text, keyboard; a mobile LCP target. The page uses plain `<img>`.
6. **Critical-path tests + handoff** — product page, CTA, 404, admin auth; admin credentials and a one-page client guide.

### Not applicable — skip

Payments, cart, checkout, shipping, inventory, order management, discounts, reviews; user profiles/onboarding; multi-tenancy; real-time; subscriptions; mobile apps; PWA/offline; i18n.

### Why the Amazon store is needed

An Associates tag is registered to one marketplace. A tag from `amazon.com` earns only on `amazon.com`; a tag from `amazon.co.uk` earns only on `amazon.co.uk`. The ASIN can also differ by store, and some products are not sold in every store. The link needs the right domain + the tag registered there. The current code hardcodes `amazon.com`.

**Decision:** this is deferred. Contact the client for the tag + store when building the Amazon link. Until then the CTA stays greyed out. It does not block the build; it must be in place before launch.

---

## Layer 1 — UI

### Decided

- The product page is the only public page. It is the first and only thing a visitor sees.
- No price is shown.
- Phone first; PC must work.
- `/` returns a 404.
- `/admin/*` returns a 404 until auth exists.
- The analytics page is not a day-one item.
- The CTA says **SHOP PRODUCT**.
- If the ASIN or tag is missing, the CTA is visible but greyed out and disabled.
- The product page must use real content: no mock box contents, no Unsplash fallbacks.

### What to build

1. **Per-product metadata** — `generateMetadata` with product title, description, and Open Graph image. The link preview is part of the UI; the two backlinks are shared links.
2. **Remove the price block** and the hardcoded `$`.
3. **Remove the mock box contents and fallback images**; show real data or omit the section.
4. **CTA reliability** — see Layer 3.
5. **Greyed-out CTA** — when there is no ASIN or no tag (or the URL is incomplete), show the button disabled with a short "Link coming soon" line.
6. **404 states** — root, missing product, unpublished product.
7. **Admin login screen** — later, with the admin build.
8. **Analytics page** — later, after the admin.

### Gaps and risks

- The root layout metadata is still `Create Next App`. Even with a 404 root, the metadata should be Athletica.
- No product metadata means the backlink preview is wrong — the click may never happen.
- The product page uses plain `<img>` tags; mobile performance and layout shift need a check.
- The admin UI is currently open; its visual polish is less important than locking it.

### Still open

- Final visual check on a real phone and a real PC.

---

## Layer 2 — Data model

### Decided

`rollout.products` stays self-contained:

- identity: `id`, `slug`, `name`, `status`, `gender`, `color`, `asin`, `sku`
- description: `collection`, `tagline`, `subtitle`, `intro`, `key_benefits`, `technical_details`
- attributes: `adjustment`, `range`, `sole_type`, `upper_material`, `traction`, `price` (nullable / optional)
- images: `main_image`, `images[]` (Sanity links)
- SEO: `meta`, `tags[]`
- additions: `box_contents`, `sizes[]`, `sizes_detail`
- timestamps

`rollout.analytics` gains:

- `source` — `instagram` or `whatsapp` (text)
- `visitor_hash` — daily unique ID, server-generated; never the raw IP
- existing: `product_id`, `event_type`, `created_at`

### What to build

- Migration for `source` and `visitor_hash`; indexes on `product_id`, `created_at`, and `source`.
- Confirm the live schema has `box_contents`, `sizes`, `sizes_detail`.
- RLS policies: anon reads published products; anon inserts analytics; service role full access.
- Expose the `rollout` schema to the Data API and run the grants (manual Supabase steps).

### Gaps and risks

- The current analytics table cannot answer "which backlink produced this?" — the `source` field fixes that.
- The current view count is raw; the daily hash gives an estimate of unique people, not an exact number.
- `price` remains in the table; keep it nullable, hide it from the public page, and stop requiring it in the admin.
- Images are Sanity URLs; the admin upload is not built yet. The developer seeds launch-day products.

### Still open

- Nothing structural. The real tag is configuration, not data.

---

## Layer 3 — Business logic

### Decided

- Only published products are publicly readable.
- The Amazon URL is derived from the product's ASIN plus the client's tag, at click time. It is never stored.
- Views and clicks are recorded server-side; known bots are skipped; a daily unique ID is stored; each event carries the platform source.
- Admin login uses Supabase's invite flow. The role is in `app_metadata`. Every admin page and action checks the role server-side with `getUser()`. The service key stays server-side. There is no permanent route that can create admins.
- A product may be published without an ASIN or tag. Its Amazon CTA is visible but greyed out and disabled; no click is recorded.
- Until auth exists, admin routes return 404.

### What to build

1. **Analytics writes** — accept `source` and `visitor_hash`; skip known bots by browser name; generate the daily hash on the server.
2. **Admin authorization** — server-side role check on every admin page and API route.
3. **CTA handoff** — fix the `await fetch` → `window.open` pattern. A blocked pop-up can record a click while Amazon never opens. Use a redirect route or a synchronous handoff.
4. **No-price rule** — remove price validation from the create API; make the admin field optional.
5. **Missing ASIN or tag** — allow publish; render the CTA greyed out and disabled; do not record a click. The same state applies if the built URL is incomplete.
6. **Affiliate config** — replace `athletica-20` with the client's real tag when the Amazon link is built; confirm which Amazon store his Associates account belongs to.

### Gaps and risks

- The current admin API has no auth. On a public domain, anyone can delete products. This is a launch blocker only if admin routes are reachable; until then, they must 404.
- The CTA pop-up pattern is a conversion killer on phones and in-app browsers.
- The placeholder tag is a guess. If it ships, clicks may earn nothing; the real tag is required before launch.
- The click is recorded when `window.open` is called, not when Amazon actually opens; a blocked pop-up creates a false click.
- Reviews and price fields are stale; no price display is the correct choice under Amazon's policy.

### Still open

- Deferred: real tag + store. Contact the client when building the Amazon link; the CTA stays greyed out until then. Not a build blocker.

---

## Layer 4 — Functionality

### Decided build order

1. **Product page** — the only thing visitors see.
2. **Admin** — the client can add, edit, publish, and unpublish.
3. **Analytics page** — after the product page and admin.

On launch day, before the admin is ready, the developer enters the two products directly.

### MVP functions

- Open a published product by slug.
- Show the product story, images, details, sizes, and CTA.
- Send the visitor to Amazon; record the click.
- Publish a product even when its ASIN or tag is missing; the CTA is disabled.
- Record the view with its platform source.
- 404 for root, missing, or unpublished product.
- Admin (later): login, edit, publish/unpublish, image upload to Sanity.
- Analytics page (later): views, clicks, CTR, per product, date range, source split.

### Out of scope

Visitor accounts, cart, checkout, payments, search, categories, blog, reviews, stock management, multi-product browsing, traffic-source analytics beyond the two tags, funnels, advanced attribution.

### Still open

- Whether the admin is required on launch day or can follow a few days later. The decision file says the developer seeds the two products, so the admin can follow.
- Whether image upload is in the first admin or URL paste is enough for launch. The decision file says upload; the existing editor accepts URLs. Recommendation: launch with URLs; add upload next.

---

## Layer 5 — UX

### The first-user journey

1. **Before the click:** the user sees a marketer's post on Instagram or WhatsApp. The post already created interest. The link preview must match the product.
2. **The click:** the user lands on the product page, usually on a phone inside an in-app browser.
3. **First screen:** image, product name, the details the post left out, and the CTA. No price.
4. **The scroll:** story, benefits, technical details, sizes, gallery, box contents — real content only.
5. **The action:** tap SHOP PRODUCT → Amazon must open.
6. **After:** the owner sees the view and click, tagged by platform.

### What the MVP needs

- A correct link preview (title, description, OG image).
- A fast first screen on mobile data.
- A CTA that works in Instagram's and WhatsApp's in-app browsers.
- A greyed-out CTA when the ASIN or tag is missing — visible, disabled, honest.
- Honest states: loading, product not found, incomplete link, broken image.
- Real content; no fake box contents or stock photos.
- No price; no stale currency.
- A 404 that does not confuse (plain, intentional).

### Gaps and risks

- The link preview currently says "Create Next App" — the biggest UX gap before the click.
- Pop-up blocking can make the CTA look broken.
- The mock box contents and Unsplash fallback undermine trust.
- No mobile performance check yet.
- The two audiences differ (Instagram vs WhatsApp), so a difference in results may be audience, not platform.

### Measurement caveat

Each link carries a platform tag, so every view and click can be attributed to a product and a source. But because Link 1 (Instagram) goes to Product 1 and Link 2 (WhatsApp) goes to Product 2, **the platform and the product are confounded**. A difference between the two links may be the product, not the platform.

- If the goal is "does the loop work?" — this is fine.
- If the goal is "which platform is better?" — point both links at the same product, or run a second round that swaps the products.

### Still open

- Nothing visual. The remaining items are operational.

---

## Layer 6 — System model

### Decided

- One public Vercel project for `rollout/`, Root Directory `rollout`, free `*.vercel.app` address.
- One Supabase project; `rollout` schema; RLS enabled; schema exposed; grants applied.
- Supabase Auth for the admin: invite by email; role in `app_metadata`; server-side `getUser()` checks.
- Service-role key and Sanity write token stay server-side.
- Admin routes 404 until auth exists.
- Sentry for error monitoring: server and client errors, email alert, PII off.
- Analytics page later.
- The mature `frontend/` app stays private/development-only.

### What to build

- Vercel project + environment variables: Supabase URL, anon key, service-role key; Sanity write token; remove the legacy `NEXT_PUBLIC_SYSTEM_TYPE` if unused.
- Supabase: expose `rollout`, grants, RLS policies, confirm the schema-update columns.
- Admin auth: Supabase invite, `app_metadata` role, server checks.
- Sentry: server + client error capture, email alert, PII off. A free uptime ping on the two product URLs is still recommended, because Sentry does not report "the site is down."
- One smoke test: product page loads; CTA returns a URL; unauthenticated admin request is rejected.
- Rollback: redeploy the previous Vercel build; database changes are additive.

### Gaps and risks

- No admin auth in the code today; until it exists, admin routes must 404.
- No monitoring today; the owner would learn about a broken link from silence. Sentry covers errors; an uptime ping covers "down."
- No tests; a small service change can break the only revenue path.
- Manual Supabase setup (schema exposure, grants, RLS) is easy to forget; use the checklist.
- The two apps share one Supabase project; isolation is by schema. Keep rollout queries scoped to `rollout`.

### Still open

- Operational: who deploys and what triggers a rollback. Not launch-blocking.

---

## Recommendation (updated)

**Option A — ship the product page first, then the admin, then analytics.** This matches the decision file and the solo-operator reality.

**The rest of the build can start now.** The Amazon link is the only deferred piece.

**Launch gate:**

1. Product page with real content, correct metadata/OG, no price, reliable CTA (greyed out when ASIN/tag is missing), 404 states.
2. Views and clicks recorded server-side with `utm_source` (instagram/whatsapp) and a daily unique ID.
3. Real Amazon Associates tag + store in the config — deferred until the Amazon link is built; required before launch, not before build.
4. Vercel address fixed before any backlink is posted.
5. Admin routes 404 until auth is built; admin follows.
6. Two products seeded with real Sanity images.
7. Sentry live: server + client errors, email alert, PII off.

**Metric:** Amazon CTR — clicks ÷ product page views — split by source (instagram vs whatsapp). Secondary: daily unique visitors per source.

**Trade-off named:** no price means the visitor cannot compare on-page, but Amazon's policy forbids hand-typed prices; no homepage means the two backlinks must carry the entire entry; only two products means the test is about the loop, not the catalog.

**Caveat:** with one product per platform, the two-link test compares links, not platforms cleanly. If platform comparison matters, use the same product on both links.

---

## Launch checklist

### Can do now — no Amazon tag needed

- [ ] Remove the price display and the hardcoded `$` from the product page.
- [ ] Remove the "price must be > 0" rule from the admin API; make the price field optional.
- [ ] Add per-product `generateMetadata` (title, description, OG image).
- [ ] Replace the root layout metadata ("Create Next App") with Athletica.
- [ ] Remove mock box contents and Unsplash fallbacks; require real content.
- [ ] Add `source` and `visitor_hash` to analytics; skip known bots.
- [ ] Make `/` and unpublished/missing products return a plain 404.
- [ ] Make `/admin/*` return 404 until auth exists.
- [ ] Fix the CTA handoff so a blocked pop-up cannot record a false click.
- [ ] CTA says SHOP PRODUCT; greyed out and disabled when ASIN or tag is missing; no click counted.
- [ ] Wire Sentry (server + client, email alert, PII off).
- [ ] Add an uptime ping on the two product URLs (recommended).
- [ ] Choose the Vercel address before posting links.
- [ ] Seed the two products with real Sanity image links.
- [ ] Check the page on a real phone (Instagram/WhatsApp in-app browser) and a real PC.

### When building the Amazon link — contact the client

- [ ] Contact the client for his Associates tag and the Amazon store his account is in.
- [ ] Put the tag in the affiliate config and set the store domain.
- [ ] Click-test the link; check for `&tag=YOUR-REAL-TAG`.
- [ ] Confirm the CTA becomes active once the tag is in.
- [ ] Check the Associates report after the first clicks.

### Admin — after the product page

- [ ] Supabase invite flow; public sign-ups off.
- [ ] Admin role in `app_metadata`; server-side `getUser()` check on every admin page and action.
- [ ] No permanent route that can create admins.
- [ ] Product editor: price optional; publish/unpublish.
- [ ] Image upload to Sanity; write token server-side.
- [ ] Remove the admin 404 only when auth is live.

### Analytics — after the admin

- [ ] Analytics page: total views, total clicks, CTR, per product, 7/30/90 days.
- [ ] Source split: instagram vs whatsapp.
- [ ] Empty, loading, and error states; no fake zeros.

### Launch

- [ ] Post Link 1 on Instagram with `?utm_source=instagram`.
- [ ] Post Link 2 on WhatsApp with `?utm_source=whatsapp`.
- [ ] Verify views and clicks are recorded with the right source.
- [ ] Confirm the Amazon link carries the real tag.
- [ ] Check the CTA is active with the tag, and greyed out when the tag is removed.
- [ ] Watch the first day's counts; check for cached-page undercounting.

---

## Still open

- **Amazon tag + store — deferred.** Contact the client when building the Amazon link. Until then the CTA stays greyed out. It does not block the build; it must be in place before launch.
- **Kickoff gaps worth handling during the build:** affiliate disclosure, privacy policy, rate limiting, audience geography/store fit, accessibility + performance, critical-path tests + handoff.

**Not launch-blocking (decide during the admin/analytics phase):**
- Exact admin timing; image upload vs URL paste.
- Who deploys; what triggers a rollback.

---

*Prepared as a recommendation. No code, configuration, deployment, or product change was made.*
