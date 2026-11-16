# Design: Rollout 1 Architecture

## Repository Layout

```
athletica/                 <- git root (moved up from frontend/, history preserved)
├── .gitignore             <- /* + !/frontend/ + !/rollout/ (everything else ignored)
├── frontend/              <- Development app: the full football store + its office
│   └── (existing routes: /, /admin/*, storefront, cart, checkout, accounts …)
│       NOT public. Development/private only.
└── rollout/               <- Production app: the public showroom
    ├── /product/:slug             Customer Product Details
    ├── /go/:id                    Backend click recorder + Amazon redirect
    ├── /admin/login               Office sign-in (after auth is live)
    ├── /admin/products            Product Database
    ├── /admin/products/[id]/edit  Product Editor
    ├── /admin/analytics           Basic Analytics (Views, Clicks, CTR, source split)
    └── /                          Plain 404
```

Only `frontend/` and `rollout/` are tracked at the git root. Everything else at the root (`supabase/`, `studio-athletica/`, `data/`, `scripts/`, `openspec/`, `node_modules/`, generated `*.txt` exports) is ignored and never committed.

## Git History Move (ROLL-00)

1. Move `frontend/.git` up to the repository root (history preserved — nothing is deleted).
2. Re-point the index to the new locations for every ALREADY-TRACKED file: stage `frontend/<path>` and remove the old `<path>` entry. Do NOT use `git mv` for the remap — after the `.git` move git resolves old paths against the new root, so the sources "don't exist" and `git mv` fails ("bad source"). The correct pattern (git detects renames at commit time, per Pro Git "Moving Files"):

   ```bash
   git ls-files -z | while IFS= read -r -d '' f; do
     git add -- "frontend/$f" 2>/dev/null || true
     git rm --cached --quiet -- "$f" 2>/dev/null || true
   done
   ```

3. Add ONE record commit: `chore: move repo root up to athletica`.
4. **No uncommitted or untracked file is committed.** Files the user has not committed or tracked stay exactly as they are.
5. **No push.** The commit stays local; the owner pushes after reviewing.

## App Isolation (replaces the old environment-switch plan)

The earlier plan used `NEXT_PUBLIC_SYSTEM_TYPE=rollout|mature` and middleware that blocked Development routes in production. That is **no longer needed**: the two systems are physically separate apps, so isolation is structural, not runtime.

- Production app (`rollout/`) is the public showroom. It reads only Production environment variables.
- Development app (`frontend/`) is the full football store plus its office. It is not public; it reads only Development environment variables.
- No middleware route blocking. The Development app simply is not the deployed public app; a Development-only path on the public domain 404s because the Production app does not contain it.

## Data Isolation — one Supabase project, two schemas

The Production app and the Development app share **one Supabase project**. They do **not** use separate databases.

- `public` schema — Development app (the full football store + its office).
- `rollout` schema — Production app (the public showroom).
- No cross-schema queries. A Production query reads `rollout` only; a Development query reads `public` only.

### Production schema (`rollout`)

```sql
CREATE SCHEMA IF NOT EXISTS rollout;

-- Self-contained product table (no foreign keys to the Development hierarchy)
CREATE TABLE rollout.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unpublished' CHECK (status IN ('published', 'unpublished')),

  -- Identity
  gender TEXT,
  color TEXT,
  asin TEXT,
  sku TEXT,

  -- Description
  collection TEXT,
  tagline TEXT,
  subtitle TEXT,
  intro TEXT,
  key_benefits JSONB DEFAULT '[]'::jsonb,
  technical_details JSONB DEFAULT '[]'::jsonb,
  box_contents JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes TEXT[] NOT NULL DEFAULT '{}'::text[],
  sizes_detail TEXT,

  -- Attributes
  adjustment TEXT,
  range TEXT,
  sole_type TEXT,
  upper_material TEXT,
  traction TEXT,
  price DECIMAL(10,2), -- nullable and optional; never shown on the public page

  -- Images
  main_image TEXT,
  images TEXT[] DEFAULT '{}',

  -- SEO
  meta JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views and clicks, attributed to the two platform tags
CREATE TABLE rollout.analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT REFERENCES rollout.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  source TEXT CHECK (source IN ('instagram', 'whatsapp')), -- NULL = direct/unknown
  visitor_hash TEXT, -- daily SHA-256; the raw IP is never stored
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rollout_products_status ON rollout.products(status);
CREATE INDEX idx_rollout_products_slug ON rollout.products(slug);
CREATE INDEX idx_rollout_analytics_product ON rollout.analytics(product_id);
CREATE INDEX idx_rollout_analytics_created ON rollout.analytics(created_at);
CREATE INDEX idx_rollout_analytics_source ON rollout.analytics(source);
CREATE INDEX idx_rollout_analytics_visitor ON rollout.analytics(visitor_hash);
```

The base `supabase-rollout-schema.sql` creates the tables; `supabase-rollout-schema-updates.sql` adds `box_contents`, `sizes`, and `sizes_detail`. The analytics `source` and `visitor_hash` columns are added by the ROLL-12 migration.

### Required: scope every client to `rollout`

`@supabase/supabase-js` defaults `db.schema` to **`public`**. On this shared project, `public` is the Development app. Every Production client MUST select the `rollout` schema:

```ts
createClient<Database, 'rollout'>(url, key, { db: { schema: 'rollout' } })
// or
supabase.schema('rollout').from('products')
```

The current `rollout/src/lib/supabase/server.ts` does neither, so its queries can hit `public.products` (the Development table) or fail. This is a correctness bug, not a style issue. The admin, public, and `@supabase/ssr` server clients all need the `rollout` schema for product queries.

### Development schema (`public`)

The full football store and office, unchanged:
- `products` (with `model_id` foreign key)
- `models`, `brands`, `categories` hierarchy
- `navigation`, `settings`, `media` tables
- Full relationship graph

## Route Mapping

No route conflicts exist: the apps are separate directories, each owns its routes outright. The Production app owns `/product/:slug`, `/go/:id`, `/admin/login`, `/admin/products`, `/admin/products/[id]/edit`, and `/admin/analytics`. The Development app owns its full storefront and office routes. A Development-only path on the public domain 404s because the Production app does not contain it. `/` in the Production app is a plain 404.

## Data Flow

### Production Product Creation

```
Admin creates a product at /admin/products/new (Production app)
  ↓
Form submits to rollout.products
  ↓
Product appears in /admin/products
  ↓
When published, accessible at /product/:slug
```

### Public Loop (the only customer path)

```
Instagram link → /product/product-1?utm_source=instagram ─┐
WhatsApp link  → /product/product-2?utm_source=whatsapp ─┤
                                                         ├→ SHOP PRODUCT
                                                         │   → /go/:id?source=...
                                                         │   → server records click
                                                         │   → 302 to Amazon
                                                         └→ server records view
```

- The product page records the view server-side with the source and daily `visitor_hash`.
- The CTA is a normal link to `/go/:id`; the route re-checks the product, ASIN, and tag, records the click, then redirects. No `window.open`.
- If the product is unpublished or the ASIN/tag/store is missing, the CTA is disabled and no click is recorded.

### Feature Graduation (Development → Production)

```
1. Feature developed and tested in the Development app
2. Schema adapted for Production (simplified if needed)
3. Components extracted/refactored into the rollout/ app
4. Production routes updated
5. Deployed to production
```

## Public Product Page (Production app)

- `/product/:slug` loads only published `rollout.products`.
- No price or currency is displayed. The public page never renders `$`.
- `/`, a nonexistent product, and an unpublished product return a plain 404. No redirect, no product-specific "not found" copy.
- `generateMetadata` supplies title, description, and Open Graph image. The root layout uses Athletica metadata, not "Create Next App".
- Real content only: no mock box contents, no Unsplash/placeholder fallbacks. If a section has no data, omit it.
- Product images use `next/image` with a `cdn.sanity.io` remote pattern, `fill` + `sizes` inside the existing fixed-ratio containers, `priority` on the hero, lazy loading elsewhere, and alt text.
- The page is rendered per request (reads `searchParams`/headers); it must not be statically cached, or views will be lost.
- A short Amazon Associates disclosure is visible.

## Analytics Recording (Production app)

- A view is recorded server-side by the product page. A click is recorded server-side by `/go/:id`.
- `source` comes from `utm_source`: `instagram` or `whatsapp` (lowercase); any other value becomes `NULL` (direct/unknown).
- `visitor_hash = SHA-256(ip + user-agent + UTC date + ANALYTICS_HASH_SALT)`. Only the hash is stored; the raw IP is never stored.
- Known crawler/preview/uptime user agents are skipped. Instagram and WhatsApp in-app browser user agents are treated as real visitors, not bots.
- Recording is rate-limited per `visitor_hash` (Upstash sliding window). Over-limit events are not counted. The page still renders and the redirect still happens.
- Analytics failures are logged to Sentry and never block the page or the Amazon redirect.
- No client-side view/click beacon is needed. The public `/api/analytics` POST is retired.

## Affiliate Configuration and CTA (Production app)

- Configuration is server-side env: `AMAZON_ASSOCIATES_TAG` and `AMAZON_STORE` (e.g. `www.amazon.com`). No hardcoded `athletica-20`.
- The tag and store are validated; missing, empty, or placeholder values produce no URL.
- The product page checks availability server-side: published + ASIN + real tag/store. If available, the CTA is a normal link to `/go/:id?source=...`. If not, the CTA is visible, greyed out, disabled, and says "Link coming soon"; no click is recorded.
- `/go/:id` re-checks published + ASIN + config, records the click (source + hash), then 302s to Amazon. If analytics fails, it still redirects. The generated URL is never stored on the product.
- The client component receives display data plus an `affiliateAvailable` flag. It does not receive the ASIN and never constructs an Amazon URL.

## Admin Authentication (Production app)

- `/admin/*` is the client's office. It is invite-only: public sign-ups are disabled.
- The admin role lives in `app_metadata.role = 'admin'` (server-controlled; users cannot edit it).
- `@supabase/ssr` provides the cookie-based server client. Every admin page, server action, and `/api/admin/*` route calls `getUser()` (not `getSession()`) and checks the role. The service-role key stays server-only.
- Next 16 `proxy.ts` refreshes the session and does an optimistic redirect. It is **not** the authorization check; the layout and each route do the real check.
- Until auth is live, `proxy.ts` returns 404 for `/admin/*` and `/api/admin/*`. This is required for the first public deploy.
- After auth is live, `/admin/login` is public; unauthenticated pages redirect there; APIs return 401; authenticated non-admins get 404.
- Protect `/api/admin/products`, `/api/admin/products/[id]`, and `/api/admin/media/*`.
- There is no route or UI that creates admins. The invite and role are set in Supabase.
- The admin client is created only after the auth check.

## Monitoring and Images

- Sentry `@sentry/nextjs` covers server, client, and edge errors. `sendDefaultPii: false`; scrub cookies, auth headers, user email, and IP. Email alert on new issues/error rate. Uptime ping on the two product URLs.
- Sentry env: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- Product images: `next/image` with `cdn.sanity.io` only; the admin accepts Sanity URLs/uploads and rejects other domains with a clear error. The Sanity write token stays server-side.

## Component Architecture

### Production-Specific Components (live inside `rollout/`)

- `product-service` — queries `rollout.products`
- `analytics-service` — records views/clicks and queries `rollout.analytics`
- `affiliate-service` — derives the Amazon URL from ASIN + env config
- Admin auth helpers — `@supabase/ssr` client, `getUser()`, `requireAdmin()`
- Rate-limit helper — Upstash sliding window per `visitor_hash`
- Product Details page (black/lemon design)
- Product database + editor UI
- Basic analytics dashboard (later)
- UI primitives (toasts, confirmations, async states)

### Development-Specific Components (live in `frontend/`)

- `ProductService` — queries the `public` schema with hierarchy
- `AnalyticsService` — full analytics suite
- Complex admin/office pages (categories, brands, models)
- Import center, media library, etc.

### Shared Components

None initially. If common primitives are proven to be needed, extract them into a shared package later as a separate decision.

## Deployment Strategy

### One public Vercel project; Development is private/dev-only

| | Production (public) | Development |
|---|---|---|
| Root Directory | `rollout` | `frontend` |
| Domain | fixed `*.vercel.app` | local dev / private URL; never the customer URL |
| Data | one Supabase project, `rollout` schema | same project, `public` schema |

- **One public Vercel project** for the Production app. The Development app is not public. If it is deployed for the team, it is private/password-protected.
- No separate staging environment for the MVP. Vercel previews are code-review only: analytics recording is off and `/admin/*` is 404 when `VERCEL_ENV !== 'production'`. This prevents preview traffic from polluting production counts and prevents previews from writing to the production database through the office.
- `NEXT_PUBLIC_SITE_URL` is fixed before any backlink is posted. `metadataBase` uses it; previews fall back to `VERCEL_URL`.
- Remove `NEXT_PUBLIC_SYSTEM_TYPE`; isolation is structural.

### Environment variables

| Variable | Scope |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | both apps (Production on Vercel; Development local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | both apps |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only, Production |
| `SANITY_PROJECT_ID`, `SANITY_DATASET` | server-only, Production |
| `SANITY_WRITE_TOKEN` | server-only, Production |
| `AMAZON_ASSOCIATES_TAG`, `AMAZON_STORE` | server-only, Production |
| `ANALYTICS_HASH_SALT` | server-only, Production |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | server-only, Production |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Production |
| `NEXT_PUBLIC_SITE_URL` | Production |

### Local Development

```bash
# Development app (the full store + office; developers only)
cd frontend && npm run dev

# Production app (the public showroom)
cd rollout && npm run dev
```

### Rollback and uptime

- Rollback: redeploy the previous Vercel build; database changes are additive.
- Uptime ping on the two product URLs (Sentry does not report "the site is down").
- Smoke test: product page loads; CTA redirects with the real tag; unauthenticated admin is rejected; view/click rows carry `source` and `visitor_hash`.

## Security Considerations

1. **Data isolation** — One Supabase project; both clients select the `rollout` schema explicitly (`db.schema='rollout'`); no cross-schema queries.
2. **App isolation** — The Development app is never the public deployment.
3. **Admin authentication** — `@supabase/ssr` + `getUser()` + `app_metadata.role`; every admin page/action/API; 404 until auth is live; service-role key server-only.
4. **API routes** — The public surface is the product page and `/go/:id`; all `/api/admin/*` routes require an admin; public writes are rate-limited.
5. **RLS** — Enabled on `rollout.products` and `rollout.analytics`; policies in `supabase-rollout-rls-policies.sql`; the owner applies them.
6. **Sanity** — The write token is server-only.
7. **Sentry** — `sendDefaultPii: false`; cookies/auth headers/email/IP are scrubbed.

## RLS Policy Design

### Current State

- RLS is **enabled** on `rollout.products` and `rollout.analytics`.
- The four policies are defined in `rollout/supabase-rollout-rls-policies.sql`:
  - `anon` SELECT published products
  - `service_role` ALL products
  - `anon` INSERT analytics
  - `service_role` SELECT analytics
- The owner applies the SQL in the Supabase SQL editor and exposes/grants the `rollout` schema.
- The analytics insert policy stays `WITH CHECK (true)`; the table CHECKs constrain `event_type` and `source`. Adding `source` and `visitor_hash` does not require a policy change.

### Policies (defined in SQL)

#### `rollout.products` policies:
```sql
-- Public can read published products
CREATE POLICY "anon_can_read_published_products"
  ON rollout.products
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Admin can do everything (service_role bypasses RLS, but explicit policy for clarity)
CREATE POLICY "admin_full_access_products"
  ON rollout.products
  FOR ALL
  TO service_role
  USING (true);
```

#### `rollout.analytics` policies:
```sql
-- Public can insert view/click events
CREATE POLICY "anon_can_insert_analytics"
  ON rollout.analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin can read analytics
CREATE POLICY "admin_can_read_analytics"
  ON rollout.analytics
  FOR SELECT
  TO service_role
  USING (true);
```

### Dashboard Steps Required

1. **Expose `rollout` schema to Data API** — In Supabase dashboard → Settings → API → Schema → add `rollout`
2. **Run GRANT statements** — Grant `anon`, `authenticated`, `service_role` on schema + tables + sequences
3. **Apply RLS policies** — Run the SQL from `rollout/supabase-rollout-rls-policies.sql` in the SQL Editor

### Security Notes

- RLS is the row-level filter; grants are the access-level filter. Both are needed.
- The four policies above are what allow the public read and the analytics insert; without them, `anon` sees nothing (secure by default).
- `service_role` always bypasses RLS — admin operations are unaffected.
- Keep grants minimal and pair them with policies.

## Migration Path

When a feature graduates from Development to Production:

1. **Schema migration** — Add/modify `rollout.products` columns if needed
2. **Data migration** — Copy relevant data from the Development `public` schema to `rollout` (if applicable)
3. **Component update** — Swap Development components for Production versions
4. **Route update** — Update route handlers to use the new service
5. **Testing** — Verify the feature in the Production context
6. **Deploy** — Push to production