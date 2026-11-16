# Key Findings — Athletica Intelligence Scan

> Compiled by Athena (Intelligence Dept) on 2026-07-12
> Source: Full codebase scan + `athletica-audit.md` + `issues/` + `plan/` + `INVENTORY.md`

---

## What's Already Built & Working

### Core E-Commerce
- ✅ **Homepage** — HeroCarousel (auto-advancing, 3 banners) + 28 homepage sections (category carousels, product carousels, category section panels)
- ✅ **Category pages** — FilterSidebar (brand, model line, surface, size, color, price range), SortDropdown, Pagination, ActiveFilters, ProductGrid
- ✅ **Product detail pages** — ImageGallery (zoom on hover), ProductInfo (sizes, colors, add to cart, Amazon buy link), ProductDescription (key benefits, tech details table), related product carousels (by model, brand, traction)
- ✅ **Cart** — Cart page (`/cart`), MiniCart (slide-in drawer), cookie-based persistence (30 days), quantity controls, order summary
- ✅ **Auth** — Login/Register pages, Supabase Auth (email/password), forgot password, session management, admin/customer roles
- ✅ **Search** — Search page (`/search`) with results

### Admin Panel
- ✅ **Dashboard** — Stats counts, quick actions, preview hub
- ✅ **Homepage Editor** — Recently redesigned with DnD (dnd-kit), EditPopup, Overview grid, 9 variant-specific category grid forms, variant-specific architecture for all section types, lazy preview loading, section screenshot capture
- ✅ **Product CRUD** — Create/edit/delete products with image upload, gallery, sizes, prices, descriptions
- ✅ **Brands Manager** — CRUD for brands with logo upload
- ✅ **Navigation Editor** — Tree-based navigation editing
- ✅ **Media Library** — Image upload and management
- ✅ **Amazon Links Editor** — Manage affiliate links per product
- ✅ **Batch Upload** — CSV-based product import with parsing
- ✅ **Site Settings** — Logo, brand, footer, social, copyright
- ✅ **Admin auth** — Protected admin routes with cookie-based session check
- ✅ **Build Status** — Vercel deployment status display

### Infrastructure
- ✅ **Sentry** — Error tracking on client + server + edge (10% traces, 10% session replays, 100% on error)
- ✅ **Rate limiting** — Upstash Redis (auth: 5/60s, upload: 10/60s)
- ✅ **CSRF protection** — Origin/referer allowlist check
- ✅ **Sanity webhook** — HMAC-SHA256 signature verification
- ✅ **Validation discipline** — Zod schemas + `validateOrFail()` on all server actions
- ✅ **Consistent API pattern** — `ApiResult<T>` with `ok()` / `fail()` / `fromCaughtError()`
- ✅ **Material 3 design tokens** — Consistent color system via Tailwind v4 custom theme

### Testing
- ✅ **17 unit/integration tests** — Filter logic, route resolution, nav URL rebuild, schema validation, LoginForm, MiniCart, ToastContainer, form components
- ✅ **14 Playwright e2e specs** — Auth flow, cart flow, category filters, product detail, homepage editor (legacy + redesigned), product form, admin, batch upload, API contract, visual regression tests (3 specs with snapshots)
- ✅ **MSW** — Mock service worker for Sanity + Supabase in tests
- ✅ **Coverage thresholds** — 80% lines, 70% branches, 80% functions, 80% statements

---

## What's In Progress

### From `plan/variant-specific-forms.md`
- **Product Carousel variant-specific forms** — Adding variant architecture (`filtered-feed` variant) to match CategoryGridForm pattern
- **Category Carousel variant-specific forms** — Adding variant architecture (`curated-cards` variant)
- **Sanity schema deploy needed** — `variant` and `snapshot` fields missing from deployed schema for `product_carousel` and `category_carousel` types; entire `category_carousel` type missing from sections array in deployed schema

### Steps Documented:
1. Define variant rules in types.ts ✅ (per plan)
2. Create variant-aware ProductCarouselForm (filtered-feed sub-component)
3. Create variant-aware CategoryCarouselForm (curated-cards sub-component)
4. Wire variant defaults in HomepageEditor
5. Ensure variant is written in sectionToRaw
6. Deploy Sanity schema via `npx sanity schema deploy`
7. Verify end-to-end

---

## What's Broken or Needs Attention

### Known Issues (from `issues/`)

| # | Issue | Severity | Status (per audit) |
|---|---|---|---|
| 1 | AutoSuggest links produce broken URLs (`[object Object]`) | High | **Confirmed open** |
| 2 | Weak key generation (Date.now + Math.random collision risk) | Medium | Should be fixed with `randomUUID()` in new code |
| 3 | Save All skips key checks | Medium | **Open** |
| 4 | Duplicate url_slug in preview query (wasteful) | Low | **Open** |
| 5 | Accent field exists but no input UI | Low | **Open** |
| 6 | No focused editing — all forms visible at once | Medium | Design issue |
| 7 | All 9 category grid variants show identical forms | Medium | Design issue |
| 8 | Preview too small (60% scale) | Low | Design issue |
| 9 | No condensed overview mode | Low | Design issue |
| 10 | Reorder buttons have no visual feedback | Low | Design issue |
| 11 | **Page takes >60s to load** | 🔴 Critical | **Should be fixed** by memoized `sanityCdnUrl` + lazy preview |
| 12 | Duplicate thumbnail section in product form | Medium | **May be fixed** (from issue #1 in product-form/) |

### Security / Legal Gaps (from audit)

| Gap | Severity | Notes |
|---|---|---|
| ❌ **No payment integration** | 🔴 Critical | Checkout says "demo, no real payment" |
| ❌ **No order management** | 🔴 Critical | No orders table, no admin orders panel, no order history |
| ❌ **No inventory tracking** | 🟠 High | `sizes[].stock` exists but never decremented |
| ❌ **No shipping calculation** | 🟠 High | Address collected but no shipping zones/cost |
| ❌ **No cookie consent banner** | 🟠 High | GDPR/NDPR risk |
| ❌ **No SEO infrastructure** | 🔴 Critical | No robots.txt, sitemap.xml, JSON-LD, OG tags, canonical URLs |
| ❌ **No CI workflow for tests** | 🟠 High | Tests don't run on PR/commit |
| ❌ **No analytics** | 🟡 Medium | Zero visibility into user behavior |
| ❌ **No .env.example** | 🟠 High | New devs can't bootstrap |
| ❌ **No staging environment** | 🟡 Medium | Only prod + local dev |

---

## Architecture Patterns & Conventions

### Server Actions Pattern
All mutations use `"use server"` directives in `src/lib/actions/`:
1. Accept `FormData` or structured input
2. Validate with Zod via `validateOrFail()`
3. Transform to Sanity/Supabase document shape
4. Write to data store
5. Call `revalidatePath()` for cache busting
6. Return `ApiResult<T>` with `ok()` or `fail()`

### Error Handling Pattern
```typescript
// Consistent return type across all server functions
type ApiResult<T> = 
  | { data: T; error: null }    // Success
  | { data: null; error: ApiError }  // Failure
```

### Component Conventions
- **Server components** by default (data fetching in `async` pages)
- **Client components** marked with `"use client"` for interactivity
- **Context providers** at root layout wrapping children
- **Zustand stores** for global client state (toast, wishlist)
- **react-hook-form** + **Zod** for form validation

### CSS Conventions
- Tailwind utility classes exclusively (no CSS modules, no styled-components)
- Material 3 design token names via `@theme` in `globals.css`:
  - `bg-surface`, `bg-surface-container`, `bg-surface-variant`
  - `text-on-surface`, `text-on-primary`, `text-on-surface-variant`
  - `border-outline`, `border-outline-variant`

### Naming Conventions
- Components: PascalCase (`HeroCarousel.tsx`, `FilterSidebar.tsx`)
- Routes: kebab-case (`[...slug]`, `forgot-password`, `privacy-policy`)
- Lib files: camelCase or kebab-case (`filterProducts.ts`, `getHomepageJson.ts`)
- Types: PascalCase interfaces (`Product`, `CartItem`, `NavItem`)
- Sanity schema: camelCase (`color_variants`, `key_benefits`, `technical_details`)
- Constants: UPPER_SNAKE_CASE

### Data Flow Convention
1. **Server component** fetches data from JSON files (via `cache()`)
2. Data passed as props to client components
3. Client components handle interactivity (filters, cart, auth)
4. Mutations go through server actions → Sanity → webhook → JSON sync → page revalidation

---

## Recommendations for Build Phase

### Immediate (fix before building more)
1. **Fix homepage editor bugs** (#1 autoSuggest links, #3 Save All key checks, #4 duplicate url_slug query)
2. **Complete variant-specific forms** (per plan/variant-specific-forms.md)
3. **Deploy Sanity schema** to sync `product_carousel` and `category_carousel` variant/snapshot fields
4. **Add `.env.example`** — quick win for developer onboarding

### High Priority (unblock real selling)
5. **Payment integration** (Paystack first for Nigeria, Stripe for international)
6. **Order management** — orders table, admin panel, customer order history
7. **Inventory tracking** — decrement stock on order, show out-of-state
8. **Shipping configuration** — zones, cost calculation

### Important (launch readiness)
9. **SEO infrastructure** — robots.txt, sitemap.xml, JSON-LD, OG tags, canonical URLs
10. **Cookie consent banner** — GDPR/NDPR compliance
11. **CI workflow** — run lint + test + build on every PR
12. **Analytics** — Vercel Analytics or Posthog (free tier available)

---

## File Size Audit (Law 2 Check)

| File | Lines | Status |
|---|---|---|
| `INVENTORY.md` | 1098 | ❌ Exceeds 300 |
| `issues/homepage-editor-bugs.md` | 102 | ✅ OK |
| `athletica-audit.md` | 800 | ❌ Exceeds 300 |
| `src/lib/actions/homepage.ts` | 413 | ❌ Exceeds 300 |
| `src/lib/getNavigation.ts` | 261 | ✅ OK |
| `src/lib/getHomepageJson.ts` | 304 | ❌ Exceeds 300 (marginal) |
| `src/components/admin/HomepageEditor.tsx` | Not checked | ❌ Likely exceeds 300 |
| `src/lib/resolveRoute.ts` | 158 | ✅ OK |

**Note**: Several files exceed the 300-line limit (Law 2). These should be refactored in the build phase.

---

## Summary Stats

| Metric | Value |
|---|---|
| Total app routes | 16 (including catch-all, admin sub-routes) |
| Database tables | 1 (profiles) — no orders, no order_items |
| Sanity document types | 8 (product, brand, homepage, navigation, navItem, navLink, amazonLinks, siteSettings) |
| JSON product files | ~28 |
| E2E tests | 14 specs |
| Unit/integration tests | 17 files |
| Known bugs (open) | ~8 (bugs #1-#10 minus those fixed per audit) |
| Critical gaps | ~10 (payment, orders, inventory, shipping, SEO, etc.) |
| Design tokens defined | ~40 colors in `@theme` block |
| NPM dependencies | 27 production + 22 dev |
