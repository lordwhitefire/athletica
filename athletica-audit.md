# Athletica — Web Development Areas Audit

**Repo audited:** `lordwhitefire/athletica` @ commit `2f4ec35` (2026-07-06)
**Live URL:** `https://athletica-blond.vercel.app/`
**Reference framework:** `web-development-areas.md` (82 areas across 5 sections)
**Auditor method:** Read the codebase against every section of the reference doc, marking each area as ✅ Done / 🟡 Partial / ❌ Missing / ⏭️ Skip (not applicable).

---

## TL;DR — Top 12 gaps, ranked by impact

| # | Gap | Severity | Effort |
|---|---|---|---|
| 1 | **No payment integration** — checkout says "demo, no real payment" | 🔴 Critical | M |
| 2 | **No order management** — orders page is a placeholder, no admin orders panel | 🔴 Critical | M |
| 3 | **No SEO infrastructure** — no `robots.txt`, no `sitemap.xml`, no `llms.txt`, no schema.org JSON-LD | 🔴 Critical | S |
| 4 | **No `.env.example`** — new devs can't bootstrap the project without reading `env.ts` | 🟠 High | S |
| 5 | **No CI workflow** for tests/build/lint — only a Sanity→JSON sync workflow exists | 🟠 High | S |
| 6 | **No cookie consent banner** — `cookies` page is a placeholder; NDPR/GDPR risk | 🟠 High | S |
| 7 | **No inventory tracking** — `sizes[].stock` exists in schema but never decremented | 🟠 High | M |
| 8 | **No shipping calculation** — checkout collects address but no shipping zones/cost | 🟠 High | M |
| 9 | **No discount/promo code system** | 🟡 Medium | S |
| 10 | **No email/SMS transactional notifications** — order confirmations, shipping updates, password reset emails beyond Supabase default | 🟡 Medium | M |
| 11 | **No product reviews or testimonials** | 🟡 Medium | M |
| 12 | **No analytics** (GA4 / Posthog / Vercel Analytics) | 🟡 Medium | S |

These are the gaps a paying customer or a real launch would expose within a week. Everything else below is detail.

---

## What's working well (don't break these)

The project has solid foundations on the "build quality" side. Worth preserving:

- **Stack**: Next.js 16.1.6 (App Router) + TypeScript strict mode + Tailwind 4 + Supabase + Sanity CMS + Zod + react-hook-form + Zustand. Modern, well-chosen.
- **Homepage editor redesign** (just landed): `Overview.tsx`, `EditPopup.tsx`, `@dnd-kit/core` DnD, 9 variant-specific item forms, lazy `getPreviewProducts`, memoized `sanityCdnUrl`, `loading.tsx` skeleton. This is genuinely well-engineered.
- **Auth**: Supabase Auth with rate limiting on login (Upstash sliding window, 5/60s), server-side cookie sessions, service-role key isolated to `admin.ts`, RLS policies in `seed.sql` for `profiles`.
- **Validation discipline**: Every server action uses `validateOrFail(schema, input)` with Zod. Consistent.
- **API contract**: `ApiResult<T>` pattern with `ok` / `fail` / `fromCaughtError` — uniform error shape across all server actions.
- **Sanity webhook** has HMAC-SHA256 signature verification with `timingSafeEqual`. Proper.
- **Sentry** is wired (client + server + edge configs) for error tracking with session replays.
- **Rate limiting** on auth + media uploads. Redis-backed.
- **CSRF / origin allowlist** for API routes.
- **Tests**: 18 unit/integration tests + 14 Playwright e2e specs. Not exhaustive, but real coverage exists.
- **Skip-to-content link** in `<layout>` — basic a11y hygiene is there.
- **In-house admin tooling**: dashboard, brands manager, navigation editor, media uploader, batch upload (CSV parser), amazon-links manager, homepage editor, site settings. The admin is actually pretty complete for *content* management.

---

## Section A — All Projects (areas 01-33)

### 01. Project Setup — 🟡 Partial

| Question | Status | Notes |
|---|---|---|
| Project name | ✅ | "Athletica" / `frontend` in package.json |
| Client | ❓ | Not documented anywhere in repo |
| Deadline / budget | ❓ | Not in repo (expected) |
| Target audience | 🟡 | Implied international (default currency £, brand mix global) but not documented |
| Currency | 🟡 | Default `£` in `mapRawToProduct`, but no multi-currency support |
| Domain | ✅ | `athletica-blond.vercel.app` (Vercel preview domain) — no custom domain in repo |
| Hosting | ✅ | Vercel (implied by deployment) |
| Environment separation | ❌ | No staging environment visible. Only prod + local dev. |

### 02. Stack Decisions — ✅ Done

All in `package.json`. Solid choices. See "What's working well" above.

### 03. Design System — 🟡 Partial

- **Color tokens**: ✅ Material 3-style tokens (`bg-surface`, `text-on-surface`, `bg-primary-container` etc.) used consistently. Tailwind 4 config extends them.
- **Typography**: 🟡 Geist Sans/Mono via `next/font` (per `INVENTORY.md`), but no documented font scale or weight convention.
- **Spacing scale**: ❌ Not documented. Tailwind defaults assumed.
- **Border radius / shadow conventions**: ❌ Not documented. Used ad-hoc.
- **Dark mode**: 🟡 Site is dark-mode-by-default (black background). No light mode toggle. Not the same as a dark mode feature.
- **Design reference**: ❌ No Figma link or design doc in repo.

### 04. Brand & Identity — 🟡 Partial

- **Logo**: ✅ Stored in Sanity (`getSiteLogoUrl()`), editable via admin settings.
- **Brand colors / fonts**: 🟡 Implicit from Tailwind theme; no documented brand guidelines.
- **Brand voice**: ❌ Not documented.
- **Brand guidelines doc**: ❌ Missing.

### 05. Frontend Architecture — 🟡 Partial

- **Folder structure**: ✅ Clear convention (`app/`, `components/`, `lib/`, `store/`, `types/`, `context/`).
- **Component / file naming**: ✅ PascalCase for components, kebab-case for routes — consistent.
- **Server vs client components**: 🟡 Mix is OK but not always labeled. Some files are missing `"use client"` until they fail to compile. No documented strategy.
- **Data fetching**: 🟡 Mostly server-side (good), but `HomepageEditor` and other admin components fetch on the client.
- **Code splitting**: ❌ No explicit strategy. Next.js default only.
- **Bundle size budget**: ❌ Not set in `next.config.ts`. Bundle analyzer is installed but not configured to fail CI.

### 06. Routing & Navigation — 🟡 Partial

- **Pages**: ✅ Comprehensive — homepage, cart, checkout, account, orders, login/register/forgot-password, search, returns, cookies, privacy-policy, terms, plus `/[...slug]` catch-all for category/product pages.
- **Mega menu**: 🟡 Header renders navigation from Sanity. Not clear from code if multi-level. The `NAVIGATION_TREE.txt` (~50 KB!) suggests a deep tree but the implementation is single-level from what's visible.
- **Mobile navigation**: ✅ Drawer pattern (`Header` component).
- **Protected routes**: 🟡 Admin routes are protected (via `admin-auth.ts` cookie check). User routes (`/account`, `/orders`) rely on Supabase session but no explicit middleware guard.
- **404 / error pages**: ✅ `not-found.tsx` exists at root; `error.tsx` exists at root + admin + several sections.
- **Redirect rules**: ❌ None in `next.config.ts`. No `redirects()` export.

### 07. SEO & Discoverability — ❌ Major gap

This is one of the biggest holes. Currently:

- **robots.txt**: ❌ Missing (no `public/robots.txt`, no `src/app/robots.ts`).
- **sitemap.xml**: ❌ Missing (no `src/app/sitemap.ts`).
- **llms.txt**: ❌ Missing.
- **schema.org JSON-LD**: ❌ Zero structured data anywhere. No `Product`, `BreadcrumbList`, `Organization`, `WebSite`, `Offer`, `AggregateRating` markup.
- **Meta tags**: 🟡 `metadata` exported on ~13 pages. Default title template is fine. But:
  - **Open Graph tags**: ❌ Not set anywhere. URL sharing on WhatsApp/Twitter/Slack will show no preview image.
  - **Twitter card tags**: ❌ Not set.
  - **Canonical URLs**: ❌ Not set.
- **`/search` page**: exists but no `noindex` directive — search results pages will pollute Google index.

**This alone is blocking real SEO traffic.** For a football store competing on terms like "adidas predator boots", this is a critical gap.

### 08. Performance — 🟡 Partial

- **Core Web Vitals**: ❌ No targets set, no monitoring beyond Sentry traces.
- **Image optimization**: ✅ `next/image` used everywhere. `cdn.sanity.io` + `media.futbolmania.com` whitelisted in `next.config.ts`.
- **Lazy loading**: 🟡 `next/image` defaults; no explicit `loading="lazy"` strategy on below-the-fold content.
- **Font loading**: ✅ `next/font` (Geist) with automatic optimization.
- **Third-party scripts**: 🟡 No third-party scripts (Sentry only) — but no `next/script` strategy documented.
- **Caching**: 🟡 Sanity client uses CDN (`useCdn: true`). No Next.js `revalidate` tags visible on fetches. `revalidatePath` is called after admin edits.
- **Bundle analyzer**: ✅ Installed (`@next/bundle-analyzer`) but only runs when `ANALYZE=true`.
- **Target Lighthouse score**: ❌ Not defined.

The homepage editor bug #11 fix (PR #4) is the recent win here — the 60s cold load is gone.

### 81. Load & Stress Testing — ❌ Missing

- ❌ No `k6` / `Artillery` / `Locust` config in repo.
- ❌ No load tests in `e2e/`.
- ❌ No documented expected concurrent user count.
- ❌ No stress-test plan.

### 09. Responsive & Cross-Device — 🟡 Partial

- **Breakpoints**: 🟡 Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Not documented.
- **Mobile-first**: 🟡 Yes for new components (`grid-cols-1 md:grid-cols-2`), but some legacy code is desktop-first.
- **Devices tested**: ❓ Not documented. Playwright runs Chromium only (per `playwright.config.ts`).
- **Touch interactions**: 🟡 @dnd-kit PointerSensor handles touch. Mobile nav drawer exists. Carousel arrows are tappable.

### 10. Cross-Browser Compatibility — 🟡 Partial

- **Browsers**: ❓ Not documented. Playwright tests Chromium only.
- **Safari iOS**: ❓ No known issues documented, but no Safari testing in CI.
- **Testing**: ❌ No BrowserStack or cross-browser CI.

### 11. Accessibility (a11y) — 🟡 Partial

- **ARIA labels**: 🟡 ~32 `aria-label` usages in `src/components/`. Mostly on icon buttons. Not exhaustive.
- **Keyboard nav**: 🟡 Skip-to-content link exists. @dnd-kit KeyboardSensor is wired (good!). Forms use native inputs. But: the HeroCarousel auto-switches every 10s with no pause control — that's a WCAG 2.2.2 violation.
- **Color contrast**: ❓ Not tested. `jest-axe` is in devDeps but no a11y test file references it.
- **Screen reader testing**: ❌ Not documented.
- **Focus management**: 🟡 Skip link works. Modals (`EditPopup`) trap ESC but don't trap focus inside the dialog (focus can tab out).
- **Legally required**: 🟡 UK Equality Act / EU EAA applies if selling to those markets. Nigeria Discrimination Act less strict.

### 12. Assets & Media — 🟡 Partial

- **Image storage**: ✅ Sanity CDN (`cdn.sanity.io`). Admin media uploader exists.
- **Who provides images**: 🟡 `public/image-prompts.md` has 80+ Midjourney prompts for product images — suggests AI-generated. No documented workflow.
- **Image naming convention**: ❌ Files in `public/` are mixed (`ADIDASLOGO.jpg`, `nike.jpg`, `PUMAFUTURE.jpg`).
- **Video hosting**: ❌ No videos anywhere.
- **Icon library**: ✅ Material Symbols (Google) + `lucide-react`.
- **Max file size**: ❌ Not enforced in `media/upload/route.ts` (no multipart size limit visible).

### 13. Error Handling — ✅ Mostly done

- **Error boundaries**: ✅ `error.tsx` at root, admin, `[...slug]`, `account`, `cart`, `checkout`, `search`.
- **API error shape**: ✅ Consistent `{ type, code, message, fields? }` via `ApiResult`.
- **User-facing errors**: ✅ Toasts (`ToastContext`) + inline form errors.
- **Logging**: ✅ Sentry (client+server+edge) + custom `logger.ts`.
- **Supabase / third-party down**: 🟡 Errors propagate to user via `fromCaughtError`. No graceful degradation (e.g., cached fallback if Sanity is down).

### 14. Environment & Configuration — 🟡 Partial

- **`.env.example`**: ❌ **MISSING.** This is a real pain point. `src/lib/env.ts` documents required vars via Zod, but new devs must read source to figure out what to set. Fix this first — it's a 10-minute job.
- **Variable separation**: 🟡 Only `NODE_ENV` distinguishes dev/prod. No staging env. No feature flags system.
- **Production secret access**: ❓ Unknown — depends on Vercel project setup.
- **Key rotation plan**: ❌ Not documented.
- **Feature flags**: ❌ No system. Toggle by commenting out code or env-checking.

### 15. Version Control Conventions — 🟡 Partial

- **Branch naming**: ❌ Not documented (the `feat/homepage-editor-redesign` branch I pushed follows Conventional Commits but that's me, not a project rule).
- **Commit message format**: 🟡 Recent commits use conventional commits (`feat:`, `fix:`, `docs:`, `sync:`). Not enforced.
- **PR process**: ❓ Not documented.
- **Release tags**: ❌ None. No `v0.1.0` tag.
- **Main branch protection**: ❓ Unknown — can't see from clone. **Check this in GitHub settings.**

### 16. Development Workflow — 🟡 Partial

- **Linting**: ✅ ESLint with `eslint-config-next`.
- **Formatting**: ❌ No Prettier config in repo. Code style is inconsistent in places.
- **Pre-commit hooks**: ❌ No Husky, no lint-staged. Nothing runs before commit.
- **TypeScript strict**: ✅ `"strict": true` in `tsconfig.json`.
- **Code review**: ❓ Unknown — depends on team process.

### 17. Testing — 🟡 Partial

- **Unit tests**: ✅ 9 unit tests (Vitest). Filter logic, route resolution, nav URL rebuild, schema validation,LoginForm, MiniCart, ToastContainer, Input/Select/Textarea/SubmitButton.
- **Integration tests**: ✅ 3 integration tests (admin-auth, products, batch-upload).
- **E2E tests**: ✅ 14 Playwright specs — admin, auth, batch-upload, cart-flow, category-filters, homepage-editor (old + redesigned), product-detail, product-form, api-contract, plus visual regression specs.
- **Component tests**: 🟡 React Testing Library + jest-axe installed but only used on a few components.
- **CI runs tests**: ❌ **The CI workflow (`npm run ci` = `vitest run && playwright test`) is in package.json but NOT in `.github/workflows/`.** Only `sanity-json-update.yml` exists. **Tests don't run on PR.**
- **Coverage target**: ❌ Not set.

### 18. Deployment & DevOps — 🟡 Partial

- **CI/CD**: 🟡 Vercel auto-deploys on push to main (assumed). Sanity→JSON sync workflow exists. **No build/test/lint CI workflow**.
- **Preview deployments**: ❓ Vercel creates preview URLs per PR by default — should work if PRs are used.
- **Environment separation**: ❌ Only prod. No staging.
- **Rollback plan**: 🟡 Vercel keeps deployment history — manual rollback via dashboard. No documented procedure.
- **Build time targets**: ❌ Not set.

### 19. Monitoring & Observability — 🟡 Partial

- **Uptime monitoring**: ❌ No external uptime monitor (Better Uptime / UptimeRobot).
- **Error tracking**: ✅ Sentry (client + server + edge). Sample rate 10% traces, 10% session replays, 100% replays on errors.
- **Performance monitoring**: 🟡 Sentry traces sample 10%. No Vercel Analytics / Speed Insights.
- **User analytics**: ❌ **No GA4, no Posthog, no Vercel Analytics.** You're flying blind on user behavior.
- **Alerts**: ❓ Sentry default alerts only.

### 20. Legal & Compliance — ❌ Major gap

- **Privacy policy page**: ✅ Exists (`/privacy-policy`) — but content not checked.
- **Terms of service**: ✅ Exists (`/terms`).
- **Cookie consent banner**: ❌ **MISSING.** The `/cookies` page is a placeholder. EU/UK users require a banner before non-essential cookies. NDPR (Nigeria) also requires consent.
- **GDPR**: ❌ No documented data subject access request (DSAR) process. No data retention policy.
- **NDPR (Nigeria)**: ❌ No DPO contact listed. No explicit consent mechanism. 72-hour breach notification process undocumented.
- **Age restrictions**: ❌ None.
- **Cookie list**: ❌ No documented list of cookies set (`athletica_cart`, Supabase auth tokens, wishlist).

### 82. NDPR Compliance — ❌ Missing

The reference doc calls this out as a separate section because the project targets Nigeria (per the project notes). Currently:

- ❌ No DPO named
- ❌ No explicit consent flow for data collection
- ❌ No breach notification procedure
- ❌ No data localization decision
- ❌ No privacy notice meeting NDPR §2.1 requirements

If the business operates in Nigeria or processes Nigerian citizens' data, this is a legal exposure.

### 21. Documentation — 🟡 Partial

- **README**: ❌ Default Next.js `create-next-app` README. Useless. Replace with a real project README.
- **Changelog**: ❌ None.
- **Inline comments**: 🟡 Good in recently-touched files (homepage editor fixes have explanatory comments). Sparse elsewhere.
- **API documentation**: ❌ No OpenAPI / Swagger. Server actions are typed but not externally documented.
- **Onboarding doc**: ❌ None. New dev must read `INVENTORY.md` (43 KB!) to understand the project.

`INVENTORY.md` is genuinely useful as a structural map — but it's not a substitute for a README.

### 22. Naming Conventions — ✅ Mostly done

- **Components**: ✅ PascalCase.
- **Files**: 🟡 Mixed — PascalCase for components, kebab-case for routes, snake_case in `src/lib/schemas/*`. Inconsistent but readable.
- **CSS class names**: ✅ Tailwind utility classes + Material 3 design tokens.
- **Supabase tables**: ✅ snake_case (`profiles`).
- **Variables / functions**: ✅ camelCase.
- **Constants**: ✅ UPPER_SNAKE_CASE (`VARIANT_OPTIONS`, `MIN_CARDS`).

### 23. Animation & Interactions — ✅ Done

- **Framer Motion**: ✅ Used in HeroCarousel, CategoryCarousel, ProductCarousel.
- **Page transitions**: ✅ `PageTransition` component wraps `<main>`.
- **Micro-interactions**: 🟡 Hover states via Tailwind classes. No dedicated micro-interaction system.
- **Loading states**: ✅ Skeletons in `loading.tsx`, spinners in forms.
- **Reduced motion support**: ❌ No `@media (prefers-reduced-motion)` handling. HeroCarousel auto-advances regardless of user preference.

### 24. Notifications & Feedback — 🟡 Partial

- **Toast messages**: ✅ Custom `ToastContext` + `ToastContainer`. Position: bottom-right (assumed from code).
- **Modal/dialog pattern**: ✅ `EditPopup` is the reusable modal. Other modals (Add Section dialog) are inline.
- **Confirmation dialogs**: 🟡 Uses `confirm()` (browser native) for deletes — ugly, not stylable, blocks JS. Replace with custom dialog.
- **Loading indicators**: ✅ Skeletons + spinners.
- **Empty states**: ✅ Cart empty state exists. Search empty state exists. Not universal.
- **Success states**: ✅ "Saved!" toast in admin.

### 25. Forms & Validation — ✅ Done

- **Library**: ✅ React Hook Form + Zod (`@hookform/resolvers`).
- **Errors displayed**: ✅ Inline below fields.
- **File upload**: ✅ ImageSelector + media upload API route.
- **Multi-step forms**: ❌ None. Checkout is single-step.
- **Auto-save**: ❌ None. Homepage editor has manual Save All only.

### 26. Internationalization (i18n) — ❌ Missing

- **Multiple languages**: ❌ English only. Hardcoded strings throughout.
- **RTL support**: ❌ None.
- **Date/currency format per locale**: ❌ Hardcoded `£` currency symbol in `mapRawToProduct`. No `Intl.NumberFormat` usage.
- **Architecture flexibility**: 🟡 Could add later — strings are mostly in JSX, easy to extract.

### 27. Offline & PWA — ❌ Missing

- **Offline support**: ❌ None.
- **Install to homescreen**: ❌ No `manifest.json`.
- **Service workers**: ❌ None.
- **Background sync**: ❌ None.

For Nigerian context (power outages, poor connectivity) the reference doc flags this as important. Worth considering for cart persistence at minimum — currently cart is in a cookie, which works, but a service worker would let users browse offline.

### 28. Cookie & Session Management — 🟡 Partial

- **Session duration**: ❓ Supabase default (no custom config visible).
- **Remember me**: ❌ No toggle on login form.
- **Secure / httpOnly**: ✅ Supabase SSR client sets httpOnly cookies.
- **Session expiry mid-task**: ❌ No handling. Cart contents in cookie survive, but checkout would fail mid-flow.
- **Multi-device**: ❌ Cart is per-device (cookie). Wishlist is per-device (localStorage via Zustand persist). No sync.

### 29. Redirect & URL Management — 🟡 Partial

- **301/302 redirects**: ❌ No `redirects()` in `next.config.ts`. No `_redirects` file.
- **Trailing slash**: 🟡 Next.js default (no trailing slash). Not enforced.
- **URL structure**: ✅ Kebab-case (`/adidas-predator-league-ft-fg-mg-red`).
- **Old URLs after restructuring**: ❌ No redirect map.
- **Canonical URLs**: ❌ Not set in metadata.

### 30. Code Splitting & Bundle Size — 🟡 Partial

- **Lazy routes**: ❌ No `next/dynamic` usage for route-level code splitting. App Router handles this by default per-route.
- **Bundle analyzer**: ✅ Installed (`@next/bundle-analyzer`). Run with `ANALYZE=true npm run build`.
- **Third-party weight audit**: ❌ Not done. `framer-motion` is heavy.
- **Tree shaking**: 🟡 Next.js default.

### 31. Backup & Recovery — ❌ Missing

- **Database backup**: ❓ Supabase automatic daily backups (managed service). Not documented.
- **Rollback migration**: ❌ No migration system. `supabase/seed.sql` is the only schema file. No `supabase/migrations/` directory.
- **Disaster recovery plan**: ❌ None documented.
- **Backup responsibility**: ❓ Victor (owner) assumed.

### 32-33. Client Communication / Handoff — N/A

Skipped — these are process questions outside the codebase.

---

## Section B — E-Commerce Specific (areas 34-42)

### 34. Payment Integration — ❌ CRITICAL GAP

This is the #1 blocker for being a real store.

**What exists:**
- Checkout form collects: full name, email, address, city, postal code, country, phone (`src/lib/schemas/checkout.ts`).
- The checkout page renders a "Payment" section with text: **"Payment integration coming soon. Your card will not be charged yet."** and **"This is a demo — no real payment will be processed."** (`src/app/checkout/CheckoutForm.tsx:97-101`).

**What's missing:**
- ❌ No Paystack integration (Nigeria's standard)
- ❌ No Stripe integration (international)
- ❌ No Flutterwave
- ❌ No webhook handlers for payment events
- ❌ No refund flow
- ❌ No failed payment handling
- ❌ No receipt/invoice generation
- ❌ No order confirmation email
- ❌ No test mode vs live mode toggle

**Recommended path:**
1. **Paystack first** — Nigerian customers expect it, and it handles card + USSD + bank transfer. Their Next.js SDK is straightforward.
2. **Add a `orders` table to Supabase** — currently doesn't exist.
3. **Webhook handler** at `/api/webhooks/paystack` to mark orders paid.
4. **Order confirmation email** via Resend.

### 35. Product Catalog — ✅ Mostly done

- **Products at launch**: ✅ Sanity contains real products ( Predator, Phantom, Mercurial etc.).
- **Categories / subcategories**: ✅ Deep navigation tree (`NAVIGATION_TREE.txt` is 50 KB).
- **Variants**: 🟡 `sizes[]` exists in schema with `available` boolean and `stock` number. No color/style variants — each color is a separate product.
- **Images**: ✅ Main image + thumbnail + gallery (`image_gallery`). 1 main + N gallery.
- **Descriptions**: ✅ Rich schema — subtitle, tagline, intro, collection, key_benefits[], technical_details{range, sole_type, upper_material, adjustment}.
- **Featured products logic**: ✅ Homepage editor controls featured carousels via filters.
- **Related products**: ❌ Not implemented. No "you may also like" section.

### 36. Inventory Management — ❌ Major gap

- **Auto-tracking**: ❌ The `sizes[].stock` field exists in `productSanitySchema` but **nothing decrements it on order**. No order placed → no stock change.
- **Out of stock behavior**: ❓ Not visible in code. ProductCard probably renders regardless.
- **Low stock alerts**: ❌ None.
- **Who updates inventory**: ❓ Manual via admin only.
- **Multi-platform selling**: ❌ Single channel.

This is **silent data drift waiting to happen** — once orders flow, stock counts will be wrong within hours.

### 37. Cart & Checkout — 🟡 Partial

- **Cart type**: ✅ Multi-product cart.
- **Guest checkout**: ✅ No account required to checkout.
- **Saved cart**: ✅ Cookie-based, 30-day expiry. Persists across sessions on same device.
- **Checkout steps**: 🟡 Single page. No multi-step wizard (shipping → payment → review).
- **Address autocomplete**: ❌ None. No Google Places integration.
- **Order summary page**: ❌ No order confirmation page after checkout. No order ID generated.

### 38. Shipping & Delivery — ❌ Major gap

- **Physical products**: ✅ Football gear, physical.
- **Shipping handler**: ❓ Unknown — depends on business side.
- **Shipping zones**: ❌ Not configured in code.
- **Shipping cost**: ❌ Not calculated. Checkout collects address but doesn't compute shipping.
- **Delivery time estimates**: ❌ Not shown.
- **Order tracking**: ❌ `/orders` page is a placeholder.

### 39. Discount & Promotions — ❌ Missing

- ❌ No promo code input on cart or checkout.
- ❌ No discount code schema in `src/lib/schemas/`.
- ❌ No admin UI to create/manage codes.
- ❌ No flash sale logic.
- ❌ No loyalty program.

The product schema has `discount_percent` and `member_price` fields — so per-product discounts work (e.g., "10% off this boot"). But cart-level promo codes don't exist.

### 40. Order Management — ❌ CRITICAL GAP

This is the #2 blocker (after payment).

**What exists:**
- ❌ No `orders` table in Supabase (only `profiles`).
- ❌ No order management admin panel.
- ❌ No order status enum (pending, confirmed, shipped, delivered, cancelled).
- ❌ No email/WhatsApp notification on order.
- ❌ `/orders` page is a placeholder.
- ❌ No order history for customers.
- ❌ No refund / cancellation flow.
- ❌ No returns processing.

**The entire post-purchase flow doesn't exist.** Even if payment was wired up tomorrow, there's no place for the order to land.

### 41. CMS Integration — ✅ Done

- **CMS**: ✅ Sanity.
- **Who updates content**: ✅ Admin panel (custom-built, comprehensive).
- **Editable content**: ✅ Products, brands, homepage (banners + sections), navigation, site settings (logo, footer, social links), media library, amazon-links.
- **Content preview**: 🟡 Homepage editor has live preview in popup (just shipped). Other editors (product form, navigation) don't.

### 42. Reviews & Testimonials — ❌ Missing

- ❌ No reviews on product pages.
- ❌ No star ratings.
- ❌ No moderation UI.
- ❌ No testimonials section on homepage.
- ❌ No verified-purchase badge system.

This is a meaningful conversion-rate gap for e-commerce. Most buyers check reviews before purchasing football boots at this price point.

---

## Section C — Web App Specific (areas 43-64)

### 43. Authentication & Authorization — 🟡 Partial

- **Auth provider**: ✅ Supabase Auth.
- **Login methods**: 🟡 Email/password only. **No Google, GitHub, magic link, or phone OTP.**
- **RBAC**: 🟡 Two roles via `profiles.role` (`customer`, `admin`). No moderator role. No fine-grained permissions.
- **Protected route strategy**: 🟡 Admin routes protected via `admin-auth.ts` cookie check. User routes (`/account`, `/orders`) unprotected at middleware level.
- **Session management**: ✅ Supabase SSR cookies.
- **Password reset**: ✅ `resetPasswordForEmail` in `/forgot-password`. Relies on Supabase's default email.
- **Email verification**: ❌ Not enforced. Signup doesn't require email confirmation (depends on Supabase project config).

### 44. User Management — 🟡 Partial

- **User profiles**: ✅ `profiles` table with `id, name, email, avatar_url, role, created_at, updated_at`.
- **Avatar upload**: ❌ `avatar_url` field exists but no upload UI in `/account`.
- **Account settings page**: 🟡 Page exists but content not inspected — likely minimal.
- **Account deletion**: ❌ No flow. NDPR/GDPR requires this.
- **Admin user management panel**: ❌ Admin can't see/manage users from the UI.
- **User search/filter (admin)**: ❌ None.

### 45. Onboarding Flow — ❌ Missing

- ❌ No first-time user experience.
- ❌ No guided tour.
- ❌ No welcome email.
- ❌ Empty states exist for cart and search but not for account/wishlist.

### 46. Dashboard & Data Visualization — 🟡 Partial

- **Charts**: 🟡 Admin dashboard has `DashboardStats` (counts) + `DashboardPreviewHub`. No actual charts (bar/line/pie).
- **Chart library**: ❌ None installed (no Recharts/Chart.js).
- **Date range filtering**: ❌ None.
- **Data export**: ❌ None.
- **Real-time**: ❌ None.
- **Pagination**: 🟡 Product list page has pagination. Admin tables — not inspected.

### 47. Real-time Features — ❌ Missing

- ❌ No Supabase Realtime usage.
- ❌ No websockets.
- ❌ No live order notifications for admin.
- ❌ No live inventory updates.

### 48. Notification System — ❌ Missing

- ❌ No in-app notification bell.
- ❌ No email notifications (no Resend/SendGrid integration).
- ❌ No SMS notifications (no Termii/Twilio).
- ❌ No push notifications.
- ❌ No notification preferences UI.

### 49. Multi-tenancy — ⏭️ Skip

Single-store, single-tenant. Not applicable.

### 50. File Management — 🟡 Partial

- **Upload**: ✅ Media uploader (`/admin/media`), product image upload, batch CSV upload.
- **Storage**: ✅ Sanity assets (via `cdn.sanity.io`).
- **Size limits**: ❌ Not enforced.
- **Type restrictions**: 🟡 Image MIME types only (assumed from `ImageSelector`).
- **Virus scanning**: ❌ None.
- **Deletion**: 🟡 Admin can delete media via the media manager.

### 51. Search & Filtering — ✅ Done

- **Global search**: ✅ `/search` page exists.
- **Per-table filtering**: ✅ Category page has FilterSidebar (brand, traction, price, size, gender).
- **Full-text search**: 🟡 Sanity's built-in GROQ `match` operator. No Algolia/Meilisearch.
- **Filter persistence**: ❓ Likely URL-based (good practice).
- **Sort options**: ✅ Sort dropdown (newest, price asc/desc, biggest discount).

### 52. Audit Logs & Activity History — ❌ Missing

- ❌ No `audit_logs` table.
- ❌ No "who edited what" tracking.
- ❌ No admin activity feed.

### 53. Import & Export — 🟡 Partial

- **Import**: ✅ Batch CSV upload for products (`/admin/products/batch-upload`).
- **Export**: ❌ None. Can't export products, orders, or users to CSV.
- **Bulk operations**: 🟡 Batch upload is the only bulk op.
- **Data portability**: ❌ Users can't download their own data (NDPR/GDPR requirement).

### 54. Subscription & Feature Gating — ⏭️ Skip

No subscription tiers. Not applicable for now. Note: `member_price` field exists on products — could imply a membership tier in the future.

### 55. Settings & Configuration — 🟡 Partial

- **User-level settings**: ❌ None beyond what's in `profiles`.
- **App-wide settings**: ✅ Site settings admin page (logo, brand, footer, social, copyright).
- **Feature flags**: ❌ None.
- **Settings persistence**: ✅ Sanity for site settings, Supabase for user data, **localStorage for wishlist** (this violates the reference doc's "never localStorage" rule).

### 56. Admin Panel — ✅ Done

- **Separation**: ✅ `/admin/*` routes, separate `AdminLayout` + `AdminShell`.
- **Access**: ✅ Role check via Supabase `profiles.role = 'admin'`.
- **Capabilities**: ✅ Products, brands, homepage, navigation, media, settings, amazon-links, batch-upload, dashboard.
- **Missing**: ❌ Orders, users, reviews, audit logs.

### 57. API Design — 🟡 Partial

- **REST vs GraphQL**: 🟡 Internal API routes only (no public API).
- **Versioning**: ❌ No `/api/v1/` prefix.
- **Auth**: 🟡 Session cookie for admin. No bearer-token API for external consumers.
- **Rate limiting**: 🟡 On auth + upload only. Not on all API routes.
- **Documentation**: ❌ No Swagger/OpenAPI.
- **Mobile app readiness**: ❌ No public API contract.

### 58. Background Jobs & Queues — ❌ Missing

- ❌ No Inngest / Bull / Supabase Edge Functions.
- ❌ No background email queue.
- ❌ No image processing pipeline.
- ❌ No retry logic on failed jobs.

### 59. Soft Delete vs Hard Delete — ❌ Not decided

- ❌ Products deleted from admin are hard-deleted (Sanity `delete()` mutation).
- ❌ User accounts can't be deleted at all.
- ❌ No `deleted_at` column anywhere.
- ❌ No recovery flow.

### 60. Collaboration Features — ⏭️ Skip

Single-user editing. Not applicable.

### 61. Webhooks (Outgoing) — 🟡 Partial

- ✅ Incoming webhook: Sanity → app (`/api/webhooks/sanity-navigation`) with HMAC verification.
- ❌ No outgoing webhooks (e.g., notify external service on order placed).

### 62. Timezone & Localization — ❌ Missing

- **UTC storage**: 🟡 Supabase defaults to UTC. Sanity uses ISO timestamps.
- **Local timezone display**: ❌ Uses `Europe/London` in Playwright config; not user-aware.
- **Currency per location**: ❌ Hardcoded `£` in `mapRawToProduct`. No `Intl.NumberFormat`.
- **Number formatting**: ❌ Hardcoded.

### 63. Rate Limiting & Abuse Prevention — 🟡 Partial

- **API rate limiting**: 🟡 Auth + media upload only. Not on cart, checkout, search, or admin API routes.
- **Form submission throttling**: ❌ None beyond auth.
- **Login attempt limiting**: ✅ 5/60s via Upstash sliding window.
- **Bot protection**: ❌ No Turnstile / hCaptcha on login, register, or checkout.
- **IP blocking**: ❌ None.

### 64. Multi-step Flows & Wizards — ❌ Missing

- ❌ Checkout is single page.
- ❌ No onboarding wizard.
- ❌ No multi-step product creation flow (single long form).

---

## Section D — Mobile/Desktop App — ⏭️ Skip

Web-only project. No native mobile or desktop targets. (If you're considering a mobile app later, the lack of a versioned public API — area 57 — will block you.)

---

## Section E — Universal Advanced (areas 73-80)

### 73-74. Progress Tracking / Session Recovery — 🟡 Partial

- `INVENTORY.md` (43 KB) is a hand-maintained progress doc. Good.
- `issues/` folder tracks known bugs.
- `prompts/` folder tracks design intentions.
- ❌ No automated session log. No checkpoint system. The `AGENTS.md` file is just one line: "NEVER push to GitHub."

### 75. Constraint Identification — ❌ Missing

No documented constraints (budget, hosting limits, third-party API restrictions, Nigerian context constraints). The `web-development-areas.md` reference calls this out as required before architecture decisions — currently not done.

### 76. Scalability Planning — ❌ Missing

- ❌ Expected traffic not documented.
- ❌ Stack breaking points not identified.
- ❌ No upgrade path documented.
- ❌ Database indexing: only `profiles.id` PK. No indexes on `profiles.email`, `profiles.role`.
- ❌ CDN: Sanity CDN for images. No edge caching strategy for Next.js pages.

### 77. Security — 🟡 Partial

- **HTTPS**: ✅ Vercel enforces HTTPS by default.
- **Input sanitization**: 🟡 Zod validation on server actions. React escapes by default. No explicit XSS sanitization on rich text.
- **CORS**: 🟡 `csrf.ts` checks Origin header against allowlist. No `Access-Control-Allow-Origin` config.
- **Auth token storage**: ✅ httpOnly cookies (Supabase SSR pattern).
- **Dependency vulnerability scanning**: ❌ No `npm audit` in CI. No Dependabot config.
- **Sensitive data**: 🟡 Service role key isolated to `admin.ts`. No PII encryption at rest beyond Supabase defaults.

### 78. Landing Page vs App Shell — ✅ Done

- Homepage (`/`) is the landing page.
- App routes (`/account`, `/admin`, `/cart`, `/checkout`) are separate.
- Same codebase, different caching rules (none set explicitly).

### 79. Design Tokens & Theming — 🟡 Partial

- ✅ Tailwind 4 with Material 3-style tokens (`bg-surface`, `text-on-surface`, `bg-primary`).
- ❌ No CSS variable system for runtime theme switching.
- ❌ Light mode token set doesn't exist.
- ❌ No theme switching mechanism.

### 80. Third Party Integrations — ❌ Mostly missing

| Category | Status | Notes |
|---|---|---|
| Email (Resend / SendGrid) | ❌ | None. Supabase default emails only. |
| SMS (Termii / Twilio) | ❌ | None. |
| Maps | ❌ | None. No address autocomplete. |
| Analytics | ❌ | None. |
| Social login | ❌ | None. |
| Customer support chat | ❌ | None. |
| Payments | ❌ | None. |
| Shipping providers | ❌ | None. |

**Only third-party integrations present:** Sanity (CMS), Supabase (auth+db), Upstash (rate limit), Sentry (errors), Vercel (hosting).

---

## Prioritized action plan

### Phase 1 — Unblock real selling (2-3 weeks)

If you want to actually sell something, these must ship first:

1. **Paystack integration** (1 week)
   - Add `orders` table to Supabase
   - Paystack checkout redirect flow
   - Webhook handler at `/api/webhooks/paystack`
   - Order confirmation page after successful payment
   - Test mode toggle via env

2. **Order management backend + admin** (1 week)
   - `orders`, `order_items` tables
   - Admin `/admin/orders` page with status transitions
   - Customer `/orders` page with order history
   - Email confirmation via Resend

3. **Inventory tracking** (3 days)
   - Decrement `sizes[].stock` on order
   - Show "out of stock" + disable add-to-cart when stock = 0
   - Low-stock admin report

4. **Shipping config** (3 days)
   - Shipping zones (Nigeria, international)
   - Flat-rate or weight-based calculation
   - Show estimated delivery at checkout

### Phase 2 — Legal & growth (1-2 weeks)

5. **`.env.example`** (10 minutes — do this today)
6. **Cookie consent banner** (1 day) — NDPR/GDPR compliance
7. **SEO infrastructure** (2 days)
   - `src/app/robots.ts`
   - `src/app/sitemap.ts`
   - JSON-LD on product pages (`Product`, `Offer`, `BreadcrumbList`)
   - Open Graph + Twitter card metadata
   - Canonical URLs
8. **Analytics** (1 day) — Vercel Analytics or Posthog
9. **CI workflow** (1 day) — GitHub Actions: lint + test + build on every PR
10. **Real README** (1 day) — replace default create-next-app README

### Phase 3 — Polish & scale (ongoing)

11. **Promo code system** (2 days)
12. **Product reviews** (3 days)
13. **Related products** (1 day)
14. **Email transactional system** (2 days) — Resend integration
15. **PWA / offline support** (3 days)
16. **Bundle size budget + analyzer in CI** (1 day)
17. **Migration system** (1 day) — adopt `supabase/migrations/`
18. **Audit logs** (2 days)
19. **Reduced-motion support** (1 day) — a11y
20. **Multi-currency + i18n architecture** (1 week) — even if you don't use it now, scaffold it

### Phase 4 — Strategic (1-2 months out)

21. **Public API with versioning** — for future mobile app
22. **Admin user management panel**
23. **Account deletion flow** (NDPR requirement)
24. **Address autocomplete** (Google Places)
25. **Abandoned cart recovery emails**
26. **Loyalty / membership tier** (the `member_price` field hints at this)

---

## Quick wins (do these today, <30 min each)

1. **Create `.env.example`** by running `node -e "console.log(Object.keys(require('./src/lib/env.ts')))"` — actually just list the vars from `src/lib/env.ts`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   SENTRY_DSN=
   SENTRY_AUTH_TOKEN=
   SENTRY_ORG=
   SENTRY_PROJECT=
   SANITY_WRITE_TOKEN=
   SANITY_WEBHOOK_SECRET=
   ADMIN_TEST_EMAIL=
   ADMIN_TEST_PASSWORD=
   ```

2. **Add a real `README.md`** — replace the default with: project name, what it is, how to dev, how to deploy, env var requirements, link to `INVENTORY.md`.

3. **Add `src/app/robots.ts`**:
   ```ts
   import type { MetadataRoute } from "next";
   export default function robots(): MetadataRoute.Robots {
     return {
       rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/cart", "/checkout", "/account"] },
       sitemap: "https://athletica-blond.vercel.app/sitemap.xml",
     };
   }
   ```

4. **Add Dependabot config** at `.github/dependabot.yml` for weekly npm security updates.

5. **Enable Vercel Analytics** — one env var, free tier, instant visibility into traffic + Core Web Vitals.

---

## Notes on the recent homepage editor work

Just to confirm: PR #5 (the redesign we did earlier) is **applied and live in this clone**. I can see:
- ✅ `src/components/admin/homepage/` with all 7 new files (EditPopup, Overview, BannerForm, CategoryGridForm, CategoryCarouselForm, ProductCarouselForm, types)
- ✅ `src/app/admin/homepage/loading.tsx` skeleton
- ✅ `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` in `package.json`
- ✅ `e2e/homepage-editor-redesigned.spec.ts` with 10 new tests
- ✅ `issues/` folder still contains the original bug docs (preserved as audit trail)
- ✅ Memoized `sanityCdnUrl` with the `Map` cache
- ✅ Lazy `getPreviewProducts` (Load preview button → popup auto-load pattern)

Bugs #1 through #11 from the homepage editor issues doc are all closed. The duplicate Thumbnail in ProductForm (Issue #1) is also fixed. Good work on applying those patches.

---

*Audit performed 2026-07-06 against commit `2f4ec35`. Re-audit recommended after Phase 1 ships.*
