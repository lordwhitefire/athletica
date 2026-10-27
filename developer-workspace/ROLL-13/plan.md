# ROLL-13 — Implementation Plan

## Overview

Build the first customer-facing Production page: `/product/[slug]`. Shows real content only, records views server-side with source attribution, never displays price, returns a plain 404 for missing/unpublished products. Depends on ROLL-12 (schema scoping + analytics helpers).

## Decisions carried in

| # | Decision |
|---|----------|
| 1 | 404: `notFound()` for missing slug or `status !== 'published'`; minimal copy, no product-specific text. |
| 2 | Source: `?source=instagram`/`?source=whatsapp` from `searchParams`, normalized via `normalizeSource`; anything else → `null`. |
| 3 | View recording: server-side after 404 check; skip if bot; skip if rate-limited; skip if IP null or salt missing; pass `source` + `visitorHash`; fire and forget, catch errors. |
| 4 | No price: remove all price display from client page; `price` stays in DB/admin. |
| 5 | Images: `next/image` with `fill`; hero = `priority`, others = `lazy`; all with `alt`; `cdn.sanity.io` added to `remotePatterns`. |
| 6 | Mock content: remove `mockBoxContents`/`FALLBACK_BOX_IMAGE`; box contents only when present, bulleted list under "What's inside the box"; omit section if empty/missing. |
| 7 | CTA: disabled ("Link coming soon"), no `window.open`, no `/api/affiliate` fetch. |
| 8 | Disclosure: "As an Amazon Associate, I earn from qualifying purchases." near CTA. |
| 9 | Metadata: title = `product.name`, description = `product.tagline` or `product.intro`, `og:image` = `product.main_image`. |
| 10 | Missing IP → skip recording silently; page still renders. |
| 11 | Skip recording silently (no console.error/warn) for bot, rate-limited, missing salt. |
| 12 | Layout: existing root layout, no new layout file. |
| 13 | CSS: leave `rollout1-pixel-match.css` untouched. |
| 14 | Keep `'use client'` on `ProductDetailsClient.tsx`. |
| 15 | Delete custom `not-found.tsx`; use Next.js default 404. |

## Dependency graph

```
next.config.ts (cdn.sanity.io)
     │
     └─ next/image on product page needs remotePattern
delete not-found.tsx
page.tsx (server component with analytics)
     │
     └─ ProductDetailsClient.tsx (client component, accepts source prop)
```

## Task list

### Phase 1: Foundation

### Task 1 — Image configuration: add `cdn.sanity.io` to `next.config.ts`

**Description:** Add `cdn.sanity.io` to `images.remotePatterns` in `rollout/next.config.ts` so `next/image` can load Sanity-hosted product images.

**Acceptance criteria:**
- [ ] `rollout/next.config.ts` has `images.remotePatterns` with `cdn.sanity.io` hostname.
- [ ] No other config changes.
- [ ] `npx tsc --noEmit` passes (checkpoint CP1).

**Verification:** Read `next.config.ts`; confirm `remotePatterns` entry; `tsc`.

**Dependencies:** none.

**Files:** `rollout/next.config.ts` (1 file).

**Size:** S.

**Commit:** `ROLL-13 T1: add cdn.sanity.io to next/image remotePatterns`

---

### Task 2 — Delete custom 404 page

**Description:** Delete `rollout/src/app/product/[slug]/not-found.tsx` so `notFound()` produces Next.js default 404 with no product-specific copy.

**Acceptance criteria:**
- [ ] `rollout/src/app/product/[slug]/not-found.tsx` deleted.
- [ ] No other file references the deleted file.
- [ ] `npx tsc --noEmit` passes (checkpoint CP1).

**Verification:** `ls` confirms file gone; `rg` confirms no references; `tsc`.

**Dependencies:** none.

**Files:** `rollout/src/app/product/[slug]/not-found.tsx` (deleted, 1 file).

**Size:** S.

**Commit:** `ROLL-13 T2: delete custom product 404 page`

---

### Checkpoint 1 — after T1–T2

- [ ] `npx tsc --noEmit` exits 0.
- [ ] `next.config.ts` has `cdn.sanity.io` remote pattern.
- [ ] `not-found.tsx` deleted.

---

### Phase 2: Server component

### Task 3 — Rewrite product page server component — `page.tsx`

**Description:** Rewrite `rollout/src/app/product/[slug]/page.tsx` to accept `searchParams`, fetch product, `notFound()` for missing/unpublished, extract and normalize `source`, read headers/IP/UA, skip recording for bots/missing-IP/missing-salt/rate-limited, call `recordView(product.id, source, visitorHash)` fire-and-forget, add `generateMetadata`, pass `source` to client component.

**Acceptance criteria:**
- [ ] `params` and `searchParams` both awaited (Next.js 16 Promises).
- [ ] `getProductBySlug(slug)` called; `notFound()` when no product or `status !== 'published'`.
- [ ] `source` read from `searchParams.get('source')`, normalized via `normalizeSource`.
- [ ] Headers read via `await headers()`; IP via `getClientIp(headers)`; UA via `headers.get('user-agent')`.
- [ ] `isBotUserAgent(ua)` → true skips recording entirely (silently).
- [ ] IP null → skips recording silently.
- [ ] `getVisitorHash(ip, ua)` called; missing salt caught, recording skipped silently.
- [ ] `checkAnalyticsRateLimit(hash)` → `success: false` skips recording silently.
- [ ] `recordView(product.id, source, visitorHash)` fire-and-forget, `.catch()` errors.
- [ ] `generateMetadata` with title = `product.name`, description = tagline/intro, `og:image` = `main_image`.
- [ ] `source` passed to `ProductDetailsClient` as prop.
- [ ] `npx tsc --noEmit` passes (checkpoint CP2).

**Verification:** Read `page.tsx`; confirm all acceptance criteria; `tsc`.

**Dependencies:** T1, T2.

**Files:** `rollout/src/app/product/[slug]/page.tsx` (1 file).

**Size:** S.

**Commit:** `ROLL-13 T3: rewrite product page server component`

---

### Checkpoint 2 — after T3

- [ ] `npx tsc --noEmit` exits 0.
- [ ] Page sources and records views with bot/rate-limit/salt guards.

---

### Phase 3: Client component

### Task 4 — Rewrite product client component — `ProductDetailsClient.tsx`

**Description:** Rewrite `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` to remove price block, remove `window.open`/`/api/affiliate` fetch, replace `handleShop` with disabled "Link coming soon" button, remove `mockBoxContents`/`FALLBACK_BOX_IMAGE` imports, show box_contents only when present as bulleted list under "What's inside the box", replace all `` tags with `next/image` (hero `priority`, others `lazy`, all with `alt`), add Amazon Associates disclosure near CTA, accept `source?: AnalyticsSource | null` prop.

**Acceptance criteria:**
- [ ] Price block removed entirely (`typeof product.price === 'number'` → deleted).
- [ ] `window.open` removed; no `/api/affiliate` fetch.
- [ ] `handleShop` replaced with disabled button labeled "Link coming soon".
- [ ] `mockBoxContents` and `FALLBACK_BOX_IMAGE` imports removed.
- [ ] `box_contents` shown only when present; bulleted list under "What's inside the box"; section omitted if empty/missing.
- [ ] All `` tags replaced with `next/image`: hero `priority`, gallery/thumbnails `lazy`, all with `alt`, all with `fill`, hero `sizes="(max-width: 768px) 100vw, 50vw"`, others `sizes="50vw"`.
- [ ] Amazon Associates disclosure: "As an Amazon Associate, I earn from qualifying purchases." near CTA.
- [ ] `source?: AnalyticsSource | null` prop accepted and stored.
- [ ] `'use client'` directive kept.
- [ ] `rollout1-pixel-match.css` untouched.
- [ ] `npx tsc --noEmit` passes (checkpoint CP3).

**Verification:** Read `ProductDetailsClient.tsx`; static greps for price/window.open/mockBoxContents/next/image; `tsc`.

**Dependencies:** T1, T3.

**Files:** `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` (1 file).

**Size:** S.

**Commit:** `ROLL-13 T4: rewrite product client component`

---

### Phase 4: Verify

### Task 5 — Verify: tsc + static checks + report

**Description:** Run `npx tsc --noEmit` and static checks; write implementation report.

**Acceptance criteria:**
- [ ] `npx tsc --noEmit` exits 0.
- [ ] `rg` confirms no `price` display in `ProductDetailsClient.tsx`.
- [ ] `rg` confirms no `window.open` in `rollout/src/app/product/[slug]/`.
- [ ] `rg` confirms no `mockBoxContents`/`FALLBACK_BOX_IMAGE` in `rollout/src/app/product/`.
- [ ] `rg` confirms `next/image` usage in `ProductDetailsClient.tsx`.
- [ ] `rg` confirms `recordView` called with `source` + `visitorHash` args in `page.tsx`.
- [ ] `rollout1-pixel-match.css` unchanged.
- [ ] `not-found.tsx` deleted.
- [ ] Report written at `developer-workspace/ROLL-13/report.md`.
- [ ] Six commits exist (one per task); nothing pushed.

**Verification:** `tsc`; static greps; `git log --oneline -6`; `git status --short`.

**Dependencies:** T1–T4.

**Files:** `developer-workspace/ROLL-13/report.md` (1 doc).

**Size:** S.

**Commit:** `ROLL-13 T5: verify and report`

---

### Checkpoint 3 — after T5

- [ ] `npx tsc --noEmit` exits 0.
- [ ] All static checks pass.
- [ ] Report written; six commits exist; nothing pushed.

---

## Command batch (single approval)

```bash
cd /home/lordwhitefire/current-project/athletica/athletica

# Preflight (read-only)
node --version
git status --short
git diff --stat
git check-ignore -v rollout/.env.local 2>/dev/null || true

# Typecheck after each task group
cd rollout && npx tsc --noEmit

# Static checks
rg -n "price" rollout/src/app/product/[slug]/ProductDetailsClient.tsx || echo "no price (good)"
rg -n "window\.open" rollout/src/app/product/[slug]/ || echo "no window.open (good)"
rg -n "mockBoxContents\|FALLBACK_BOX_IMAGE" rollout/src/app/product/ || echo "no mock content (good)"
rg -n "next/image" rollout/src/app/product/[slug]/ProductDetailsClient.tsx
rg -n "recordView" rollout/src/app/product/[slug]/page.tsx
rg -n "cdn\.sanity\.io" rollout/next.config.ts
ls rollout/src/app/product/[slug]/not-found.tsx 2>/dev/null && echo "not-found.tsx STILL EXISTS" || echo "not-found.tsx deleted (good)"

# Six commits (staging only task files; never git add -A)
git add rollout/next.config.ts
git commit -m "ROLL-13 T1: add cdn.sanity.io to next/image remotePatterns"

git add rollout/src/app/product/[slug]/not-found.tsx
git commit -m "ROLL-13 T2: delete custom product 404 page"

git add rollout/src/app/product/[slug]/page.tsx
git commit -m "ROLL-13 T3: rewrite product page server component"

git add rollout/src/app/product/[slug]/ProductDetailsClient.tsx
git commit -m "ROLL-13 T4: rewrite product client component"

git add developer-workspace/ROLL-13/
git commit -m "ROLL-13 T5: verify and report"
```

`git add -f` may be needed if `developer-workspace/` is gitignored; confirm before using.

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `next/image` `fill` without `sizes` causes layout shift | Medium | Add `sizes` prop as specified. |
| `getClientIp` returns null → `getVisitorHash` needs string | Low | Skip recording silently (decision Q9). |
| Missing `ANALYTICS_HASH_SALT` breaks page | High | Catch the error, skip recording, page still renders (decision Q11). |
| `getProductBySlug` already filters `status='published'` — explicit check may be redundant | Low | Add explicit check anyway (decision Q7), defense in depth. |
| `searchParams` is a Promise in Next.js 16 | Medium | Await `searchParams` before reading `.get('source')`. |

## Not yet decided (owner input needed)

- Commit strategy: ROLL-12 used six per-task commits with owner direction. Follow same for ROLL-13?
- Where to store plan/report: `developer-workspace/ROLL-13/` (same as ROLL-12)?

## Out of scope

`/go/:id` redirect route, click recording, affiliate tag/store config, admin auth, price changes, Sentry, Vitest suite, any commit or push without owner approval.
