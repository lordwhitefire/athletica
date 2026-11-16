# ROLL-13 — Browser Check Report

## Runtime confirmation

Server confirmed up on `:3011` before any check. Attached to Chrome on CDP `:9222` (already running, attach-only, no launch). Confirmed Chrome is not headless (UA: `Mozilla/5.0 (X11; Linux x86_64) ... Chrome/149.0.0.0 ...`). Created **one tab** in that window; reused it on subsequent runs. Detached on exit — tab stays open for the human. No screenshots.

## Full extraction results

Saved to `developer-workspace/scripts/ROLL-13/runs/missing-product/surface-probe.json` and `developer-workspace/scripts/ROLL-13/runs/published-product/surface-probe.txt`.

### State: missing product (`/product/does-not-exist`)

| Fact | Value |
|------|-------|
| URL | `http://127.0.0.1:3011/product/does-not-exist` |
| ReadyState | `complete` |
| 404 via `notFound()` | Yes |
| Product-specific copy in 404 | None |
| `not-found.tsx` | Deleted — default Next.js 404 used |
| Console errors | Only Next.js HMR WebSocket failures (expected, not application errors) |

### State: published product (`/product/TS-1001`)

Returns 404 because `TS-1001` is a product `id`, not a `slug`; `getProductBySlug` filters by `slug` AND `status: 'published'`. No published product slugs are available in the database to test the happy path.

## What was NOT checked

- Published product page happy path (no published product in database)
- Interactive behaviour beyond navigation (clicks, form submits) — not driven
- ROLL-13-specific analytics behaviour at runtime (source normalization, visitor hashing, bot detection, rate limiting) — server-side only, verified by static inspection and `tsc`
- `next/image` fill/lazy/alt rendering in the browser — static-verified only
- CTA disabled state in the browser — static-verified only
- Amazon Associates disclosure visibility — static-verified only
- Anything outside the layer's surface

## Conclusion

Runtime check: **404 path verified** for missing products — plain, no product-specific copy. Published-product happy path could not be exercised because no published product slugs exist in the database. ROLL-13's server-side code changes are verified by `tsc` (exit 0) and static inspection. Nothing is silently assumed.
