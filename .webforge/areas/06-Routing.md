# Area 06 — Routing & Navigation

## Status
✅ Decided

## Decisions Made
- **Framework**: Next.js App Router (file-based routing)
- **Routes defined**:
  - `/` — Homepage
  - `/[slug]` — Catch-all (resolves to product or category via `resolveRoute.ts`)
  - `/cart` — Shopping cart
  - `/checkout` — Checkout (placeholder)
  - `/login` — Sign in
  - `/register` — Create account
  - `/forgot-password` — Password reset
  - `/account` — User account
  - `/orders` — Order history (placeholder)
  - `/search` — Product search
  - `/cookies` — Cookie policy (placeholder)
  - `/privacy-policy` — Privacy policy
  - `/terms` — Terms of service
  - `/returns` — Returns policy
  - `/admin/*` — Admin panel (protected)
- **Mega menu**: Yes (4 levels: Group → Category → Subcategory → Items), dynamically loaded from Sanity
- **Mobile navigation**: Drawer pattern
- **Protected routes**: Admin routes require auth + admin role
- **404 handling**: `not-found.tsx` at root + `notFound()` in catch-all
- **Error pages**: Segment-level error boundaries (root, admin, product/category, cart, checkout, search, account)

*Source: architecture.md lines 153-183, architecture.md lines 262-268*

## Next Steps
- None — routing architecture is fully implemented

## References
- `architecture.md` lines 153-183 — Full route map
- `src/lib/resolveRoute.ts` — Route resolution logic
- `app/[...slug]/page.tsx` — Catch-all route implementation
