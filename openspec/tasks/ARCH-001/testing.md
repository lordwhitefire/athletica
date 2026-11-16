# Tester Task: ARCH-001 — Supabase Schema Verification

## What behavior to verify

The Supabase schema exists, has the correct structure, and behaves correctly for the two roles that matter: **public (anon)** reads and **admin (service role)** writes. The schema must support everything downstream: product catalog, content management, admin operations.

## How to verify — using Lighthouse + Chrome

You have Lighthouse at `~/Lighthouse`. Load it in Google Chrome. The goal is to **see the schema working in the browser**, not just trust a migration success message.

### Step 1: Confirm migrations applied

1. Open Chrome, go to your Supabase project dashboard (the web UI)
2. Navigate to **Database → Tables**
3. Verify all 7 tables exist: `products`, `categories`, `brands`, `homepage_sections`, `navigation`, `editorial_content`, `site_settings`
4. Click each table → **Columns** — verify the columns match the task.md specification (types, nullability, defaults)
5. Check **Indexes** — confirm the filtering indexes exist (especially on `products.status`, `products.category_id`, `products.brand_id`, `products.price`)
6. Check **Foreign Keys** — verify all 5 FKs exist and point to the right tables
7. Check **RLS** — each table should show "Row Level Security: Enabled"
8. Click **Policies** — verify:
   - Public tables have a `SELECT` policy for `anon` role (or `authenticated` + `anon`)
   - No `INSERT`/`UPDATE`/`DELETE` policies for `anon`
   - Service role has full access (by default, service role bypasses RLS)

### Step 2: Test public (anon) reads in the browser

1. In Supabase dashboard, go to **API → REST API** → copy the **anon public** API key and project URL
2. Open a new Chrome tab → open DevTools (F12) → **Console**
3. Test a public read that the customer site will do:

```javascript
// Replace with your project URL and anon key
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const ANON_KEY = 'YOUR_ANON_KEY';

async function testPublicReads() {
  // 1. Published products only (customer-facing)
  const products = await fetch(`${SUPABASE_URL}/rest/v1/products?status=eq.published&select=id,slug,name,price,image_links`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  }).then(r => r.json());
  console.log('Published products:', products);

  // 2. All categories (for navigation)
  const categories = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,slug,name,parent_id`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  }).then(r => r.json());
  console.log('Categories:', categories);

  // 3. Brands
  const brands = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=id,slug,name,logo_link`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  }).then(r => r.json());
  console.log('Brands:', brands);

  // 4. Homepage sections (ordered)
  const sections = await fetch(`${SUPABASE_URL}/rest/v1/homepage_sections?select=*&order=order.asc`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  }).then(r => r.json());
  console.log('Homepage sections:', sections);

  // 5. Navigation tree
  const nav = await fetch(`${SUPABASE_URL}/rest/v1/navigation?select=*&order=order.asc`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  }).then(r => r.json());
  console.log('Navigation:', nav);

  // 6. Editorial content
  const editorial = await fetch(`${SUPABASE_URL}/rest/v1/editorial_content?select=*`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  }).then(r => r.json());
  console.log('Editorial content:', editorial);

  // 7. Site settings
  const settings = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?select=*`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  }).then(r => r.json());
  console.log('Site settings:', settings);
}

testPublicReads().catch(console.error);
```

**What to observe in Console**:
- Each request returns `200 OK` and an array (empty is fine — no data yet)
- No `401`, `403`, `400`, or RLS errors
- Response shape matches the columns you saw in the dashboard

### Step 3: Test admin (service role) writes — via Supabase dashboard

You can't run service-role writes from the browser safely (exposes the key). Instead, use the Supabase dashboard **SQL Editor**:

1. Go to **SQL Editor** → New query
2. Test a service-role insert (this uses the dashboard's service role implicitly):

```sql
-- Insert a test category
INSERT INTO categories (slug, name) VALUES ('test-football-boots', 'Test Football Boots') RETURNING *;

-- Insert a test brand
INSERT INTO brands (slug, name, logo_link) VALUES ('test-brand', 'Test Brand', 'https://cdn.sanity.io/images/.../logo.png') RETURNING *;

-- Insert a test product (links to above)
INSERT INTO products (slug, name, model, price, gender, color, sizes, attributes, status, asin, category_id, brand_id, image_links)
VALUES (
  'test-product-1',
  'Test Product',
  'Test Model',
  129.99,
  'Men',
  'Black',
  ARRAY['8', '9', '10'],
  '{"material": "synthetic", "sole": "FG"}'::jsonb,
  'published',
  'B0TEST1234',
  (SELECT id FROM categories WHERE slug = 'test-football-boots'),
  (SELECT id FROM brands WHERE slug = 'test-brand'),
  ARRAY['https://cdn.sanity.io/images/.../img1.jpg']
) RETURNING *;

-- Insert a homepage section referencing the category
INSERT INTO homepage_sections (type, "order", title, copy, category_id, limit, image_links)
VALUES (
  'carousel',
  1,
  'Featured Football Boots',
  'Check out our latest boots',
  (SELECT id FROM categories WHERE slug = 'test-football-boots'),
  12,
  ARRAY['https://cdn.sanity.io/images/.../banner.jpg']
) RETURNING *;
```

3. Run each → confirm they return the inserted row with generated UUIDs and timestamps
4. Verify the inserts appear in **Table Editor** for each table

### Step 4: Test that public reads CANNOT write

Back in Chrome Console (using anon key), try an insert — it MUST fail:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const ANON_KEY = 'YOUR_ANON_KEY';

fetch(`${SUPABASE_URL}/rest/v1/products`, {
  method: 'POST',
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  },
  body: JSON.stringify({
    slug: 'should-fail',
    name: 'Should Fail',
    price: 99,
    status: 'published'
  })
}).then(r => {
  console.log('Status:', r.status); // MUST be 401 or 403
  return r.json();
}).then(console.log).catch(console.error);
```

**What to observe**: Status `401` or `403` (RLS blocks anon writes). If it's `201`, RLS is broken — **fail**.

### Step 5: Verify generated TypeScript types exist

1. In your editor, open `frontend/src/lib/supabase/types.ts` (or wherever the generated types were committed)
2. Verify it contains types for all 7 tables with correct column types:
   - `products`: `id: string`, `slug: string`, `name: string | null`, `price: number | null`, `attributes: Json | null`, `image_links: string[] | null`, etc.
   - `categories`, `brands`, `homepage_sections`, `navigation`, `editorial_content`, `site_settings` all present

## What to report

Write a plain-language report covering:

1. **Schema verification** — Did all 7 tables appear with correct columns, indexes, FKs, RLS?
2. **Public reads** — Did the anon-key REST calls return 200 with correct shapes? (Empty arrays are fine)
3. **Admin writes** — Did service-role inserts via SQL Editor succeed and appear in Table Editor?
4. **RLS enforcement** — Did the anon-key INSERT attempt fail with 401/403?
5. **TypeScript types** — Do the generated types match the schema?
6. **Any surprises** — Missing indexes? Wrong FK direction? RLS policy gaps? Type mismatches?

**No screenshots. No UI checks.** Just: *Does the schema behave correctly for the two roles that matter?*