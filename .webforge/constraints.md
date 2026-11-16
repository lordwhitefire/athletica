# Project Constraints

> Real-world constraints discovered during intelligence scan.
> Sources: key-findings.md, tech-stack.md, context/constraints-and-preferences.md, context/key-decisions.md

---

## Nigerian Market Context

### Payment Providers
- **No payment integration built yet** — Checkout page shows "demo, no real payment" placeholder
- **Paystack** is the recommended provider for Nigeria (accepts Naira, local cards, USSD, bank transfer)
- **Stripe** needed for international customers (USD)
- Payment integration is the #1 blocker to going live
*Source: key-findings.md lines 89-90, key-findings.md line 160*

### Shipping
- **No shipping calculation implemented** — Address collected but no zones/cost configured
- Nigeria-only shipping assumed (domestic courier)
- International shipping would require additional integration
- Delivery time estimates not shown to customers
*Source: key-findings.md lines 92-93*

### Connectivity
- Nigerian users face variable internet quality — page load times matter
- Cart is purely client-side (cookie-based) — no cross-device sync, lost if cookies cleared
- No offline/PWA support despite power outages and poor connectivity being common
*Source: data-flow.md lines 154-156*

### Currency
- Naira (NGN) likely the primary currency for Nigeria market
- Product schema shows `currency` field in `productPrice` type
- Dual-currency (NGN/USD) support may be needed
*Source: data-flow.md lines 69-70*

---

## Technical Constraints

### Supabase (Free Tier)
- **1 project** max on free tier
- **500 MB database** — adequate for profiles table (1 table currently)
- No automatic backup on free tier
- **Rate limits**: Not documented but free tier has row count limits
- Current schema: only `profiles` table — no orders, no order_items
*Source: data-flow.md lines 213-233*

### Upstash Redis (Free Tier)
- **10,000 commands/day** on free tier
- Currently used for rate limiting only (auth: 5/60s, upload: 10/60s)
- If traffic grows beyond free tier, needs upgrade planning
*Source: tech-stack.md line 73, key-findings.md line 33*

### Sanity CMS (Free Tier)
- **Free tier includes**: 2 datasets (production currently used), 100k documents
- **No SLA** on free tier — could affect admin panel availability
- Sanity webhook triggers GitHub Actions workflow to sync JSON files
- Sanity Studio is standalone (not embedded in Next.js)
*Source: tech-stack.md lines 71-72, tech-stack.md lines 154-162*

### Hosting
- **Vercel** for frontend (hobby tier)
  - 100 GB bandwidth/month
  - 6000 build minutes/month
  - No team features
  - No SLA
- **No staging environment** — only production + local dev
- Domain status: unknown (likely `.com.ng` or `.com`)
*Source: key-findings.md lines 97-98, tech-stack.md lines 143-151*

### GitHub Actions
- Free tier: 2000 minutes/month
- Only one workflow exists: `sanity-json-update.yml` (Sanity → JSON sync)
- **No CI for tests** — tests don't run on PR/commit
*Source: key-findings.md line 95, tech-stack.md lines 143-151*

---

## Architecture Constraints

### Data Sync Model
- Frontend reads from static JSON files (synced from Sanity via GitHub workflow)
- **Trade-off**: Fast reads, but stale data until next sync (minutes delay)
- Admin mutations write directly to Sanity AND call `revalidatePath()` for cache busting
*Source: data-flow.md lines 27-43, architecture.md lines 234-243*

### No Backend Server
- No Node/Express backend (planned for future per goal.md)
- All "backend" logic is in Next.js API routes and Server Actions
- No background job queue for async tasks (email, notifications, etc.)
*Source: goal.md lines 3-7*

### Cart Limitations
- Purely client-side (cookie-based) — no database storage
- Per-device only, no cross-device sync
- Cart lost if cookies cleared or on different device
- Guest checkout works but no account linking
*Source: data-flow.md lines 150-156*

### Order Management
- **No orders infrastructure at all** — No `orders` or `order_items` tables
- No admin panel for managing orders
- No customer order history
- This blocks any real transaction flow
*Source: key-findings.md line 90*

---

## Developer Constraints

### Git Repository
- `frontend/` directory is gitignored at the root level
- Root repo contains the WebForge config, legacy content, and utility files
- Two separate codebases managed together
*Source: AGENTS.md line 14, context/constraints-and-preferences.md line 21*

### Environment Variables
- **No `.env.example` file** — new developers cannot bootstrap without reading source code
- 14 environment variables needed (Supabase, Upstash, Sentry, Sanity)
- Several are secrets (SERVICE_ROLE_KEY, SENTRY_AUTH_TOKEN, SANITY_WRITE_TOKEN, SANITY_WEBHOOK_SECRET)
*Source: tech-stack.md lines 125-140*

### Missing Tooling
- **No Prettier config** — code style inconsistent in places
- **No pre-commit hooks** (Husky + lint-staged)
- **No test CI** — tests only run manually
*Source: tech-stack.md lines 148-151*

---

## Law 2 File Size Issues

Several files exceed the 300-line limit:
- `INVENTORY.md` — 1098 lines
- `athletica-audit.md` — 800 lines
- `src/lib/actions/homepage.ts` — 413 lines
- `src/lib/getHomepageJson.ts` — 304 lines
- Legacy `HomepageEditor.tsx` likely exceeds 300 lines

These should be refactored in the build phase to comply with Law 2.

*Source: key-findings.md lines 174-186*
