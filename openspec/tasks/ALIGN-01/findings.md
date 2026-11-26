# ALIGN-01 — Findings (interim)

**Date:** 2026-11-17
**Method:** static + live-database evidence for the first pass. The code changes applied after
the owner's 2026-11-17 approval are listed under "Runtime evidence".
**Verdict key:** ✅ confirmed · 🟡 partly confirmed · ⏳ needs the running server · ❌ outdated/incorrect.

---

## A — The app does not build cleanly

**Verdict:** ✅ Confirmed. The draft says 54 errors; the real number was **57** at the static pass.

> **Update 2026-11-17:** after the fix, `tsc` reports **70** errors. The 17 missing-import
> errors are gone; the remainder are the existing route/type mismatches plus the new admin
> list types. The dev server starts and serves `/`, `/shop`, and `/admin/products` because
> Turbopack transpiles without type-checking. A full `next build` is still open.

`npx tsc --noEmit` in `rollout/` exits 2 with 57 `error TS` lines. Grouped:

| Code | Count | Meaning |
|---|---:|---|
| TS2305 | 17 | Imports that do not exist in the module |
| TS2322 | 11 | A value of one type assigned to another (mostly 2-state vs 5-state) |
| TS2737 | 9 | BigInt literals under a pre-ES2020 target |
| TS2554 | 6 | Function called with the wrong number of arguments |
| TS2367 | 5 | Comparison with no type overlap |
| TS2344 | 3 | Stale generated route types (`.next/types/validator.ts`) |
| TS2307 | 2 | Missing module |
| TS7006 / TS2724 / TS2588 / TS2345 | 1 each | Implicit any, missing export, const reassignment, cookie type |

The single biggest cause is **`createServiceClient` does not exist**. It is imported by 17
files:

- `lib/products/product-service.ts`
- `lib/products/bulk-operations.ts`
- `lib/products/csv-import.ts`
- `lib/affiliate/affiliate-service.ts`, `balance-service.ts`, `payout-service.ts`,
  `campaign-service.ts`, `signup-service.ts`
- `lib/amazon/creators-api-client.ts`, `dead-link-detector.ts`, `reviews-service.ts`
- `lib/analytics/analytics-service.ts`, `analytics-summary.ts`
- `lib/geo/marketplace-resolver.ts`
- `app/go/[id]/route.ts`

`src/lib/supabase/server.ts` exports only `createAdminClient` and `createPublicClient`.
So the public storefront, shop, product pages, admin products, affiliate, analytics, cron,
and the sitemap are all dead until that one export exists.

Second cause: **the admin products API calls functions that do not exist**:

- `getProductsAdmin` (only `listProducts` / `getProductByIdAdmin` exist)
- `publishProductAdmin`
- `unpublishProductAdmin`
- `createProductAdmin(payload, supabase)` — the service takes **one** argument
- `deleteProductAdmin(id, supabase)` — the service takes **one** argument

Third: **the admin editor is 2-state, the database is 5-state**:

- `product-editor.tsx` types `status` as `'published' | 'unpublished'`
- `admin/products/page.tsx` filters and toggles only `published` / `unpublished`
- `admin/products/route.ts` PATCH accepts only `published` / `unpublished`
- live `rollout.products` has `CHECK (status = ANY (ARRAY['draft','active','archived','proposed','rejected']))`

Fourth: **`visitor-hash.ts` is not a working hash**:

- 9 BigInt-literal errors (target below ES2020)
- `const b` is assigned later (`TS2588`)
- `sipRound(v => v, { ... })` passes an object of getters and the function body does nothing
- the comment itself says "simplified" and "placeholder compression rounds"

This is not a compile-target problem. The file is a placeholder, not SipHash-2-4.

Fifth: **`bot-filter.ts` imports `ua-parser-js`, which is not installed** (`TS2307`).

Sixth: **`src/app/api/analytics/route.ts` calls the service wrong**:
`recordView(productId, source, visitorHash)` / `recordClick(...)`, but the service takes one
object argument (`ViewArgs` / `ClickArgs`).

Seventh: `src/middleware.ts` passes `req.cookies` to `createRouteClient`, which expects the
`cookies()` store (`TS2345`).

---

## B — Data model and behaviour disagree

**Verdict:** ✅ Confirmed, and the disagreement is in both directions.

Live schema (`information_schema`):

- 3 schemas: `public`, `rollout`, `affiliate`
- 17 tables: 9 `rollout` (products, variants, categories, collections, marketplaces,
  product_categories, product_collections, amazon_product_cache, analytics, audit_log,
  admin_access_keys) + 6 `affiliate` (accounts, balance, campaigns, campaign_trackers,
  trackers, payouts)
- `rollout.products.status` is **nullable** and constrained to 5 values
- `rollout.products` has both `price` (numeric) and `price_cents` (integer)
- `rollout.products.box_contents` and `sizes` are NOT NULL
- `rollout.analytics.product_id` is nullable

App side:

- `database.types.ts` says `status: ProductStatus` (not nullable)
- `database.types.ts` has `price_cents` but the admin editor reads `product.price`
- the admin editor treats `box_contents` / `sizes` as arrays, and `meta` as an object
  (`TS2322` on `meta?.seo_title` etc. — `meta` is typed `{}`)
- the editor reads `meta.seo_title` / `meta.seo_description` / `meta.keywords`, while
  `lib/products/types.ts` defines `meta.seo.title` / `meta.seo.description`. The two
  shapes disagree, so even after the type errors are silenced, the SEO fields are written
  under one name and read from another.
- `box_contents` is `jsonb NOT NULL` in the database, `string | null` in
  `lib/products/types.ts`, and `string[]` in the editor. Three different shapes.

**Live product data:** 1 row, `status = active`, ASIN NULL, 8 images, 4 Unsplash placeholders.

**Public gate is correct in intent:** `product-service.applyPublicGate()` filters
`status = active AND deleted_at IS NULL AND available_on <= now()`, and the live RLS policy
`anon_can_read_published_products` says the same. The gate itself is not the problem; the
missing client is.

---

## C — Schema access and affiliate boundaries

**Verdict:** ✅ Confirmed. This is worse than the draft says.

1. **One client, one schema.** `createAdminClient()` / `createPublicClient()` are created
   with `db: { schema: 'rollout' }`. Every affiliate service then calls `.from('accounts')`,
   `.from('balance')`, `.from('payouts')`, `.from('campaigns')`, `.from('trackers')`.
   Those tables live in `affiliate`, not `rollout`. The affiliate services are querying
   tables that do not exist in the client's schema.

2. **The accounts RLS policy is wrong.** `affiliate_own_account` is:

   ```
   (( SELECT auth.uid() AS uid) = id)
   ```

   But signup writes `auth_user_id: authData.user.id` and returns the account's `id`
   (`signup-service.ts` lines 29–42). `id` is the account UUID, not the auth UID.
   A real affiliate therefore cannot read their own account row.

   The other affiliate policies (`balance`, `payouts`, `trackers`, `campaign_trackers`)
   compare `account_id` to `auth.uid()`, which is the right shape **only if** `account_id`
   holds the auth UID. `affiliate.accounts.id` is the account UUID, so those policies are
   also wrong unless `balance.account_id` / `payouts.account_id` / `trackers.account_id`
   are populated with the auth UID. The live tables are empty, so this is untested.

3. **RLS is not missing.** Earlier notes said RLS might be off. It is **on and forced** on
   all 17 tables, with 29 `rollout` policies, 18 `affiliate` policies, 20 `public`
   policies. The issue is the policy expressions, not the absence of RLS.

4. **`rollout.validate_door_key(text)` exists** and is a real SECURITY DEFINER function:
   SHA-256 hash lookup, `kind='door'`, not revoked, not expired, 30-day sliding renewal,
   returns `user_id`. Ten valid door keys exist, expiring 2026-12-02 through 2026-12-04.

5. **Exposed schemas:** cannot be proven from SQL. Owner-only (Supabase dashboard).

---

## D — Affiliate payout-term enforcement

**Verdict:** ✅ Confirmed. It is a no-op in both layers.

- `affiliate.enforce_payout_terms()` is `RETURNS void` and its body is only a comment:
  "Placeholder... For now this is a no-op stub the cron job calls safely."
- `src/app/api/cron/route.ts` `payout-term-check` branch does not call anything. It returns
  `{ ok: true, job: 'payout-term-check' }` immediately.
- `affiliate.campaigns.payout_term` exists but is nullable.
- `affiliate.balance` has no `eligible_for_payout` column; it has `released` and `trace`.
  The intended flag the SQL comment describes does not exist.

So the cron reports success while doing nothing.

---

## E — UI and backend contracts

**Verdict:** ✅ Confirmed, and broader than the draft's list.

**The affiliate workspace calls seven endpoints that do not exist.**

`src/components/affiliate/AffiliateWorkspace.tsx` lines 23–26:

```
'/api/affiliate/me'
'/api/affiliate/trackers'
'/api/affiliate/balance'
'/api/affiliate/payouts'
'/api/admin/affiliates'
'/api/admin/campaigns'
'/api/admin/payouts'
```

The only API routes in the app are:

```
api/admin/analytics/stream
api/admin/auth/{signin,signout,signup}
api/admin/media/{assets,upload}
api/admin/products, api/admin/products/[id]
api/affiliate/postback
api/affiliate/route.ts          (GET productId → Amazon URL)
api/analytics
api/cron
```

There is no `/api/affiliate/me`, no `/api/admin/affiliates`, no `/api/admin/campaigns`,
no `/api/admin/payouts`, no `/api/affiliate/trackers|balance|payouts`.

**Bulk actions are a UI preview.** `admin/products/page.tsx` `runBulkPreview()` sets a
toast: `"... queued for N selected product(s). Connect the bulk API to execute this action."`
No request is sent. `lib/products/bulk-operations.ts` has `bulkStatusUpdate`, `bulkArchive`,
`bulkAddToCollection`, etc., but nothing imports them and no API route exposes them. The
library also imports the missing `createServiceClient`.

**CSV import is a UI preview.** `catalog-workspace.tsx` line 66 chooses a `.csv`; the
"processing" state is a progress bar; the completion text says: *"The interaction flow has
reached its completed state. No products were written by this UI preview."* `csv-import.ts`
exists but is not called and imports the missing client.

**Media works only if the client exists.** `MediaLibrary.tsx` calls
`/api/admin/media/assets` and `/api/admin/media/upload`; those routes exist.

**Google/GitHub buttons are dead.** `auth-view.tsx` lines 113–121 render two
`<button type="button">` elements with no `onClick` and no `href`. They look like OAuth
options and do nothing.

**No price/currency on public pages.** `product/[slug]/page.tsx` says explicitly: "No price
displayed anywhere (Amazon Associates policy)." The homepage and shop have no price/currency
matches. That requirement is currently met.

**There is no admin screen for marketplace tags.** No page, component, or API route under
`src/app/admin` or `src/components/admin` writes `rollout.marketplaces.tag`. All 22 rows
have an empty tag. `deriveAmazonUrl()` therefore returns `null` for every marketplace.
The affiliate CTA can never become live through the UI, because there is no UI to enter the
tag it waits for.

---

## F — Sign-in options

**Verdict:** ✅ Confirmed (static). The buttons are visible and dead.

- `auth-view.tsx` (signin view): Google and GitHub buttons, no handler.
- `signup-form.tsx` lines 212–217: "Continue with Google" / "Continue with GitHub", no handler.
- No OAuth route, no provider config, no `signInWithOAuth` call anywhere in the admin
  signin/signup code.

Runtime behaviour (what a click does) still needs the server.

---

## G — Change set vs report

**Verdict:** ✅ Confirmed. The report is false.

Commit `19230dd` ("feat: apply athletica-full-build.patch") changes 47 files. The patch
inside the commit (`athletica-full-build.patch`) has 46 `diff --git` entries and includes
these UI files:

- `rollout/src/app/admin/{affiliates,analytics,campaigns,categories,collections,media,payouts,settings}/page.tsx`
- `rollout/src/app/admin/products/{page.tsx,import/page.tsx,admin.css}`
- `rollout/src/app/admin/catalog-workspace.tsx` + `.css`
- `rollout/src/app/affiliate/{balance,dashboard,payouts,signup,trackers,verify-email}/page.tsx`

The same commit adds `openspec/NON-UI-REMEDIATION-REPORT.md`, which says: **"Scope: non-UI
defects only. UI untouched."** That is contradicted by the same commit's diff.

---

## H — Baseline reconciliation

**Verdict:** 🟡 Partly confirmed.

- `19230dd` is the latest commit. `git status` shows only my own `openspec/` edits; the
  working tree is otherwise clean.
- The patch is **already applied**: `git apply --check` fails with "already exists in
  working directory" for the report, admin affiliate page, and others.
- A reverse check fails only because `openspec/tasks-registry.md` was edited after the
  patch; it cannot cleanly prove "applied" that way. The forward check is the stronger
  signal: the files already exist.
- The patch is therefore **not a usable baseline**. It is a record of a change already in
  the tree, and it is internally inconsistent with its own report.
- `openspec/specs/` and `openspec/archive/` are empty. There is no main spec to sync into.
- `openspec validate --all` fails `athletica-full-marketplace`: all 7 spec files have
  "No delta sections found."

---

## Additional problems the draft did not list

1. **`createServiceClient` is the single biggest defect.** One missing export takes down
   the public site, admin, affiliate, analytics, cron, and sitemap.
2. **The affiliate services use a `rollout`-scoped client for `affiliate` tables.**
3. **`affiliate_own_account` compares `auth.uid()` to `id` instead of `auth_user_id`.**
   Other affiliate policies likely have the same id/auth-uid confusion.
4. **`visitor-hash.ts` is a placeholder, not a hash.** It also mutates a `const`.
5. **`bot-filter.ts` imports `ua-parser-js`, which is not installed.**
6. **The analytics route calls `recordView`/`recordClick` with the wrong arity.**
7. **`middleware.ts` only matches `/admin/:path*`, not `/api/admin/:path*`.** The API
   admin surface is not door-key gated today.
8. **`proxy.ts` does not validate the door key at all.** It only slides the cookie and
   404s when there is no `sb-*` session cookie. The architecture line saying the door-key
   is "checked in `src/proxy.ts`" is false. The door-key check lives in `middleware.ts`.
9. **`middleware.ts` passes `req.cookies` to `createRouteClient`,** which expects the
   `cookies()` store.
10. **`products.status` is nullable in the database** but non-null in the generated type.
11. **All 22 `marketplaces` rows have an empty `tag`.** `deriveAmazonUrl()` returns `null`
    for every marketplace, so no affiliate link can be generated until tags are entered.
12. **Ten valid door keys exist**, with two different `user_id` values. Not a defect by
    itself, but the door-key issuance/rotation story is not clean.
13. **`getClientIp` returns `0.0.0.0`** when no forwarded header is present.
14. **The bulk library and CSV importer exist but are not wired to any route.**
15. **`sitemap.ts` uses a `string` for `changeFrequency`** where Next expects a literal union.
16. **The full-marketplace specs are prose, not deltas.** `openspec validate --all` fails.
17. **No admin UI to enter `marketplaces.tag`.** All 22 rows are empty; no route exists.
18. **The editor and the product type disagree on the `meta` shape** (`seo_title` vs
    `seo.title`) and on `box_contents` (jsonb / string|null / string[]).

---

## Runtime evidence — 2026-11-17 (server on)

The server is on **port 4252** (Next.js 16.3.4, Turbopack). The gate merge is applied:
`src/proxy.ts` checks `rollout.validate_door_key` for `/admin/*` and `/api/admin/*`;
`src/middleware.ts` is deleted.

| Check | Result |
|---|---|
| `/` | **200** — hero + product `Predator/Elite-FT-FG` |
| `/shop` | **200** — the same product in the grid |
| `/admin/products` with no door key | **404** `{"error":"Not found"}` |
| `/admin/products` with a valid door key + admin session | **200** — `JI1092`, `active`, `$167.99`, Edit/Unpublish/Delete |
| `/admin/signin` with no door key | **404** |

### Defects found and fixed to get there

- **A:** `createServiceClient` was missing. Added as an alias of `createAdminClient`.
- **B:** the app's `applyPublicGate` used `.lte('available_on', now)`, which hides
  `available_on IS NULL`; the RLS policy allows NULL. Fixed with
  `.or('available_on.is.null,available_on.lte.<now>')`.
- **E:** the admin API imported `getProductsAdmin`, `publishProductAdmin`, and
  `unpublishProductAdmin`, none of which existed. Added; the 2-state UI now maps
  `published` → `active` and `unpublished` → not active. The admin page shows the real product.
- **New:** the door-key cookie was set with `Path=/admin` only, so it was not sent to
  `/api/admin/*`, which the gate also protects. Fixed: one cookie per path (`/admin` and
  `/api/admin`) in both `setDoorKeyCookie` and the proxy slide.
- **New:** the product image host `fcsoccer.ca` is not in `next.config.ts`, so the home page
  500'd on `next/image`. The owner forbade touching `next.config.ts`; the storefront
  `<Image>` components now use `unoptimized`. The proper fix is one remote-pattern line in
  `next.config.ts` when the owner allows it.

### Still to check at runtime

- **E:** bulk bar, CSV import, media library, affiliate workspace, dead endpoints.
- **F:** Google/GitHub buttons (expected: nothing).
- **C:** a real affiliate signup through the affiliate schema (tables are empty).
- **D:** the cron endpoint's `payout-term-check` (expected: success, because it is a no-op).
- **A:** a full `next build` (the dev server transpiles; `tsc` still reports type errors).
- **E:** the 5-state admin UI (only the two-state mapping is wired; the model is still 5-state).

## What was changed after the static pass

The owner overrode the no-code gate on 2026-11-17 and asked for the fix. Changes applied:

- `rollout/src/proxy.ts`: door-key RPC gate for both prefixes; two-path cookie slide.
- `rollout/src/middleware.ts`: deleted.
- `rollout/src/lib/supabase/server.ts`: added `createServiceClient`.
- `rollout/src/lib/products/product-service.ts`: fixed the public gate; added the three admin
  functions; optional client parameter on the admin writes.
- `rollout/src/app/admin/products/page.tsx`: two-state labels mapped to the 5-state data;
  toggle now compares `active`.
- `rollout/src/lib/auth/door-key.ts`: door key set on both `/admin` and `/api/admin`.
- `rollout/src/components/storefront/{ThreeItemGrid,Carousel,ShopGrid}.tsx`: `unoptimized`
  on external product images (workaround; `next.config.ts` untouched).

The database was **read-only** except for one door-key row created for the visible-browser
check (`kind='door'`, 30-day expiry, label `local visible-browser check`). No product,
affiliate, or schema change. The door key can be revoked with
`update rollout.admin_access_keys set revoked_at = now() where browser_label = 'local visible-browser check';`.

## Gate

The static pass was read-only. The owner then explicitly overrode the no-code gate and asked
for the fix, so the changes above were applied. This file remains evidence; the plan for the
remaining defects is separate.