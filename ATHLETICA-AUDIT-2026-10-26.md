# Athletica — Audit Against `web-development-areas.md`

Date: 2026-10-26  
Scope: the live storefront at `https://athletica-blond.vercel.app` and the repository at `athletica/athletica/frontend`.  
Not deeply audited: `rollout/` (a separate affiliate app in the same repo).  
Method: source inspection, `git ls-files` / `.gitignore` inspection, live HTTP checks.

## Verdict

The application foundation is real: Next.js app router, a substantial product catalogue, admin panel, Supabase auth, Sanity content, cart/search/filter, design tokens, error boundaries, Sentry, rate limiting, unit tests, and an admin route guard.

The production layer is largely missing. The repository does not contain enough information for a new developer or an AI agent to reproduce the setup; the live site has no technical SEO; checkout does not place an order; legal pages are placeholders; there is no CI quality gate; and the backup design is unlikely to work on Vercel.

The user's headline complaint is correct: **there is no README on GitHub, no real sitemap/robots/llms files on the live site, and no complete repository context.**

---

## 1. Repository completeness — the most important gap

### Observed

- `frontend/README.md` exists on disk but is **untracked** (`git ls-files frontend/README.md` → empty).
- The root `README.md` exists on disk but is **ignored** by the root `.gitignore` (`/*`).
- The only tracked README is `rollout/README.md`.
- `frontend/.env.example` exists on disk but is **ignored** by `frontend/.gitignore` (`.env*`). A fresh clone therefore has no environment template, despite the README telling the reader to copy it.
- The root `.gitignore` is:
  ```
  /*
  !/frontend/
  !/rollout/
  ```
  New root files (including `README.md`) and directories such as `supabase/`, `scripts/`, and `openspec/` are not tracked. Some older root files (`data/`, `.github/`) are already tracked, but `supabase/migrations`, root `scripts`, and root `README.md` are not.
- `frontend/docs/` is ignored by `frontend/.gitignore`.
- `frontend/README.md` describes `supabase/` under `frontend/`, but there is no `frontend/supabase/`; the actual migrations are at root `supabase/migrations/` and are untracked.
- `frontend/README.md` says to run `npm install` after `cd athletica`, but there is no root `package.json`; the app's `package.json` is in `frontend/`.
- The two READMEs disagree on setup paths, and neither is committed.

### Consequence

A fresh clone cannot reproduce the database schema, cannot set up environment variables from a committed template, and has no project README. This is directly why an AI agent or new developer cannot understand the repository from GitHub.

### Required fix

- Unignore and commit a root `README.md`.
- Commit `frontend/README.md` (or replace both with one root README).
- Unignore `frontend/.env.example` and commit it with placeholder values only.
- Commit `supabase/migrations/`, root `scripts/`, and any operational docs that belong in the repo.
- Add an `AGENTS.md` or `ARCHITECTURE.md` with the app map, data flow, environment, and key commands.
- Fix the setup instructions to `cd frontend` before `npm install`.

---

## 2. SEO and discoverability — absent on the real deployment

### Observed

- No `src/app/robots.ts`, `src/app/sitemap.ts`, `public/robots.txt`, `public/sitemap.xml`, or `public/llms.txt`.
- Live checks against `https://athletica-blond.vercel.app`:
  - `/robots.txt` → HTTP 200, `text/html`, 106 KB — the 404 page, not a robots file.
  - `/sitemap.xml` → HTTP 200, `text/html` — the 404 page.
  - `/llms.txt` → HTTP 200, `text/html` — the 404 page.
- `src/app/layout.tsx` has only `title`, `description`, and `keywords`. There is no `metadataBase`, `openGraph`, `twitter`, `alternates.canonical`, `robots`, `icons`, or `manifest`.
- `generateMetadata` in `src/app/[...slug]/page.tsx` returns only `title` and `description` for products and categories. No canonical URL, no OG image, no product schema.
- Live product/category HTML has no `application/ld+json`, no canonical link, and no Open Graph/Twitter tags.
- The live homepage has no `<h1>`; the first `<h1>` in the page is inside the cart drawer ("Your Cart").
- Product meta descriptions are thin (`"Road To Glory Pack"`); category descriptions are just the category name (`"Predator"`).
- Admin login, account, checkout, and orders pages are indexable and inherit the generic store description. There is no `noindex` on private or transactional pages.
- Missing routes return HTTP 200 with the "Page Not Found" page. Examples: `/football-boots`, `/this-page-does-not-exist`, `/robots.txt`. These are soft 404s.
- `athletica.store` is a GoDaddy parked/for-sale domain, not the site. The category admin form hardcodes canonical URLs to `https://athletica.store/...` (`src/components/admin/category-management/category-management.interactions.tsx`).
- The homepage HTML is about 743 KB and preloads seven large hero images.
- `public/fonts/Inter-Variable.ttf` is missing; `/fonts/Inter-Variable.ttf` returns HTTP 200 `text/html` (the 404 page), so the body font falls back.

### Required fix

- Add `robots.ts` with a sitemap reference; disallow `/admin`, `/api`, `/account`, `/checkout`, `/orders`, and search/filter URLs where appropriate.
- Add `sitemap.ts` generated from products, categories, and static pages; ensure absolute URLs use the real deployment domain.
- Add `llms.txt` with a plain-language site summary, key URLs, product/category map, policies, and contact.
- Add `metadataBase` and a real production base URL.
- Add Open Graph and Twitter metadata with a real image; add `opengraph-image` for product/category pages.
- Add canonical URLs; avoid indexing filtered/search variants.
- Add JSON-LD: `Organization`/`WebSite` on home, `Product`/`Offer` on product pages, `BreadcrumbList` on category/product pages.
- Add `noindex` on admin/login, account, checkout, orders, and other private pages.
- Return real HTTP 404 for missing content; do not render the 404 page with 200.
- Remove/repair the parked-domain canonical default.
- Add an `<h1>` to the homepage and unique product/category descriptions.

---

## 3. Commerce — checkout is a mock

### Observed

- `src/app/checkout/CheckoutForm.tsx`:
  - `onSubmit` only calls `setSubmitted(true)`.
  - No server action, no payment provider, no order record, no cart clear, no email.
  - Displays "Order Placed!" and "You will receive a confirmation email shortly."
  - Displays "Payment integration coming soon" and "This is a demo — no real payment will be processed."
- `src/app/orders/page.tsx` is a `PlaceholderPage`.
- `src/app/account/AccountPage.tsx` says "Sign in to view your account details and order history"; there is no order history.
- No Paystack, Stripe, Flutterwave, or other payment integration.
- No shipping rates/zones; checkout says "Calculated at checkout" but no calculation exists.
- No promo/discount code flow.
- No inventory decrement or low-stock alert.
- No order confirmation email provider (Resend/SendGrid/etc.).
- No reviews/testimonials.
- No admin orders route.
- No refunds/cancellation/returns workflow; `src/app/returns/page.tsx` is a placeholder.

### Consequence

The site cannot take money or record an order. If the business is affiliate-only, the cart/checkout/order UI is misleading and should be removed or explicitly labelled as a catalogue/affiliate flow. If it is meant to be a store, payment and order management are the largest missing feature.

---

## 4. Legal and compliance — placeholders on a live site

- `privacy-policy`, `terms`, `cookies`, and `returns` are all `PlaceholderPage` components.
- The footer exposes these pages as if they were real policies.
- No cookie consent banner or consent management.
- The site creates customer accounts and stores cart/auth data, but has no published privacy policy.
- No age restriction or GDPR/CCPA data-request process documented.

This is a launch blocker if the site is public and accepts accounts.

---

## 5. Testing, CI, and quality gates

- Unit tests: 17 files under `src/` using Vitest/Testing Library/MSW.
- E2E/visual specs: 14 Playwright specs under `e2e/`.
- No `playwright.config.ts`.
- `@playwright/test` is not listed in `package.json`; it appears in `node_modules` but is not reproducible from a fresh install.
- No `test:e2e` script.
- The only GitHub workflow is `.github/workflows/sanity-json-update.yml` (Sanity data sync). There is no lint, typecheck, test, build, or preview gate.
- No Prettier, Husky, lint-staged, or `typecheck` script.
- ESLint and TypeScript strict mode are configured.
- No Lighthouse/Core Web Vitals budget or bundle budget; `@next/bundle-analyzer` is installed but no documented script.

---

## 6. Security and operations

### Good

- Admin routes and `/api/admin/*` are protected server-side by `src/proxy.ts`: it checks the Supabase user and `profiles.role === "admin"`.
- `AdminGuard` adds a client-side defense-in-depth check.
- RLS is enabled for the core catalogue tables in the tracked migrations.
- HSTS is present on the live response.
- Upstash rate limiting exists for auth and upload.
- Sentry is configured.

### Gaps / risks

- `profiles` is not in the repository migrations. The proxy and auth context query `profiles.role`; a fresh database built from the migrations will not have it. Role and RLS cannot be verified or reproduced.
- Admin settings says "Role management is coming soon"; there is no user/role management UI.
- Live headers include HSTS but not CSP, X-Frame-Options, Referrer-Policy, or Permissions-Policy. `x-powered-by: Next.js` is exposed.
- `isValidOrigin` returns `true` when neither Origin nor Referer is present and uses `startsWith` matching; it is a weak CSRF check.
- `src/lib/supabase/admin.ts` does not import `server-only`; an accidental client import would not be caught at build time.
- No dependency scanning/Dependabot/npm audit in CI.
- Backup design (`src/lib/backup/snapshot.ts`):
  - Triggered by an authenticated admin page load, not a cron.
  - Runs `pg_dump`; Vercel's Node runtime normally does not include PostgreSQL client binaries.
  - No `vercel.json` cron and no `pg_dump` install step.
  - Uploads a plain dump of the `public` schema to Sanity as a file asset; no encryption.
  - No restore drill/runbook.
- No uptime monitor or alerting; Sentry is error tracking, not availability monitoring.
- No public analytics (GA4/PostHog/Vercel Analytics); admin overview "clicks" are hardcoded to zero.

---

## 7. Live bugs found during the audit

1. **Broken product-card links.** Homepage product cards link to `/https://www.amazon.com/...` instead of the Amazon URL. `ProductCard` prepends `/` to `product.url_slug`; some slugs contain full URLs. One card links to `/https://athletica-blond.vercel.app/admin/products/new`.
2. **Soft 404s.** Missing routes return 200 + the 404 page. `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/football-boots`, and arbitrary missing URLs all behave this way.
3. **Missing Inter font.** `globals.css` references `/fonts/Inter-Variable.ttf`; `public/fonts/` only contains Lexend and Material Symbols. The request returns the HTML 404 page.
4. **Parked canonical domain.** `athletica.store` redirects to a GoDaddy lander and is listed for sale. Admin category SEO defaults point there.
5. **Admin login indexable.** `/admin/login` returns 200 with the generic store title/description and no `noindex`.
6. **Homepage has no H1.** The first H1 is the hidden cart drawer.
7. **README setup is wrong.** It says `cd athletica; npm install`, but the app is in `frontend/`.
8. **README claims unsupported features.** It says checkout, order history, traffic analytics, and legal pages exist; they are mock/placeholder.
9. **README says "no public sign-up."** The customer `/register` page is public. The sentence is under "Admin access", but as written it is ambiguous/contradictory.

---

## 8. Checklist status

Legend: ✅ done / 🟡 partial / ❌ missing or not decided / N/A not applicable.

| # | Area | Status | Evidence / gap |
|---|---|---|---|
| 01 | Project setup | 🟡 | Live on Vercel; no written client/deadline/budget/audience/currency/domain/environment decisions. `athletica.store` is parked. |
| 02 | Stack | ✅ | Next.js 16, React 19, TypeScript, Tailwind 4, RHF/Zod, Zustand, Framer, Supabase, Sanity. |
| 03 | Design system | 🟡 | CSS tokens in `globals.css`; no documented type/space scale, no light mode. |
| 04 | Brand | 🟡 | Logo/colors/fonts; no brand guidelines; Inter file missing. |
| 05 | Frontend architecture | 🟡 | Consistent structure; no architecture doc/component map/bundle budget. |
| 06 | Routing | 🟡 | App Router and 404/error pages; broken links, soft 404s, no route inventory. |
| 07 | SEO | ❌ | No robots/sitemap/llms/JSON-LD/canonical/OG/Twitter; no metadataBase; no noindex. |
| 08 | Performance | 🟡 | `next/image`, ISR; no CWV/Lighthouse target; 743 KB home, 7 hero preloads, missing font. |
| 09 | Responsive | 🟡 | Mobile-first classes; no device matrix or visual test across breakpoints. |
| 10 | Cross-browser | ❌ | Chromium-only snapshots; no Playwright config; no Firefox/WebKit. |
| 11 | Accessibility | 🟡 | Skip link, aria, jest-axe; no CI audit, keyboard/screen-reader review, or WCAG target; no home H1. |
| 12 | Assets/media | 🟡 | Sanity CDN + `next/image`; image filenames with spaces/parentheses; no video/icon policy. |
| 13 | Error handling | 🟡 | `error.tsx`, `not-found`, Sentry; third-party-down behavior undocumented. |
| 14 | Environment/config | ❌ | `.env.example` ignored; no staging/rotation/feature flags. |
| 15 | Version control | ❌ | No branch/commit/PR/tag/protection docs; README/schema untracked. |
| 16 | Dev workflow | 🟡 | ESLint + TS strict; no Prettier/Husky/lint-staged/typecheck. |
| 17 | Testing | 🟡 | 17 unit tests; 14 e2e specs but no runnable Playwright setup/CI. |
| 18 | Deployment/DevOps | 🟡 | Vercel live; no CI/rollback/environment-separation docs. |
| 19 | Monitoring | 🟡 | Sentry/web-vitals; no uptime, alerts, or public analytics. |
| 20 | Legal/compliance | ❌ | Privacy/terms/cookies/returns placeholders; no consent banner. |
| 21 | Documentation | ❌ | No tracked README/changelog/API/onboarding/architecture. |
| 22 | Naming conventions | 🟡 | Code mostly consistent; no documented convention. |
| 23 | Animation/interactions | 🟡 | Framer Motion; no reduced-motion or performance budget. |
| 24 | Notifications/feedback | 🟡 | Toasts/modals/empty states; no order email. |
| 25 | Forms | ✅/🟡 | RHF/Zod/upload; no multi-step/autosave. |
| 26 | i18n | ❌ | None; EUR prices with "United States" checkout default. |
| 27 | Offline/PWA | ❌ | No manifest/service worker; not decided. |
| 28 | Sessions | 🟡 | Supabase SSR cookies; no timeout/remember/multi-device policy. |
| 29 | Redirects/URLs | 🟡 | `/admin` redirect; no canonical/trailing-slash/old-URL policy; malformed product slugs. |
| 30 | Bundle/code splitting | 🟡 | Next splitting + analyzer dependency; no script/budget. |
| 31 | Backup/recovery | ❌/🟡 | Code exists but likely cannot run on Vercel; no cron/alerting/encryption/restore drill. |
| 32 | Client communication | ❌ | No update cadence/sign-off docs. |
| 33 | Handoff/maintenance | ❌ | No runbook/credentials/training/support. |
| 34 | Payment | ❌ | No provider/webhooks/refunds/receipts. |
| 35 | Product catalogue | 🟡 | Substantial products/brands/categories/models/images/related; live card URLs malformed. |
| 36 | Inventory | 🟡 | Stock fields/size picker; no decrement/alerts/sync. |
| 37 | Cart/checkout | 🟡 | Cart works; checkout is a mock; no guest/account decision; no address autocomplete. |
| 38 | Shipping | ❌ | No zones/rates/tracking. |
| 39 | Discounts | ❌ | No promo codes; product discount fields only. |
| 40 | Order management | ❌ | No order record/admin/email/refunds; page placeholder. |
| 41 | CMS | ✅/🟡 | Sanity for content/nav/media; products in Supabase; preview unclear. |
| 42 | Reviews/testimonials | ❌ | None. |
| 43 | Auth/authorization | 🟡 | Supabase login/register/reset; admin proxy; no social/MFA; `profiles` schema missing. |
| 44 | User management | 🟡 | Account read-only; no edit/avatar/delete/admin users; role management coming soon. |
| 45 | Onboarding | ❌ | None. |
| 46 | Dashboard/data viz | 🟡 | Admin charts; clicks hardcoded 0; no export/real-time. |
| 47 | Real-time | N/A/❌ | No live updates. |
| 48 | Notifications | 🟡 | Toasts; no email/push/preferences/history. |
| 49 | Multi-tenancy | N/A | Single store. |
| 50 | File management | 🟡 | Sanity upload, MIME/size, orphan cleanup; no virus scan. |
| 51 | Search/filtering | 🟡 | Product search/filter; no global search. |
| 52 | Audit logs | ❌ | None. |
| 53 | Import/export | 🟡 | CSV/ZIP/XLSX import; no user data export. |
| 54 | Subscriptions | N/A | None. |
| 55 | Settings | 🟡 | Admin site settings; no feature flags/user preferences. |
| 56 | Admin panel | ✅/🟡 | Substantial and protected; no user/order management. |
| 57 | API design | 🟡 | Internal routes; no versioning/auth docs/rate limits everywhere. |
| 58 | Background jobs | ❌ | No queue/retry/monitoring. |
| 59 | Soft/hard delete | 🟡 | Destructive guards; no documented policy. |
| 60 | Collaboration | N/A/❌ | No multi-user editing/locking. |
| 61 | Outgoing webhooks | ❌ | Only incoming Sanity webhook. |
| 62 | Timezone/localization | ❌ | No timezone policy; EUR/US mismatch. |
| 63 | Rate limiting/abuse | 🟡 | Upstash auth/upload; no bot protection/CAPTCHA; weak origin check. |
| 64 | Multi-step flows | 🟡 | Single-page checkout; no saved progress. |
| 65–72 | Mobile/desktop app areas | N/A | No native app. |
| 73 | Progress tracking | ❌ | No checklist in repo. |
| 74 | Session recovery | ❌ | No session log. |
| 75 | Constraints | ❌ | No written constraints. |
| 76 | Scalability | ❌ | No traffic/index/CDN plan. |
| 77 | Security | 🟡/❌ | HSTS + proxy; missing CSP/XFO/referrer; no dependency scan; role schema missing; backup encryption. |
| 78 | Landing vs app shell | 🟡 | Storefront + admin; public SEO shell missing. |
| 79 | Design tokens | ✅ | CSS variables in `globals.css`. |
| 80 | Third-party integrations | 🟡 | Supabase/Sanity/Sentry/Upstash; no email/SMS/maps/chat/analytics. |

---

## 9. Priority order

1. **Make the repo self-contained.** Track root README, frontend README, `.env.example`, `supabase/migrations`, scripts, and architecture docs.
2. **Add the SEO foundation.** `robots.ts`, `sitemap.ts`, `llms.txt`, canonical URLs, OG/Twitter, JSON-LD, `metadataBase`, `noindex` on private pages, real 404 status.
3. **Make commerce truthful.** Either implement payment + order records + emails + admin orders, or remove/label the checkout as a catalogue/affiliate flow.
4. **Publish real legal pages and cookie consent.**
5. **Add CI.** Lint, typecheck, unit tests, build, and Playwright with a checked-in config and dependency.
6. **Fix the live data/URL bugs.** Product slugs, broken Amazon links, soft 404s, missing font, parked canonical default.
7. **Harden security/ops.** Security headers, role schema/RLS in migrations, dependency scanning, a backup that actually runs and is encrypted, uptime alerts.
8. **Write the docs/runbook.** Setup, env table, deployment, rollback, backup/restore, admin operations, incident response.
9. **Add analytics/monitoring.** Public traffic analytics, real admin click data, uptime checks.
10. **Decide the remaining product questions.** PWA/offline, i18n, reviews, discounts, shipping, inventory, cross-browser support.

---

## 10. What is actually done

- Next.js 16 App Router with React 19 and TypeScript.
- Product catalogue, search, filters, product pages, cart.
- Admin panel for products, brands, categories, models, media, homepage, navigation, import.
- Supabase Auth with customer login/register/reset.
- Admin route protection via `src/proxy.ts` and `AdminGuard`.
- Sanity CMS integration.
- Design tokens and responsive UI.
- Error boundaries and Sentry.
- Upstash rate limiting.
- 17 unit tests and 14 Playwright specs (the specs exist, but the runner setup is incomplete).
- Vercel deployment.
- A backup implementation (conceptually present, operationally risky).

The foundation is not the problem. The missing parts are the ones that make it a production business: discoverability, documentation, payments/orders, legal, CI, backups, and operational evidence.
