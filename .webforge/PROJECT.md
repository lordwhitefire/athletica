# Project Overview

> Entry point document. Last updated: 2026-07-12
> Source: Athena intelligence scan (tech-stack.md, architecture.md, data-flow.md, key-findings.md)

## Project Name
**Athletica** — Football/Sports E-Commerce Platform

## Goal
Build a complete football boots e-commerce store with:
- **Storefront** — Next.js (App Router) product catalog with category pages, product detail, cart, wishlist, search, account pages
- **CMS** — Sanity.io for product/content management (owner uploads product info + images via Sanity Studio)
- **Auth** — Supabase Auth (email/password) with admin and customer roles
- **Admin Panel** — Full CRUD for products, brands, navigation, homepage sections, media library, Amazon affiliate links, site settings
- **Target** — Nigeria market (Nigerian football/sports gear customers)
- **Domain** — Likely uses `athletica.com.ng` or similar Nigerian TLD

*Source: `context/goal.md` line 3-7, key-findings.md lines 10-27 (built features)*

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript | ^5 (strict mode) |
| **Styling** | Tailwind CSS | v4 (CSS-based config) |
| **CMS** | Sanity | v5 (standalone studio: `studio-athletica/`) |
| **Auth** | Supabase Auth (`@supabase/ssr`) | latest |
| **Database** | Supabase (Postgres) — 1 table: `profiles` |
| **State** | Zustand 5 (wishlist, toast) + Context API (auth, cart, toasts) |
| **Forms** | react-hook-form + Zod v4 |
| **Animations** | Framer Motion 12.40 |
| **Icons** | lucide-react 0.575 + Material Symbols Outlined |
| **Rate Limiting** | Upstash Redis |
| **Error Tracking** | Sentry (`@sentry/nextjs`) |
| **Testing** | Vitest (unit/integration) + Playwright (E2E) + MSW |
| **CI/CD** | Vercel (auto-deploy) + GitHub Actions (Sanity sync only) |

*Source: tech-stack.md lines 10-106, key-findings.md lines 32-44*

## Current Status

### ✅ Already Built & Working
- **Storefront**: Homepage (hero carousel + 28 sections), Category pages (filters, sort, pagination), Product detail pages (gallery, sizes, colors, cart), Cart (cookie-based, 30-day), Search, Auth (login/register/forgot-password)
- **Admin Panel**: Dashboard, Homepage Editor (DnD with dnd-kit), Product CRUD, Brands Manager, Navigation Editor, Media Library, Amazon Links Editor, Batch Upload (CSV), Site Settings, Build Status
- **Infrastructure**: Sentry (error tracking), Upstash (rate limiting), CSRF protection, Sanity webhook (HMAC-verified), Zod validation on all server actions, Material 3 design tokens
- **Testing**: 17 unit/integration tests, 14 Playwright E2E specs (including visual regression), MSW mocking, coverage thresholds (80% lines)

### 🟡 In Progress / Partial
- Variant-specific forms for homepage editor (product carousel `filtered-feed`, category carousel `curated-cards`)
- Sanity schema deploy needed (missing `variant`/`snapshot` fields)

### ❌ Critical Gaps (Blocking Launch)
1. **No payment integration** — Checkout is demo/placeholder
2. **No order management** — No orders table, no admin orders panel, no order history
3. **No inventory tracking** — `sizes[].stock` exists but never decremented
4. **No shipping configuration** — No zones, cost calculation, tracking
5. **No SEO infrastructure** — No robots.txt, sitemap.xml, JSON-LD, OG tags, canonical URLs
6. **No cookie consent banner** — GDPR/NDPR compliance risk
7. **No CI workflow for tests** — Tests don't run on PR/commit
8. **No analytics** — Zero visibility into user behavior
9. **No `.env.example`** — New devs can't bootstrap
10. **No staging environment** — Only prod + local dev

### 🐛 Known Bugs (High Severity)
- AutoSuggest links produce broken URLs (`[object Object]`)
- Save All skips key checks
- Homepage editor page takes >60s to load (critical)

*Source: key-findings.md lines 66-99, key-findings.md lines 153-169*

## Directory Layout

```
athletica/
├── frontend/           # Next.js app (gitignored at root)
│   ├── src/
│   │   ├── app/        # App Router pages (16 routes)
│   │   ├── components/ # React components by domain
│   │   ├── lib/        # Utilities, data fetching, server actions
│   │   ├── context/    # React Context providers
│   │   ├── store/      # Zustand stores
│   │   ├── types/      # TypeScript type definitions
│   │   └── test-utils/ # Test infrastructure
│   └── data/           # JSON files synced from Sanity
├── studio-athletica/   # Standalone Sanity Studio
└── .webforge/          # WebForge project management
```

*Source: architecture.md lines 8-149*
