# Handoff — ROLL-14 (rollout product page)

**To:** Architect
**From:** Developer agent, at the owner's request
**Date:** Sat Oct 31 2026
**Project:** `athletica` — `rollout` app
**Repo:** `/home/lordwhitefire/current-project/athletica/athletica`

Read this as the state on disk as of today, not as a plan. Everything here was verified against
files or rendered output today. Where something was not verified, it says so.

## 1. The short version

ROLL-14 — affiliate config, `/go/[id]` redirect, click measurement — **is complete and its
benchmarks are met.** The product page has since been **redesigned and repopulated by owner
direction**, well outside ROLL-14's scope. The affiliate machinery survived that intact, but the
page it lives on is not the page ROLL-14 was written against.

The rollout now holds **one product**. That is intentional.

## 2. What ROLL-14 was

From `openspec/tasks/ROLL-14/task.md`:

| # | Requirement | Where it lives |
|---|---|---|
| — | `AMAZON_TAG` / `AMAZON_MARKETPLACE` from server env; no hardcoded `athletica-20` | `src/lib/affiliate/affiliate-service.ts` |
| — | `GET /go/[id]?source=...` — lookup product, derive affiliate URL, record click, 302 | `src/app/go/[id]/route.ts` |
| — | CTA disabled when product has no ASIN or tag/marketplace missing; else navigate to `/go/[id]?source=...` | `ProductDetailsClient.tsx` + `ctaEnabled` computed in `page.tsx` |
| — | Click recording skips silently for bots, missing IP, missing salt, rate-limited | `/go/[id]/route.ts` |
| — | `recordClick(id, source, visitorHash)` with source and hash | same |
| — | Both vars blank in `.env.example` | `.env.example` |
| — | `getProductById` on the public client | `src/lib/products/product-service.ts` |
| — | No `window.open`, no client-side URL derivation, no `/api/affiliate` fetch | verified absent |
| — | No commit or push | nothing committed |
| — | No admin auth / price changes / Sentry / tests | none done |

**Verification method:** grep + file read today, plus `next build` running `tsc` clean (10 routes
generated). The `/go/[id]` 302 itself was **not exercised at runtime** — see §6.

**One caveat on the source documents.** `developer-workspace/ROLL-14/report.md` — the ROLL-14 report
— contained two errors: it named the affiliate variables `ANALYTICS_TAG` / `ANALYTICS_MARKETPLACE`
(real names are `AMAZON_TAG` / `AMAZON_MARKETPLACE`), and it recorded its "no `athletica-20`" check
against `src/lib/analytics/affiliate-service.ts`, a path that does not exist. Because the path was
wrong, that check passed vacuously — it returned no matches without ever reading the real file, so
the recorded proof was not a real verification. **This is exactly the failure mode this handoff is
meant to guard against, and it happened.**

It has since been corrected and genuinely re-verified against the real path
(`src/lib/affiliate/affiliate-service.ts`); the claim is true. The wrong version stays on record with
a dated correction block at the top of that file. Every claim in *this* handoff was verified against
the live files and rendered output, not read out of that report.

## 3. What the system actually is now

**Stack:** Next.js 16.3.4, React 19.2.8, Tailwind CSS v4, Supabase Postgres (`rollout` + `public`
schemas), `@supabase/supabase-js` v2, `@sanity/client` v7. No test runner installed.

**Data:**

| Table | Rows | State |
|-------|------|-------|
| `rollout.products` | **1** (`JI1092`, published) | full text + 8 images |
| `rollout.analytics` | 6 columns | view/click recording |
| `public.products` | 39 | **untouched** — the source of truth for product data |

`JI1092` (`adidas-predator-elite-ft-fg-white-light-green`) has all of: collection, tagline, subtitle,
intro, 5 key benefits, technical details (adjustment/range/sole_type/upper_material), traction, price,
gender, color, 14 sizes, 14 sizes_detail rows, and 8 images. It was mapped from `public.products`
with the same method that can map the rest.

**The product page** (`src/app/product/[slug]/`) is a dynamic, client-rendered page reading all its
image slots from the row:

```
images[0..3] → hero + 4 thumbnails
images[4]    → story image
images[5..7] → supporting gallery
```

It shows collection, name (uppercase), tagline, subtitle, gender/colour, story, 5 benefit cards, a
technical details list, a specifications list, and a gallery. **No price. No sizes.** Both omitted
deliberately, matching the original design the page was built from.

**Images: 4 real, 4 placeholder.** Slots 0–3 are real product photos of this boot
(fcsoccer.ca / assets.adidas.com / futbolmania.com). Slots 4–7 are Unsplash editorial stock. The
3 original Sanity URLs were removed from that row on owner instruction. The original 3 URLs are still
recoverable from `public.products.image_links`.

**`next/image` was dropped** for plain `<img>` across the product page, so product images get no
Next.js optimization and non-Sanity hosts work without `next.config.ts` changes (which the owner
forbade touching). `cdn.sanity.io` remains the only entry in `remotePatterns`.

**CTA is disabled for the only product there is.** `AMAZON_TAG` and `AMAZON_MARKETPLACE` are blank
in `.env.local`, and JI1092 has no ASIN. The button renders "Link coming soon" and `/go/JI1092`
returns 404 on the ASIN check. This is correct behaviour, not a bug.

## 4. Deviations from ROLL-14 — all owner-directed

Recorded in full in `developer-workspace/ROLL-14/deviations-report.md`. Summary:

| # | Deviation | Authority |
|---|---|---|
| 1 | Product page fully redesigned from an external design doc, replacing the pixel-match layout | owner |
| 2 | `next/image` → `<img>` to avoid editing `next.config.ts` | owner ("do not touch anything") |
| 3 | CTA markup rewritten, text sizes raised; **behaviour preserved** | owner |
| 4 | 8 images written into the DB for JI1092; **3 Sanity images removed** so it is 8 not 11 | owner |
| 5 | **39 rows deleted from `rollout.products`** after the agent recommended unpublishing instead | owner, twice |
| 6 | `/predator` static prototype route deleted | owner |
| 7 | `:3000` dev server closed; `:3011` restarted several times | owner |
| 8 | An unexpected `:3011` kill during a cleanup `pkill`, then restarted | agent error, disclosed |

The consequence of #1 that the architect most needs to know: **the ROLL-14 runtime-parity claims
were written against the old markup and no longer describe what renders.** They need re-running
against the current design before they carry any weight. They are on record as-is; none were edited
to fit a result.

The consequence of #5: 35 of those 39 rows carried real product photography (≈120 URLs). That
photography is gone from `rollout.products`. A backup of the 39 rows sits at
`/tmp/opencode/rollout-deleted-backup.json` — **in `/tmp`, so it will not survive a reboot.** If the
architect wants a second rollout wave, `public.products` still has the source data.

## 5. Decisions the owner has already made

- The rollout product page holds **one** product; this is intentional, not a gap to fill.
- **No price and no sizes** on the product page, matching the original design it was rebuilt from.
- CTA stays disabled until an ASIN and a real affiliate tag exist.
- Unsplash imagery is a temporary measure, to be replaced before launch.
- Nothing is committed. The owner reviews and commits.

## 6. What is verified, and what is not

**Verified today** (grep + file read, or rendered HTML from the running server on `:3011`):

- ROLL-14 benchmarks — see §2
- No `athletica-20`, no `window.open` anywhere in the product page
- `/go/[id]/route.ts` exists with lookup, derive, `recordClick(id, source, visitorHash)`, 302
- CTA gate wiring in both files
- Build passes TypeScript clean, 10 routes, `/product/[slug]` the only product route
- Product page serves 200 with real product data; deleted slug 404s, `/predator` 404s
- 0 Sanity refs and 0 old `pixel-*` classes in the rendered page
- `rollout.products` = 1 row

**Not verified** — flagging these as gaps, not as working:

- **`/go/[id]` has not been exercised end-to-end at runtime.** With no ASIN and no tag it can only
  be reached as a 404. The code was read and statically satisfied; the 302 path is untested. To
  test it someone needs an ASIN plus real `AMAZON_TAG`/`AMAZON_MARKETPLACE`.
- **No automated tests exist.** Vitest (ROLL-18) was explicitly out of scope and is not installed.
- **`getClientIp` returns `'0.0.0.0'` rather than `null`** behind this proxy, which deviates from the
  ROLL-12 spec for the missing-IP case. Because the guard is `if (ip && ...)`, a non-null dummy IP
  means analytics never skips for a missing IP. Carried over from ROLL-12, not fixed here.
- **The remaining 38 products were never mapped.** Only JI1092 carries full text.
- Parity claims for ROLL-14 are stale against the current markup.

## 7. Open items for the architect

1. **Affiliate enablement.** Needs a real ASIN for the product and real `AMAZON_TAG` /
   `AMAZON_MARKETPLACE` in `.env.local` and Vercel Production. Until then the CTA and `/go/[id]` are
   deliberately inert. `ANALYTICS_HASH_SALT` also needs to exist in Vercel or analytics silently
   skips. *(Owner ruling 2026-10-31: deferred — not a blocker.)*
2. **Image strategy.** 4 of 8 slots are Unsplash stock. Decide: keep as editorial placeholders,
   replace with real photography, or drop the story/gallery sections. Real Sanity images also imply
   deciding whether `next/image` should come back, which means a `remotePatterns` decision.
3. **Whether `rollout` should hold more than one product.** The owner currently says one. The other
   38 still have real data in `public.products` and can be mapped. If a second wave is wanted, the
   deleted rows' image URLs are in the `/tmp` backup until that file is lost.
4. **The ROLL-14 parity claims** should be re-derived against the new design, or formally retired.
5. **`getClientIp` `'0.0.0.0'` behaviour** from ROLL-12 — decide whether it is accepted or fixed.
6. **Testing** — none exists; ROLL-18 was scoped and skipped.
7. **Commit policy** — the whole tree is uncommitted; the owner commits.

## 8. Files that carry this story

| File | What it is |
|---|---|
| `openspec/tasks/ROLL-14/task.md` | the spec; benchmarks verified met |
| `developer-workspace/ROLL-14/report.md` | the ROLL-14 report — predates today's work; **corrected Oct 31** (see §2) |
| `developer-workspace/plans/roll-14-report-correction.md` | plan for that correction — done |
| `developer-workspace/ROLL-14/deviations-report.md` | full deviation record with per-item authority |
| `developer-workspace/ROLL-14/architect-handoff.md` | this file |
| `developer-workspace/ROLL-14/product-JI1092.md` | the populated product record |
| `developer-workspace/ROLL-14/plan-fix-product-page.md` | the earlier pixel-match plan, now superseded |
| `developer-workspace/parity/claim/` | runtime-parity claims — **stale against current markup** |

**Server:** `:3011` only, running the current production build. `:3000` (dev) is closed.

---

## Architect's verification (2026-10-31)

Verified directly by the Architect against disk and the live database:

- `src/lib/affiliate/affiliate-service.ts` reads `process.env.AMAZON_TAG` / `AMAZON_MARKETPLACE`;
  both functions return `{ url: null, error: 'Affiliate not configured' }` when either is missing.
  No `athletica-20` anywhere.
- `src/app/go/[id]/route.ts` confirmed present with lookup → derive → `recordClick(id, source,
  visitorHash)` → `NextResponse.redirect(affiliate.url, 302)`, with bot/IP/salt/rate-limit guards.
- `getProductById` present at `src/lib/products/product-service.ts:128`.
- `.env.example` has `AMAZON_TAG=` and `AMAZON_MARKETPLACE=` blank.
- Live DB query confirms `rollout.products` = **1 row**: `JI1092` /
  `adidas-predator-elite-ft-fg-white-light-green` / `published` / `asin NULL` / 8 images.
- The `report.md` correction block was read and confirmed: real variable names named, the vacuous
  file-path check acknowledged as "not a real verification of anything," and the claim re-verified
  against the correct path.

**Third error still present in `report.md` (not caught by the Oct 31 correction).**
The runtime-check section states that `/go/V4qZOE` returned 404 "because `ANALYTICS_HASH_SALT` is
not set in `.env.local` → `getVisitorHash` throws → route returns 404." That explanation is wrong
on both counts:

1. `ANALYTICS_HASH_SALT` **is** set — confirmed in `.env.local` by the Architect.
2. Even if it were unset, `getVisitorHash` throwing would be caught by the `try/catch` in
   `/go/[id]/route.ts`, which skips recording and **continues to the redirect**. It cannot cause a 404.

The real cause of any 404 in that route is one of three gates, in order: product not found, product
has no ASIN, or affiliate URL cannot be derived (which is what a missing `AMAZON_TAG` /
`AMAZON_MARKETPLACE` triggers). The conclusion "the route 404s when affiliate is unconfigured" is
correct; the stated mechanism is not. Left on record here rather than silently amended, because the
report is the developer's document.

**Status: ROLL-14 closed.** Benchmarks met; 302 path unproven by design (no ASIN, no tag — deferred
by owner, not a blocker). Deviations from ROLL-13 and the six-layer plan are recorded as
owner-directed changes in the registry, not as drift.
