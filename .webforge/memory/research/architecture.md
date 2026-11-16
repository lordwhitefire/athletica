# Application Architecture — Athletica

> Compiled by Athena (Intelligence Dept) on 2026-07-12
> Source: Full source tree scan

---

## Directory Layout (`frontend/src/`)

```
src/
├── app/                          # Next.js App Router pages
│   ├── [...slug]/                # Catch-all: product detail & category pages
│   │   ├── page.tsx              # Route resolver (product vs category vs 404)
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── account/                  # User account page
│   ├── admin/                    # Admin panel (protected)
│   │   ├── layout.tsx            # AdminShell wrapper, force-dynamic
│   │   ├── page.tsx              # Dashboard with stats + quick actions
│   │   ├── dashboard-stats.tsx
│   │   ├── amazon-links/
│   │   ├── brands/
│   │   ├── homepage/             # Homepage editor
│   │   ├── login/
│   │   ├── media/
│   │   ├── navigation/
│   │   ├── products/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── admin/                # batch-upload, build-status, login, logout, media, seed-brands, trigger-build
│   │   └── webhooks/             # sanity-navigation (HMAC-verified)
│   ├── cart/                     # Cart page
│   ├── checkout/                 # Checkout page (placeholder payment)
│   ├── cookies/                  # Cookie policy (placeholder)
│   ├── forgot-password/          # Password reset
│   ├── login/                    # Login page
│   ├── orders/                   # Orders page (placeholder)
│   ├── privacy-policy/           # Privacy policy
│   ├── register/                 # Registration page
│   ├── returns/                  # Returns page
│   ├── search/                   # Search results
│   ├── terms/                    # Terms of service
│   ├── layout.tsx                # Root layout (providers, header, footer)
│   ├── page.tsx                  # Homepage
│   ├── globals.css               # Tailwind v4 theme + font faces
│   ├── site-preloader.tsx        # Sanity data preloader
│   ├── error.tsx                 # Global error boundary
│   ├── loading.tsx               # Global loading state
│   └── not-found.tsx             # 404 page
│
├── components/                   # React components by domain
│   ├── admin/                    # Admin panel components
│   │   ├── homepage/             # Homepage editor sub-components (redesign)
│   │   │   ├── BannerForm.tsx, CategoryCarouselForm.tsx, CategoryGridForm.tsx
│   │   │   ├── EditPopup.tsx, Overview.tsx, ProductCarouselForm.tsx
│   │   │   └── types.ts
│   │   ├── AmazonLinksEditor.tsx, AutoSuggest.tsx, BuildStatus.tsx
│   │   ├── DashboardPreviewHub.tsx, HomepageEditor.tsx (legacy)
│   │   ├── ImageSelector.tsx, MediaBrowser.tsx, MediaLibrary.tsx
│   │   ├── ModelInput.tsx, NavigationEditor.tsx
│   │   ├── ProductForm.tsx, VariantSectionEditor.tsx
│   ├── auth/                     # Auth forms
│   │   ├── LoginForm.tsx, LoginForm.test.tsx
│   │   └── RegisterForm.tsx
│   ├── cart/                     # Cart components
│   │   ├── CartPage.tsx, MiniCart.tsx, MiniCart.test.tsx
│   ├── category/                 # Category page components
│   │   ├── ActiveFilters.tsx, CategoryPage.tsx
│   │   ├── FilterSidebar.tsx, Pagination.tsx
│   │   ├── ProductCard.tsx, SortDropdown.tsx, ProductGrid.tsx
│   ├── homepage/                 # Homepage display components
│   │   ├── CategoryCarousel.tsx, CategorySection.tsx
│   │   ├── HeroCarousel.tsx, HomepageRenderer.tsx
│   ├── navigation/               # Navigation components
│   │   ├── Breadcrumb.tsx, Header.tsx, MainNav.tsx
│   │   ├── MegaMenu.tsx, MobileNav.tsx
│   ├── product/                  # Product detail components
│   │   ├── ImageGallery.tsx, ProductCarousel.tsx
│   │   ├── ProductDescription.tsx, ProductInfo.tsx, ProductPage.tsx
│   ├── ui/                       # Shared UI components
│   │   ├── Footer.tsx, Form.tsx, InfoTooltip.tsx
│   │   ├── Input.tsx, Select.tsx, Textarea.tsx, SubmitButton.tsx
│   │   ├── PlaceholderPage.tsx, ScrollToTop.tsx
│   │   ├── SizePickerModal.tsx
│   ├── PageTransition.tsx        # Framer Motion page wrapper
│   ├── Providers.tsx             # Client providers composition
│   ├── ToastContainer.tsx, ToastContainer.test.tsx
│
├── context/                      # React Context providers
│   ├── AuthContext.tsx            # Supabase auth state
│   ├── CartContext.tsx            # Cart state (cookie-based)
│   ├── ToastContext.tsx           # Toast notifications
│   └── WishlistContext.tsx        # Wishlist (delegates to Zustand store)
│
├── lib/                          # Utilities, data fetching, server actions
│   ├── actions/                  # Server actions (use server)
│   │   ├── __tests__/            # batch-upload test
│   │   ├── admin-auth.ts, amazon-links.ts, batch-upload.ts, brands.ts
│   │   ├── get-dashboard-counts.ts, get-dashboard-preview.ts
│   │   ├── homepage.ts (413 lines — full CRUD for homepage sections)
│   │   ├── media.ts, navigation.ts, products.ts, siteSettings.ts, suggestions.ts
│   │   └── *integration tests
│   ├── schemas/                  # Zod validation schemas
│   │   ├── __tests__/
│   │   └── amazon-links.ts, auth.ts, batch-upload.ts, brand.ts
│   │       checkout.ts, homepage.ts, navigation.ts, product.ts, site-settings.ts
│   ├── supabase/                 # Supabase client factories
│   │   ├── client.ts (browser), server.ts (server), admin.ts (service role)
│   ├── hooks/                    # Custom hooks
│   │   └── useUnsavedChanges.ts
│   ├── mocks/                    # MSW handlers for tests
│   │   ├── handlers/ (sanity.ts, supabase.ts)
│   │   └── server.ts
│   ├── admin-sanity.ts           # Admin Sanity client (with write token)
│   ├── api-types.ts              # ApiResult<T>, ok(), fail(), fromCaughtError()
│   ├── csrf.ts                   # Origin allowlist check
│   ├── env.ts                    # Zod-validated environment variables
│   ├── filterProducts.ts         # Client-side product filtering
│   ├── generateFilters.ts        # Filter options from product data
│   ├── getAmazonLinks.ts         # Read amazon-links.json
│   ├── getDashboardCounts.ts     # Admin dashboard counts
│   ├── getHomepageJson.ts        # Read homepage.json + product carousels
│   ├── getNavigation.ts          # Read navigation.json + href builders
│   ├── getProducts.ts            # Read data/products/*.json
│   ├── getProductsSanity.ts      # Direct Sanity product queries
│   ├── logger.ts                 # Sentry logger wrapper
│   ├── model.ts                  # Product model split/join utilities
│   ├── rate-limit.ts             # Upstash rate limiters
│   ├── rebuild-nav-urls.ts       # Navigation URL rebuilder
│   ├── resolveRoute.ts           # URL → product/category/404 resolver
│   ├── sanity-client.ts          # Public Sanity client (CDN) + sanityCdnUrl cache
│   ├── sanity.ts                 # Re-exports + getSiteLogoUrl()
│   └── validate.ts               # validateOrFail() helper
│
├── store/                        # Zustand stores
│   ├── toast.ts                  # Toast notification store
│   └── wishlist.ts               # Wishlist (persisted to localStorage)
│
├── test-utils/                   # Test infrastructure
│   ├── handlers/                 # Test-specific MSW handlers
│   │   ├── sanity.ts, supabase.ts
│   ├── msw-server.ts             # MSW server for test-utils
│   ├── renderWithProviders.tsx    # Custom render with all providers
│   └── setup.tsx                 # Vitest setup (mocks + MSW lifecycle)
│
└── types/                        # TypeScript type definitions
    ├── auth.ts, cart.ts, homepage.ts, navigation.ts, product.ts
```

---

## Routing Architecture

### Route Map

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Homepage with hero, carousels, category sections |
| `/[slug]` | `app/[...slug]/page.tsx` | Catch-all resolves to product or category |
| `/cart` | `app/cart/page.tsx` | Shopping cart |
| `/checkout` | `app/checkout/page.tsx` | Checkout (demo payment) |
| `/login` | `app/login/page.tsx` | Sign in |
| `/register` | `app/register/page.tsx` | Create account |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password reset |
| `/account` | `app/account/page.tsx` | User account |
| `/orders` | `app/orders/page.tsx` | Order history (placeholder) |
| `/search` | `app/search/page.tsx` | Product search |
| `/cookies` | `app/cookies/page.tsx` | Cookie policy (placeholder) |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | Privacy policy |
| `/terms` | `app/terms/page.tsx` | Terms of service |
| `/returns` | `app/returns/page.tsx` | Returns policy |
| `/admin/*` | `app/admin/*` | Admin panel (protected, force-dynamic) |

### Catch-all Route (`[...slug]`)

Resolution logic in `src/lib/resolveRoute.ts`:
1. Check if slug matches a product's `url_slug` → **product page**
2. Check if slug matches a nav item's `href` → **category page** (derive filters from nav tree)
3. Otherwise → **404**

Derives filters from navigation tree hierarchy: category → brand → model → traction

---

## Component Architecture

### Provider Nesting (Root Layout)
```
Providers (AuthProvider → CartProvider → ToastProvider → WishlistProvider)
  ├── Header (sticky, navigation from Sanity)
  ├── PageTransition (framer-motion)
  │   └── <main> (page content)
  ├── Footer
  └── ScrollToTop
```

### Key Component Hierarchies

**Homepage:**
```
page.tsx → HeroCarousel + HomepageRenderer
  HomepageRenderer → CategoryCarousel | ProductCarousel | CategorySection
```

**Category Page:**
```
[...slug]/page.tsx → CategoryPage
  CategoryPage → Breadcrumb + ActiveFilters + FilterSidebar + SortDropdown + ProductGrid + Pagination
```

**Product Detail Page:**
```
[...slug]/page.tsx → ProductPage
  ProductPage → Breadcrumb + ImageGallery + ProductInfo + ProductDescription + ProductCarousel (×3)
```

**Admin (force-dynamic layout):**
```
AdminLayout → AdminShell
  AdminShell → Dashboard | HomepageEditor | ProductForm | NavigationEditor | etc.
```

---

## Data Flow Pattern

```
Sanity CMS (studio-athletica/)
    │
    ├── Webhook (sanity-json-update.yml) ───→ data/homepage.json, data/products/*.json, data/navigation.json, etc.
    │
    └── Direct query (admin panel mutations) ─→ Sanity (via @sanity/client with write token)

Frontend reads JSON files:
    Server Components → cache() → readFile(data/*.json) → transform → Client Components
```

**Key characteristic**: The frontend primarily reads from static JSON files (synced from Sanity via GitHub workflow), not directly from the Sanity API (except admin panel mutations). This means:
- Fast reads (no API latency)
- Stale data until next sync
- Admin mutations write directly to Sanity AND call `revalidatePath()`

---

## Admin Panel Structure

| Route | Component | Purpose |
|---|---|---|
| `/admin` | Dashboard | Stats + quick actions + preview hub |
| `/admin/homepage` | HomepageEditor + EditPopup/Overview | Section-by-section homepage editing with DnD reorder |
| `/admin/products` | ProductForm | Product CRUD |
| `/admin/products/new` | ProductForm | Create product |
| `/admin/navigation` | NavigationEditor | Navigation tree editor |
| `/admin/brands` | BrandsEditor | Brand CRUD |
| `/admin/media` | MediaLibrary | Image upload + management |
| `/admin/amazon-links` | AmazonLinksEditor | Amazon affiliate links |
| `/admin/settings` | SettingsEditor | Site settings |

---

## Error Handling

- **Error boundaries**: `error.tsx` at root, admin, [...slug], account, cart, checkout, search
- **API error shape**: `{ type, code, message, fields? }` via `ApiResult` pattern
- **User-facing errors**: Toast notifications (`ToastContext`) + inline form errors
- **Logging**: Sentry (client + server + edge) + custom `logger.ts`
- **404**: `not-found.tsx` at root, `notFound()` in catch-all route

---

## Security

- **CSRF**: Origin/referer allowlist check (`src/lib/csrf.ts`)
- **Rate limiting**: Upstash Redis (auth: 5/60s, upload: 10/60s)
- **Sanity webhook**: HMAC-SHA256 signature verification with `timingSafeEqual`
- **Service role key**: Isolated to `src/lib/supabase/admin.ts` (server-only)
- **Admin auth**: Cookie-based session check
